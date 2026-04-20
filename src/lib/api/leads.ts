/**
 * Leads API — submits leads to the Next.js app's own lead-capture route.
 * Calls src/app/api/leads/route.ts directly, not the external Render backend.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

export function resolveAppOrigin(request?: Request): string {
  if (request) {
    try {
      return new URL(request.url).origin;
    } catch {}
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function submitLead(
  lead: LeadSubmission,
  options?: { baseUrl?: string }
): Promise<LeadResponse> {
  const base = options?.baseUrl || APP_URL;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${base}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Lead capture API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        degraded: false,
        captureState: 'failure',
        error: 'Lead capture timed out after 10s',
        error_code: 'TIMEOUT',
        retryable: false,
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to submit lead:', message);
    return {
      success: false,
      degraded: false,
      captureState: 'failure',
      error: message,
      error_code: 'FETCH_ERROR',
      retryable: true,
    };
  }
}
