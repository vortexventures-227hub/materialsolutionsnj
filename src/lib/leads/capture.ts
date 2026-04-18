export type LeadCaptureState = 'success' | 'degraded' | 'failure';

export type RawLeadCapturePayload = {
  visitor_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  subject?: string | null;
  message?: string | null;
  source?: string | null;
  page_origin?: string | null;
  cta_origin?: string | null;
  listing_id?: string | null;
  listing_slug?: string | null;
  listing_title?: string | null;
  service_slug?: string | null;
  timeline?: string | null;
  budget_confirmed?: boolean | null;
  use_case?: string | null;
};

type NormalizeOptions = {
  now?: string;
  captureIdFactory?: () => string;
};

type QueueOptions = {
  now?: string;
  queueIdFactory?: () => string;
  retryDeadline?: string;
  degradedReason: string;
  alertArtifactPath: string;
};

export type NormalizedLeadCapture = {
  captureId: string;
  payload: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    subject: string | null;
    message: string | null;
    source: string;
    page_origin: string | null;
    cta_origin: string | null;
    listing_id: string | null;
    listing_slug: string | null;
    listing_title: string | null;
    service_slug: string | null;
    timeline: string | null;
    budget_confirmed: boolean | null;
    use_case: string | null;
  };
  interests: string[];
  insert: {
    visitor_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    subject: string | null;
    source: string;
    page_origin: string | null;
    cta_origin: string | null;
    listing_id: string | null;
    listing_slug: string | null;
    listing_title: string | null;
    service_slug: string | null;
    timeline: string | null;
    budget_confirmed: boolean | null;
    use_case: string | null;
    score: number;
    status: 'warm';
    interests: string[];
    conversation_summary: string;
    created_at: string;
    last_activity: string;
  };
};

export type FallbackQueueEntry = {
  queueId: string;
  captureId: string;
  retryOwner: 'sales_ops';
  retryDeadline: string;
  degradedReason: string;
  alertArtifactPath: string;
  createdAt: string;
  payload: NormalizedLeadCapture['payload'];
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function buildConversationSummary(payload: NormalizedLeadCapture['payload']): string {
  const lines = [
    payload.subject ? `Subject: ${payload.subject}` : null,
    payload.source ? `Source: ${payload.source}` : null,
    payload.page_origin ? `Page Origin: ${payload.page_origin}` : null,
    payload.cta_origin ? `CTA Origin: ${payload.cta_origin}` : null,
    payload.listing_id ? `Listing ID: ${payload.listing_id}` : null,
    payload.listing_slug ? `Listing Slug: ${payload.listing_slug}` : null,
    payload.listing_title ? `Listing Title: ${payload.listing_title}` : null,
    payload.service_slug ? `Service Slug: ${payload.service_slug}` : null,
    payload.message ?? 'No message provided.',
  ];

  return lines.filter(Boolean).join('\n');
}

function buildInterests(payload: NormalizedLeadCapture['payload']): string[] {
  return [
    payload.subject,
    payload.source,
    payload.page_origin ? `page_origin:${payload.page_origin}` : null,
    payload.cta_origin ? `cta_origin:${payload.cta_origin}` : null,
    payload.listing_id ? `listing_id:${payload.listing_id}` : null,
    payload.listing_slug ? `listing_slug:${payload.listing_slug}` : null,
    payload.listing_title ? `listing_title:${payload.listing_title}` : null,
    payload.service_slug ? `service_slug:${payload.service_slug}` : null,
  ].filter((value): value is string => Boolean(value));
}

export function normalizeLeadCapturePayload(
  rawPayload: RawLeadCapturePayload,
  options: NormalizeOptions = {}
): NormalizedLeadCapture {
  const now = options.now ?? new Date().toISOString();
  const captureId = options.captureIdFactory?.() ?? makeId('capture');
  const payload = {
    name: clean(rawPayload.name),
    email: clean(rawPayload.email),
    phone: clean(rawPayload.phone),
    company: clean(rawPayload.company),
    subject: clean(rawPayload.subject),
    message: clean(rawPayload.message),
    source: clean(rawPayload.source) ?? 'contact_form',
    page_origin: clean(rawPayload.page_origin),
    cta_origin: clean(rawPayload.cta_origin),
    listing_id: clean(rawPayload.listing_id),
    listing_slug: clean(rawPayload.listing_slug),
    listing_title: clean(rawPayload.listing_title),
    service_slug: clean(rawPayload.service_slug),
    timeline: clean(rawPayload.timeline),
    budget_confirmed: rawPayload.budget_confirmed ?? null,
    use_case: clean(rawPayload.use_case),
  };

  const interests = [...new Set(buildInterests(payload))];
  const conversationSummary = buildConversationSummary(payload);

  return {
    captureId,
    payload,
    interests,
    insert: {
      visitor_id: clean(rawPayload.visitor_id) ?? captureId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      subject: payload.subject,
      source: payload.source,
      page_origin: payload.page_origin,
      cta_origin: payload.cta_origin,
      listing_id: payload.listing_id,
      listing_slug: payload.listing_slug,
      listing_title: payload.listing_title,
      service_slug: payload.service_slug,
      timeline: payload.timeline,
      budget_confirmed: payload.budget_confirmed,
      use_case: payload.use_case,
      score: 40,
      status: 'warm',
      interests,
      conversation_summary: conversationSummary,
      created_at: now,
      last_activity: now,
    },
  };
}

export function buildFallbackQueueEntry(
  normalized: NormalizedLeadCapture,
  options: QueueOptions
): FallbackQueueEntry {
  return {
    queueId: options.queueIdFactory?.() ?? makeId('queue'),
    captureId: normalized.captureId,
    retryOwner: 'sales_ops',
    retryDeadline: options.retryDeadline ?? new Date(Date.parse(options.now ?? new Date().toISOString()) + 15 * 60 * 1000).toISOString(),
    degradedReason: options.degradedReason,
    alertArtifactPath: options.alertArtifactPath,
    createdAt: options.now ?? new Date().toISOString(),
    payload: normalized.payload,
  };
}

export function buildQueuedDegradedResponse(entry: Pick<FallbackQueueEntry, 'queueId' | 'captureId' | 'degradedReason' | 'retryOwner' | 'retryDeadline' | 'alertArtifactPath'> & { operatorAlerted: boolean; queueRecordLocator?: string }) {
  return {
    success: true,
    degraded: true,
    captureState: 'degraded' as LeadCaptureState,
    lead_id: null,
    queue_id: entry.queueId,
    capture_id: entry.captureId,
    persisted_at: null,
    degraded_reason: entry.degradedReason,
    operator_alerted: entry.operatorAlerted,
    retry_owner: entry.retryOwner,
    retry_deadline: entry.retryDeadline,
    alert_artifact_path: entry.alertArtifactPath,
    ...(entry.queueRecordLocator && { queue_record_locator: entry.queueRecordLocator }),
  };
}

export function buildHardFailureResponse(input: {
  errorCode: string;
  message: string;
  operatorAlerted: boolean;
}) {
  return {
    success: false,
    degraded: false,
    captureState: 'failure' as LeadCaptureState,
    error_code: input.errorCode,
    retryable: true,
    operator_alerted: input.operatorAlerted,
    message: input.message,
  };
}

export function buildSuccessResponse(input: {
  leadId: string;
  persistedAt: string | null;
  operatorAlerted: boolean;
}) {
  return {
    success: true,
    degraded: false,
    captureState: 'success' as LeadCaptureState,
    lead_id: input.leadId,
    persisted_at: input.persistedAt,
    operator_alerted: input.operatorAlerted,
  };
}
