import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getSupabaseAdmin } from '@/lib/db/supabase';

export type DavidPendingResponseChannel = 'email' | 'sms' | 'voice' | 'telegram';
export type DavidPendingResponseStatus =
  | 'pending'
  | 'approved'
  | 'edited'
  | 'rejected'
  | 'escalated';
export type DavidApprovalPriority = 'urgent' | 'high' | 'normal';

export interface PendingResponseThreadMessage {
  role: 'prospect' | 'david' | 'system';
  content: string;
  timestamp: string;
}

export interface PendingResponseMetadata {
  prospect_name: string;
  prospect_email: string | null;
  unit_interest: string | null;
  prospect_last_message: string;
  escalation_gate_evaluation: string | null;
  channel_label: string;
  priority: DavidApprovalPriority;
  thread: PendingResponseThreadMessage[];
  reject_count?: number;
}

export interface DavidPendingResponseRecord {
  id: string;
  lead_id: string;
  conversation_id: string;
  channel: DavidPendingResponseChannel;
  draft_response: string;
  template_used: string | null;
  variables_filled: Record<string, unknown> | null;
  confidence_score: number | null;
  reasoning: string | null;
  status: DavidPendingResponseStatus;
  final_response: string | null;
  decision_by: string | null;
  decided_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DavidPendingResponseView extends DavidPendingResponseRecord {
  meta: PendingResponseMetadata;
}

export type PendingResponseDecisionAction = 'approve' | 'save_edit' | 'reject' | 'escalate';

export interface PendingResponseDecisionResult {
  record: DavidPendingResponseView;
  runtime_notified: boolean;
  artifact_path: string | null;
  webhook_status: number | null;
}

type LeadSummary = {
  id: string;
  name: string | null;
  email: string | null;
  subject: string | null;
  listing_title: string | null;
  conversation_summary: string | null;
};

const OPEN_APPROVAL_STATUSES: DavidPendingResponseStatus[] = ['pending', 'edited'];

const MOCK_PENDING_RESPONSES: DavidPendingResponseView[] = [
  {
    id: 'mock-dpr-1',
    lead_id: 'mock-lead-1',
    conversation_id: '51a1b546-6ddd-4e71-bb73-67756f949e44',
    channel: 'email',
    draft_response:
      "Hi Marcus, thanks for laying that out clearly. Because you're asking about a multi-unit purchase across the full inventory, I want Chris and Bill involved directly so you get an accurate answer on structure and pricing. I'm looping them in now through the approved path. Are you targeting one site or multiple facilities for the equipment?",
    template_used: 'escalation_handoff.md',
    variables_filled: {
      prospect_name: 'Marcus Lee',
      unit_interest: 'Full 14-unit inventory package',
      last_message:
        "What's your best price on all 14 units if I take the lot?",
      escalation_gate_evaluation: 'Multi-unit package exceeds owner threshold',
      priority: 'urgent',
      thread: [
        {
          role: 'prospect',
          content:
            "What's your best price on all 14 units if I take the lot?",
          timestamp: '2026-04-21T15:39:00.000Z',
        },
        {
          role: 'system',
          content: 'Runtime tagged this as owner-threshold escalation.',
          timestamp: '2026-04-21T15:39:01.000Z',
        },
      ],
    },
    confidence_score: 0.78,
    reasoning:
      'Escalation template selected because the prospect is asking for a package-wide price across all available units.',
    status: 'pending',
    final_response: null,
    decision_by: null,
    decided_at: null,
    sent_at: null,
    created_at: '2026-04-21T15:39:03.000Z',
    updated_at: '2026-04-21T15:39:03.000Z',
    meta: {
      prospect_name: 'Marcus Lee',
      prospect_email: 'marcus@atlaswarehousing.com',
      unit_interest: 'Full 14-unit inventory package',
      prospect_last_message:
        "What's your best price on all 14 units if I take the lot?",
      escalation_gate_evaluation: 'Multi-unit package exceeds owner threshold',
      channel_label: 'Email',
      priority: 'urgent',
      thread: [
        {
          role: 'prospect',
          content:
            "What's your best price on all 14 units if I take the lot?",
          timestamp: '2026-04-21T15:39:00.000Z',
        },
        {
          role: 'system',
          content: 'Runtime tagged this as owner-threshold escalation.',
          timestamp: '2026-04-21T15:39:01.000Z',
        },
      ],
      reject_count: 0,
    },
  },
  {
    id: 'mock-dpr-2',
    lead_id: 'mock-lead-2',
    conversation_id: '740b91e2-aa5d-4eef-90aa-c0db577a32ef',
    channel: 'sms',
    draft_response:
      'Hi Connor - as of the current inventory record, the 2018 Raymond 752R45TT is available. If you want to move quickly, call or book here: {{short_url}}. Do you want specs, price, or delivery next?',
    template_used: 'templates-sms/availability.md',
    variables_filled: {
      prospect_name: 'Connor',
      unit_interest: '2018 Raymond 752R45TT',
      last_message: 'is the 2018 raymond still available?',
      escalation_gate_evaluation: 'No escalation required',
      priority: 'high',
      thread: [
        {
          role: 'prospect',
          content: 'is the 2018 raymond still available?',
          timestamp: '2026-04-21T16:04:00.000Z',
        },
      ],
    },
    confidence_score: 0.91,
    reasoning: 'Availability template matched exact inventory lookup for the Baltimore reach truck.',
    status: 'pending',
    final_response: null,
    decision_by: null,
    decided_at: null,
    sent_at: null,
    created_at: '2026-04-21T16:04:06.000Z',
    updated_at: '2026-04-21T16:04:06.000Z',
    meta: {
      prospect_name: 'Connor',
      prospect_email: 'connor@ridgeops.com',
      unit_interest: '2018 Raymond 752R45TT',
      prospect_last_message: 'is the 2018 raymond still available?',
      escalation_gate_evaluation: 'No escalation required',
      channel_label: 'SMS',
      priority: 'high',
      thread: [
        {
          role: 'prospect',
          content: 'is the 2018 raymond still available?',
          timestamp: '2026-04-21T16:04:00.000Z',
        },
      ],
      reject_count: 0,
    },
  },
  {
    id: 'mock-dpr-3',
    lead_id: 'mock-lead-3',
    conversation_id: '6a822f50-22cb-4fe6-b0fd-c6a633c497f8',
    channel: 'voice',
    draft_response:
      "I can give you the current unit information, but financing approval isn't something I should improvise on. Let me grab Chris for you - one second. I don't want to guess on something that needs his direct answer.",
    template_used: 'voice/escalation_to_chris.md',
    variables_filled: {
      prospect_name: 'Elaine',
      unit_interest: '2019 Bendi B40',
      last_message:
        'Can you get me financed with zero down on the Bendi?',
      escalation_gate_evaluation: 'Financing approval request requires owner handoff',
      priority: 'urgent',
      thread: [
        {
          role: 'prospect',
          content: 'Can you get me financed with zero down on the Bendi?',
          timestamp: '2026-04-21T16:10:00.000Z',
        },
        {
          role: 'system',
          content: 'Voice transcript confidence 0.96. Financing keyword detected.',
          timestamp: '2026-04-21T16:10:01.000Z',
        },
      ],
    },
    confidence_score: 0.72,
    reasoning:
      'Escalation selected because financing approvals are out of scope for autonomous send.',
    status: 'pending',
    final_response: null,
    decision_by: null,
    decided_at: null,
    sent_at: null,
    created_at: '2026-04-21T16:10:05.000Z',
    updated_at: '2026-04-21T16:10:05.000Z',
    meta: {
      prospect_name: 'Elaine Foster',
      prospect_email: 'elaine@weldnorth.com',
      unit_interest: '2019 Bendi B40',
      prospect_last_message: 'Can you get me financed with zero down on the Bendi?',
      escalation_gate_evaluation: 'Financing approval request requires owner handoff',
      channel_label: 'Voice',
      priority: 'urgent',
      thread: [
        {
          role: 'prospect',
          content: 'Can you get me financed with zero down on the Bendi?',
          timestamp: '2026-04-21T16:10:00.000Z',
        },
        {
          role: 'system',
          content: 'Voice transcript confidence 0.96. Financing keyword detected.',
          timestamp: '2026-04-21T16:10:01.000Z',
        },
      ],
      reject_count: 1,
    },
  },
];

function getDecisionArtifactRoot() {
  const configured = process.env.DAVID_APPROVAL_ARTIFACT_ROOT?.trim();
  return configured || path.join(process.cwd(), 'runtime_artifacts', 'david_approval_decisions');
}

function isMockPendingResponseId(id: string) {
  return id.startsWith('mock-dpr-');
}

function priorityRank(priority: DavidApprovalPriority) {
  if (priority === 'urgent') return 0;
  if (priority === 'high') return 1;
  return 2;
}

function channelLabel(channel: DavidPendingResponseChannel) {
  switch (channel) {
    case 'sms':
      return 'SMS';
    case 'voice':
      return 'Voice';
    case 'telegram':
      return 'Telegram';
    default:
      return 'Email';
  }
}

function safeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseThread(value: unknown): PendingResponseThreadMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const role = (entry as { role?: string }).role;
      const content = (entry as { content?: string }).content;
      const timestamp = (entry as { timestamp?: string }).timestamp;

      if (!role || !content || !timestamp) return null;
      if (role !== 'prospect' && role !== 'david' && role !== 'system') return null;

      return {
        role,
        content,
        timestamp,
      } as PendingResponseThreadMessage;
    })
    .filter((entry): entry is PendingResponseThreadMessage => Boolean(entry));
}

function getPriority(
  record: DavidPendingResponseRecord,
  variables: Record<string, unknown> | null
): DavidApprovalPriority {
  const explicit = safeString(variables?.priority);
  if (explicit === 'urgent' || explicit === 'high' || explicit === 'normal') {
    return explicit;
  }

  if ((record.template_used ?? '').toLowerCase().includes('escalation')) {
    return 'urgent';
  }

  if (record.confidence_score != null && record.confidence_score < 0.75) {
    return 'high';
  }

  return 'normal';
}

function enrichPendingResponse(
  record: DavidPendingResponseRecord,
  leadMap: Map<string, LeadSummary>
): DavidPendingResponseView {
  const variables = record.variables_filled ?? null;
  const lead = leadMap.get(record.lead_id);
  const thread = parseThread(variables?.thread);
  const unitInterest =
    safeString(variables?.unit_interest) ??
    safeString(lead?.listing_title) ??
    safeString(lead?.subject);
  const lastMessage =
    safeString(variables?.last_message) ??
    safeString(lead?.conversation_summary) ??
    'No prospect message preview available yet.';
  const priority = getPriority(record, variables);

  return {
    ...record,
    meta: {
      prospect_name:
        safeString(variables?.prospect_name) ??
        safeString(lead?.name) ??
        'Unknown prospect',
      prospect_email: safeString(variables?.prospect_email) ?? safeString(lead?.email),
      unit_interest: unitInterest,
      prospect_last_message: lastMessage,
      escalation_gate_evaluation: safeString(variables?.escalation_gate_evaluation),
      channel_label: channelLabel(record.channel),
      priority,
      thread,
      reject_count:
        typeof variables?.reject_count === 'number' ? Number(variables.reject_count) : 0,
    },
  };
}

async function fetchLeadSummaries(leadIds: string[]): Promise<Map<string, LeadSummary>> {
  if (leadIds.length === 0) return new Map();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, subject, listing_title, conversation_summary')
      .in('id', leadIds);

    if (error) {
      console.error('david_pending_responses lead lookup failed', error);
      return new Map();
    }

    return new Map((data ?? []).map((row) => [row.id, row as LeadSummary]));
  } catch (error) {
    console.error('david_pending_responses lead bootstrap failed', error);
    return new Map();
  }
}

export async function getPendingResponses(): Promise<DavidPendingResponseView[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('david_pending_responses')
      .select(
        'id, lead_id, conversation_id, channel, draft_response, template_used, variables_filled, confidence_score, reasoning, status, final_response, decision_by, decided_at, sent_at, created_at, updated_at'
      )
      .in('status', OPEN_APPROVAL_STATUSES)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('david_pending_responses select failed', error);
      return MOCK_PENDING_RESPONSES;
    }

    const rows = (data ?? []) as DavidPendingResponseRecord[];
    if (rows.length === 0) {
      return MOCK_PENDING_RESPONSES;
    }

    const leadMap = await fetchLeadSummaries(Array.from(new Set(rows.map((row) => row.lead_id))));
    return rows
      .map((row) => enrichPendingResponse(row, leadMap))
      .sort((a, b) => {
        const byPriority = priorityRank(a.meta.priority) - priorityRank(b.meta.priority);
        if (byPriority !== 0) return byPriority;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  } catch (error) {
    console.error('david_pending_responses bootstrap failed', error);
    return MOCK_PENDING_RESPONSES;
  }
}

export async function getPendingResponseById(
  id: string
): Promise<DavidPendingResponseView | null> {
  if (isMockPendingResponseId(id)) {
    return MOCK_PENDING_RESPONSES.find((response) => response.id === id) ?? null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('david_pending_responses')
      .select(
        'id, lead_id, conversation_id, channel, draft_response, template_used, variables_filled, confidence_score, reasoning, status, final_response, decision_by, decided_at, sent_at, created_at, updated_at'
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('david_pending_responses detail lookup failed', error);
      }
      return null;
    }

    const row = data as DavidPendingResponseRecord;
    const leadMap = await fetchLeadSummaries([row.lead_id]);
    return enrichPendingResponse(row, leadMap);
  } catch (error) {
    console.error('david_pending_responses detail bootstrap failed', error);
    return null;
  }
}

async function emitDecisionArtifact(payload: Record<string, unknown>) {
  const dir = getDecisionArtifactRoot();
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${payload.pending_response_id}.json`);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

async function notifyRuntime(payload: Record<string, unknown>) {
  let artifactPath: string | null = null;
  let webhookStatus: number | null = null;

  try {
    artifactPath = await emitDecisionArtifact(payload);
  } catch (error) {
    console.error('david approval artifact write failed', error);
  }

  const webhookUrl = process.env.DAVID_APPROVAL_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      webhookStatus = response.status;
    } catch (error) {
      console.error('david approval webhook failed', error);
    }
  }

  return {
    artifactPath,
    runtimeNotified: Boolean(artifactPath || webhookStatus),
    webhookStatus,
  };
}

function updateMockRecord(
  current: DavidPendingResponseView,
  input: {
    action: PendingResponseDecisionAction;
    actor: string;
    editedDraft?: string;
    reason?: string;
  }
): DavidPendingResponseView {
  const now = new Date().toISOString();
  const variables = { ...(current.variables_filled ?? {}) };

  if (input.action === 'reject') {
    const rejectCount =
      typeof variables.reject_count === 'number' ? Number(variables.reject_count) + 1 : 1;
    variables.reject_count = rejectCount;
  }

  let status: DavidPendingResponseStatus = current.status;
  let finalResponse = current.final_response;
  let sentAt = current.sent_at;

  if (input.action === 'save_edit') {
    status = 'edited';
    finalResponse = input.editedDraft ?? current.final_response ?? current.draft_response;
  } else if (input.action === 'approve') {
    status = 'approved';
    finalResponse = input.editedDraft ?? current.final_response ?? current.draft_response;
    sentAt = now;
  } else if (input.action === 'reject') {
    status = 'rejected';
    finalResponse = null;
    variables.reject_reason = input.reason ?? null;
  } else if (input.action === 'escalate') {
    status = 'escalated';
    finalResponse = input.editedDraft ?? current.final_response ?? current.draft_response;
  }

  const record: DavidPendingResponseView = {
    ...current,
    status,
    final_response: finalResponse,
    decision_by: input.actor,
    decided_at: now,
    sent_at: sentAt,
    updated_at: now,
    variables_filled: variables,
    meta: {
      ...current.meta,
      reject_count:
        typeof variables.reject_count === 'number' ? Number(variables.reject_count) : 0,
    },
  };

  return record;
}

export async function applyPendingResponseDecision(input: {
  id: string;
  action: PendingResponseDecisionAction;
  actor: string;
  editedDraft?: string;
  reason?: string;
}): Promise<PendingResponseDecisionResult | null> {
  const current = await getPendingResponseById(input.id);
  if (!current) return null;

  if (isMockPendingResponseId(input.id)) {
    const record = updateMockRecord(current, input);
    const notify = await notifyRuntime({
      pending_response_id: record.id,
      lead_id: record.lead_id,
      conversation_id: record.conversation_id,
      action: input.action,
      status: record.status,
      final_response: record.final_response,
      decision_by: record.decision_by,
      decided_at: record.decided_at,
      sent_at: record.sent_at,
      source: 'mock_fallback',
    });

    return {
      record,
      runtime_notified: notify.runtimeNotified,
      artifact_path: notify.artifactPath,
      webhook_status: notify.webhookStatus,
    };
  }

  try {
    const now = new Date().toISOString();
    const variables = { ...(current.variables_filled ?? {}) } as Record<string, unknown>;

    if (input.action === 'reject') {
      const rejectCount =
        typeof variables.reject_count === 'number' ? Number(variables.reject_count) + 1 : 1;
      variables.reject_count = rejectCount;
      variables.reject_reason = input.reason ?? null;
    }

    const payload: Partial<DavidPendingResponseRecord> & { updated_at: string } = {
      updated_at: now,
      decision_by: input.actor,
      decided_at: now,
      variables_filled: variables,
    };

    if (input.action === 'save_edit') {
      payload.status = 'edited';
      payload.final_response = input.editedDraft ?? current.final_response ?? current.draft_response;
    }

    if (input.action === 'approve') {
      payload.status = 'approved';
      payload.final_response = input.editedDraft ?? current.final_response ?? current.draft_response;
      payload.sent_at = now;
    }

    if (input.action === 'reject') {
      payload.status = 'rejected';
      payload.final_response = null;
    }

    if (input.action === 'escalate') {
      payload.status = 'escalated';
      payload.final_response = input.editedDraft ?? current.final_response ?? current.draft_response;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('david_pending_responses')
      .update(payload)
      .eq('id', input.id)
      .select(
        'id, lead_id, conversation_id, channel, draft_response, template_used, variables_filled, confidence_score, reasoning, status, final_response, decision_by, decided_at, sent_at, created_at, updated_at'
      )
      .single();

    if (error || !data) {
      console.error('david_pending_responses update failed', error);
      return null;
    }

    const updated = data as DavidPendingResponseRecord;
    const leadMap = await fetchLeadSummaries([updated.lead_id]);
    const record = enrichPendingResponse(updated, leadMap);
    const notify = await notifyRuntime({
      pending_response_id: record.id,
      lead_id: record.lead_id,
      conversation_id: record.conversation_id,
      action: input.action,
      status: record.status,
      final_response: record.final_response,
      decision_by: record.decision_by,
      decided_at: record.decided_at,
      sent_at: record.sent_at,
      source: 'supabase',
    });

    return {
      record,
      runtime_notified: notify.runtimeNotified,
      artifact_path: notify.artifactPath,
      webhook_status: notify.webhookStatus,
    };
  } catch (error) {
    console.error('david_pending_responses decision bootstrap failed', error);
    return null;
  }
}
