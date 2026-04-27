import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { submitLead, resolveAppOrigin, type LeadSubmission } from '@/lib/api/leads';
import { backend } from '@/lib/api/backend';

// ─── Retell payload types ────────────────────────────────────────────────────

interface RetellTranscriptTurn {
  role: 'agent' | 'user';
  content: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

interface RetellCallAnalysis {
  call_summary?: string;
  in_voicemail?: boolean;
  user_sentiment?: 'Positive' | 'Negative' | 'Neutral' | 'Unknown';
  call_successful?: boolean;
  custom_analysis_data?: {
    caller_name?: string;
    caller_email?: string;
    caller_phone?: string;
    caller_intent?: string;
    equipment_interest?: string;
    [key: string]: unknown;
  };
}

interface RetellCall {
  call_id: string;
  agent_id: string;
  call_status: string;
  from_number?: string;
  to_number?: string;
  direction?: 'inbound' | 'outbound';
  transcript?: string;
  transcript_object?: RetellTranscriptTurn[];
  call_analysis?: RetellCallAnalysis;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  recording_url?: string;
  disconnection_reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RetellPostcallPayload {
  event: string;
  call: RetellCall;
}

// ─── Extracted structured fields ─────────────────────────────────────────────

export interface RetellExtractedFields {
  call_id: string;
  caller_phone: string | null;
  transcript: string | null;
  summary: string | null;
  caller_name: string | null;
  caller_email: string | null;
  caller_intent: string | null;
  equipment_interest: string | null;
  user_sentiment: string | null;
  call_successful: boolean;
  duration_ms: number | null;
  recording_url: string | null;
}

// ─── Signature verification ───────────────────────────────────────────────────

// Retell signs webhooks with HMAC-SHA256 over the raw request body.
// The secret is the Retell API key. The header value is base64-encoded.
export function verifyRetellSignature(rawBody: string, signature: string, apiKey: string): boolean {
  try {
    const expected = createHmac('sha256', apiKey).update(rawBody).digest('base64');
    const expectedBuf = Buffer.from(expected);
    const receivedBuf = Buffer.from(signature);
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

// ─── Field extraction ─────────────────────────────────────────────────────────

export function extractRetellFields(call: RetellCall): RetellExtractedFields {
  const analysis = call.call_analysis ?? {};
  const custom = analysis.custom_analysis_data ?? {};

  return {
    call_id: call.call_id,
    caller_phone: call.from_number ?? custom.caller_phone ?? null,
    transcript: call.transcript ?? null,
    summary: analysis.call_summary ?? null,
    caller_name: custom.caller_name ?? null,
    caller_email: custom.caller_email ?? null,
    caller_intent: custom.caller_intent ?? null,
    equipment_interest: custom.equipment_interest ?? null,
    user_sentiment: analysis.user_sentiment ?? null,
    call_successful: analysis.call_successful ?? false,
    duration_ms: call.duration_ms ?? null,
    recording_url: call.recording_url ?? null,
  };
}

// ─── Dependency-injected handler factory (testable) ──────────────────────────

export interface RetellPostcallDeps {
  getApiKey: () => string | undefined;
  submitLead: (lead: LeadSubmission, opts?: { baseUrl?: string }) => ReturnType<typeof submitLead>;
  persistChat: (payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  resolveOrigin: (req: NextRequest) => string;
}

export function createRetellPostcallHandler(deps: RetellPostcallDeps) {
  return async function handler(request: NextRequest): Promise<NextResponse> {
    const apiKey = deps.getApiKey();
    const rawBody = await request.text();
    const signature = request.headers.get('x-retell-signature');

    if (apiKey) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing x-retell-signature' }, { status: 401 });
      }
      if (!verifyRetellSignature(rawBody, signature, apiKey)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let payload: RetellPostcallPayload;
    try {
      payload = JSON.parse(rawBody) as RetellPostcallPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (payload.event !== 'call_ended') {
      return NextResponse.json({ ok: true, skipped: true, reason: 'not call_ended' }, { status: 200 });
    }

    const call = payload.call;
    if (!call?.call_id) {
      return NextResponse.json({ error: 'Missing call.call_id' }, { status: 400 });
    }

    const fields = extractRetellFields(call);

    const interests: string[] = [];
    if (fields.equipment_interest) interests.push(fields.equipment_interest);
    if (fields.caller_intent) interests.push(fields.caller_intent);

    const conversationSummary = [
      fields.summary ? `Summary: ${fields.summary}` : null,
      fields.user_sentiment ? `Sentiment: ${fields.user_sentiment}` : null,
      fields.duration_ms != null ? `Duration: ${Math.round(fields.duration_ms / 1000)}s` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const appOrigin = deps.resolveOrigin(request);

    // P2 — submit caller as lead to FSM /api/leads
    const leadResult = await deps.submitLead(
      {
        phone: fields.caller_phone ?? undefined,
        name: fields.caller_name ?? undefined,
        email: fields.caller_email ?? undefined,
        source: 'retell_voice_call',
        conversation_summary: conversationSummary || undefined,
        interests: interests.length > 0 ? interests : undefined,
        use_case: fields.caller_intent ?? undefined,
        message: fields.transcript
          ? `Voice call transcript:\n${fields.transcript}`
          : undefined,
      },
      { baseUrl: appOrigin }
    );

    // P3 — persist transcript as chat session to FSM /api/chat
    const chatResult = await deps.persistChat({
      call_id: fields.call_id,
      channel: 'voice',
      source: 'retell',
      phone: fields.caller_phone,
      name: fields.caller_name,
      email: fields.caller_email,
      transcript: fields.transcript,
      transcript_object: call.transcript_object,
      summary: fields.summary,
      sentiment: fields.user_sentiment,
      call_successful: fields.call_successful,
      duration_ms: fields.duration_ms,
      recording_url: fields.recording_url,
      lead_id: leadResult.lead_id ?? null,
    });

    return NextResponse.json(
      {
        ok: true,
        call_id: fields.call_id,
        lead: {
          captureState: leadResult.captureState,
          lead_id: leadResult.lead_id,
        },
        chat: {
          ok: chatResult.ok,
          error: chatResult.error ?? null,
        },
      },
      { status: 200 }
    );
  };
}

// ─── Production wiring ────────────────────────────────────────────────────────

async function fsmPersistChat(
  payload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    await backend.post('/api/chat', payload);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[retell/postcall] FSM /api/chat persist failed (non-fatal):', message);
    return { ok: false, error: message };
  }
}

const productionHandler = createRetellPostcallHandler({
  getApiKey: () => process.env.RETELL_API_KEY,
  submitLead,
  persistChat: fsmPersistChat,
  resolveOrigin: resolveAppOrigin,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  return productionHandler(request);
}
