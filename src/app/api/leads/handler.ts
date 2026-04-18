import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, type Lead } from '@/lib/db/supabase';
import {
  buildFallbackQueueEntry,
  buildHardFailureResponse,
  buildQueuedDegradedResponse,
  buildSuccessResponse,
  normalizeLeadCapturePayload,
} from '@/lib/leads/capture';
import {
  sendLeadNotification,
  type NotificationPayload,
} from '@/lib/notifications/telegram';

function getLeadCaptureArtifactRoot() {
  return process.env.LEAD_CAPTURE_ARTIFACT_ROOT || path.join(process.cwd(), 'runtime_artifacts', 'lead_capture');
}

function buyerSaveFailureMessage() {
  return 'We could not save your request. Please call us at (973) 500-1010.';
}

async function writeArtifact(subdir: string, filename: string, payload: unknown) {
  const dir = path.join(getLeadCaptureArtifactRoot(), subdir);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

async function writeOperatorAlertArtifact(input: {
  captureId: string;
  kind: 'persistence_failure' | 'notification_failure';
  operatorAlerted: boolean;
  normalizedPayload: ReturnType<typeof normalizeLeadCapturePayload>['payload'];
  reason: string;
  details?: unknown;
}) {
  return writeArtifact('operator_alerts', `${input.captureId}.json`, {
    capture_id: input.captureId,
    kind: input.kind,
    operator_alerted: input.operatorAlerted,
    reason: input.reason,
    payload: input.normalizedPayload,
    details: input.details ?? null,
    created_at: new Date().toISOString(),
  });
}

async function persistFallbackQueue(input: {
  normalized: ReturnType<typeof normalizeLeadCapturePayload>;
  degradedReason: string;
  errorDetails: unknown;
  supabaseAdmin: LeadsTableInsert;
}) {
  const alertArtifactPath = path.join(
    getLeadCaptureArtifactRoot(),
    'operator_alerts',
    `${input.normalized.captureId}.json`
  );

  const entry = buildFallbackQueueEntry(input.normalized, {
    degradedReason: input.degradedReason,
    alertArtifactPath,
  });

  const queueRow: FallbackQueueRow = {
    queue_id: entry.queueId,
    capture_id: entry.captureId,
    retry_owner: entry.retryOwner,
    retry_deadline: entry.retryDeadline,
    degraded_reason: entry.degradedReason,
    alert_artifact_path: entry.alertArtifactPath,
    payload: entry.payload,
    error_details: input.errorDetails,
    created_at: entry.createdAt,
  };

  const { data, error } = await input.supabaseAdmin
    .from('lead_capture_fallback_queue')
    .insert(queueRow)
    .select('queue_id')
    .single();

  if (error || !data) {
    throw error ?? new Error('Fallback queue insert returned no data');
  }

  let queueArtifactPath: string | null = null;
  try {
    queueArtifactPath = await writeArtifact('fallback_queue', `${entry.queueId}.json`, queueRow);
  } catch (artifactError) {
    console.warn('Fallback queue persisted durably but local artifact write failed:', artifactError);
  }

  return {
    entry,
    queueArtifactPath,
    alertArtifactPath,
    queueRecordLocator: `supabase:lead_capture_fallback_queue:${data.queue_id}`,
  };
}

async function writePersistedLeadArtifact(input: {
  captureId: string;
  lead: Lead;
  normalized: ReturnType<typeof normalizeLeadCapturePayload>;
  notificationSent: boolean;
  operatorAlerted: boolean;
  alertArtifactPath?: string;
}) {
  return writeArtifact('persisted_records', `${input.captureId}.json`, {
    capture_id: input.captureId,
    lead_id: input.lead.id,
    persisted_at: input.lead.created_at ?? input.normalized.insert.created_at,
    operator_alerted: input.operatorAlerted,
    notification_sent: input.notificationSent,
    alert_artifact_path: input.alertArtifactPath ?? null,
    stored_fields: {
      subject: input.normalized.payload.subject,
      source: input.normalized.payload.source,
      page_origin: input.normalized.payload.page_origin,
      cta_origin: input.normalized.payload.cta_origin,
      listing_id: input.normalized.payload.listing_id,
      listing_slug: input.normalized.payload.listing_slug,
      listing_title: input.normalized.payload.listing_title,
      service_slug: input.normalized.payload.service_slug,
      timeline: input.normalized.payload.timeline,
      budget_confirmed: input.normalized.payload.budget_confirmed,
      use_case: input.normalized.payload.use_case,
    },
    persisted_row: input.lead,
    expected_insert: input.normalized.insert,
    created_at: new Date().toISOString(),
  });
}

type LeadInsertResult = {
  data: Lead | null;
  error: unknown;
};

type FallbackQueueInsertResult = {
  data: { queue_id: string } | null;
  error: unknown;
};

type FallbackQueueRow = {
  queue_id: string;
  capture_id: string;
  retry_owner: string;
  retry_deadline: string;
  degraded_reason: string;
  alert_artifact_path: string;
  payload: ReturnType<typeof normalizeLeadCapturePayload>['payload'];
  error_details: unknown;
  created_at: string;
};

type LeadsTableInsert = {
  from(table: 'leads'): {
    insert(row: ReturnType<typeof normalizeLeadCapturePayload>['insert']): {
      select(): {
        single(): PromiseLike<LeadInsertResult> | LeadInsertResult;
      };
    };
  };
  from(table: 'lead_capture_fallback_queue'): {
    insert(row: FallbackQueueRow): {
      select(columns: 'queue_id'): {
        single(): PromiseLike<FallbackQueueInsertResult> | FallbackQueueInsertResult;
      };
    };
  };
};

export type LeadCaptureHandlerDependencies = {
  getSupabaseAdmin: () => LeadsTableInsert;
  sendLeadNotification: (payload: NotificationPayload) => Promise<boolean>;
};

const defaultLeadCaptureDependencies: LeadCaptureHandlerDependencies = {
  getSupabaseAdmin: () => getSupabaseAdmin() as unknown as LeadsTableInsert,
  sendLeadNotification,
};

export function createLeadCaptureHandler(
  deps: LeadCaptureHandlerDependencies = defaultLeadCaptureDependencies
) {
  return async function leadCaptureHandler(request: Request | NextRequest) {
    try {
      const body = await request.json();
      const normalized = normalizeLeadCapturePayload(body);

      if (!normalized.payload.email && !normalized.payload.phone) {
        return NextResponse.json(
          {
            ...buildHardFailureResponse({
              errorCode: 'contact_method_required',
              message: 'Please provide an email address or phone number.',
              operatorAlerted: false,
            }),
            error: 'Please provide an email address or phone number.',
          },
          { status: 400 }
        );
      }

      const supabaseAdmin = deps.getSupabaseAdmin();

      try {
        const { data, error } = await supabaseAdmin
          .from('leads')
          .insert(normalized.insert)
          .select()
          .single();

        if (error || !data) {
          throw error ?? new Error('Lead insert returned no data');
        }

        const lead = data as Lead;
        const notificationSent = await deps.sendLeadNotification({
          lead,
          conversationSummary: normalized.insert.conversation_summary,
          inventoryInterests: normalized.interests,
        });

        if (!notificationSent) {
          const alertArtifactPath = await writeOperatorAlertArtifact({
            captureId: normalized.captureId,
            kind: 'notification_failure',
            operatorAlerted: false,
            normalizedPayload: normalized.payload,
            reason: 'telegram_notification_failed_after_persist',
            details: {
              lead_id: lead.id,
              persisted_at: lead.created_at ?? normalized.insert.created_at,
            },
          });

          await writePersistedLeadArtifact({
            captureId: normalized.captureId,
            lead,
            normalized,
            notificationSent: false,
            operatorAlerted: false,
            alertArtifactPath,
          });

          return NextResponse.json(
            {
              ...buildSuccessResponse({
                leadId: lead.id,
                persistedAt: lead.created_at ?? normalized.insert.created_at,
                operatorAlerted: false,
              }),
              message:
                'Your request was saved successfully. Our instant alert failed, so follow-up may be slightly delayed.',
              alert_artifact_path: alertArtifactPath,
            },
            { status: 201 }
          );
        }

        await writePersistedLeadArtifact({
          captureId: normalized.captureId,
          lead,
          normalized,
          notificationSent: true,
          operatorAlerted: true,
        });

        return NextResponse.json(
          {
            ...buildSuccessResponse({
              leadId: lead.id,
              persistedAt: lead.created_at ?? normalized.insert.created_at,
              operatorAlerted: true,
            }),
            message: 'Your request was received and routed to our team.',
          },
          { status: 201 }
        );
      } catch (dbError) {
        try {
          const fallback = await persistFallbackQueue({
            normalized,
            degradedReason: 'primary_persistence_failed',
            errorDetails: {
              message: dbError instanceof Error ? dbError.message : String(dbError),
            },
            supabaseAdmin,
          });

          await writeOperatorAlertArtifact({
            captureId: normalized.captureId,
            kind: 'persistence_failure',
            operatorAlerted: true,
            normalizedPayload: normalized.payload,
            reason: 'primary_persistence_failed',
            details: {
              queue_id: fallback.entry.queueId,
              queue_artifact_path: fallback.queueArtifactPath,
              queue_record_locator: fallback.queueRecordLocator,
              error: dbError instanceof Error ? dbError.message : String(dbError),
            },
          });

          return NextResponse.json(
            {
              ...buildQueuedDegradedResponse({
                queueId: fallback.entry.queueId,
                captureId: fallback.entry.captureId,
                degradedReason: fallback.entry.degradedReason,
                retryOwner: fallback.entry.retryOwner,
                retryDeadline: fallback.entry.retryDeadline,
                operatorAlerted: true,
                alertArtifactPath: fallback.alertArtifactPath,
                queueRecordLocator: fallback.queueRecordLocator,
              }),
              message:
                'We captured your request into our recovery queue and flagged the team for manual follow-up. If this is urgent, please call us at (973) 500-1010.',
              queue_artifact_path: fallback.queueArtifactPath,
              queue_record_locator: fallback.queueRecordLocator,
            },
            { status: 202 }
          );
        } catch (fallbackError) {
          console.error('Lead capture failed without durable fallback:', dbError, fallbackError);

          return NextResponse.json(
            {
              ...buildHardFailureResponse({
                errorCode: 'lead_capture_unavailable',
                message: buyerSaveFailureMessage(),
                operatorAlerted: false,
              }),
              error: buyerSaveFailureMessage(),
            },
            { status: 500 }
          );
        }
      }
    } catch (error) {
      console.error('Leads API error:', error);
      return NextResponse.json(
        {
          ...buildHardFailureResponse({
            errorCode: 'invalid_lead_request',
            message: 'Failed to process lead request.',
            operatorAlerted: false,
          }),
          error: 'Failed to process lead request.',
        },
        { status: 500 }
      );
    }
  };
}
