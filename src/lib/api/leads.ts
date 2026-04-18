/**
 * Leads API — submits leads to the storefront's real lead-capture route.
 * Keep this aligned with `src/app/api/leads/handler.ts` instead of implying a
 * separate callback endpoint that does not exist in the canonical runtime.
 */

import { backend } from './backend';

export interface LeadSubmission {
  visitor_id?: string;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  subject?: string;
  interests?: string[];
  conversation_summary?: string;
  message?: string;
  score?: number;
  source: string;
  page_origin?: string;
  cta_origin?: string;
  listing_id?: string;
  listing_slug?: string;
  listing_title?: string;
  service_slug?: string;
  timeline?: string;
  budget_confirmed?: boolean;
  use_case?: string;
}

export type LeadResponse = {
  success: boolean;
  degraded: boolean;
  captureState: 'success' | 'degraded' | 'failure';
  message?: string;
  error?: string;
  lead_id?: string | null;
  queue_id?: string | null;
  capture_id?: string;
  persisted_at?: string | null;
  degraded_reason?: string;
  operator_alerted?: boolean;
  retry_owner?: string;
  retry_deadline?: string;
  alert_artifact_path?: string;
  queue_record_locator?: string;
  error_code?: string;
  retryable?: boolean;
};

export async function submitLead(lead: LeadSubmission): Promise<LeadResponse> {
  try {
    return await backend.post<LeadResponse>('/api/leads', lead);
  } catch (error) {
    console.error('Failed to submit lead to backend:', error);
    throw error;
  }
}

export interface CallbackLeadDraft {
  name: string;
  phone: string;
  preferred_time?: string;
  topic: string;
  notes?: string;
}

export function buildCallbackLeadSubmission({
  name,
  phone,
  preferred_time,
  topic,
  notes,
}: CallbackLeadDraft): LeadSubmission {
  const messageLines = [
    `Callback topic: ${topic}`,
    preferred_time ? `Preferred callback time: ${preferred_time}` : null,
    notes ? `Notes: ${notes}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    name,
    phone,
    source: 'callback_request',
    subject: 'Callback Request',
    message: messageLines.join('\n'),
  };
}

// CallbackRequest and scheduleCallback removed — no /api/leads/callback route exists
// in the canonical runtime. Re-add once the route is implemented.
