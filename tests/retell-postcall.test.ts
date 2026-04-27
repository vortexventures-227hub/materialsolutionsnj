import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { NextRequest } from 'next/server';
import {
  createRetellPostcallHandler,
  verifyRetellSignature,
  extractRetellFields,
  type RetellPostcallPayload,
  type RetellPostcallDeps,
} from '@/app/api/retell/postcall/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_API_KEY = 'test-retell-api-key-12345';
const APP_ORIGIN = 'https://www.materialsolutionsnj.com';

function makeSignature(rawBody: string, apiKey: string = TEST_API_KEY): string {
  return createHmac('sha256', apiKey).update(rawBody).digest('base64');
}

function buildCallEndedPayload(overrides: Partial<RetellPostcallPayload['call']> = {}): RetellPostcallPayload {
  return {
    event: 'call_ended',
    call: {
      call_id: 'call_abc123',
      agent_id: 'agent_9f5269cc3ead4865bf480183b7',
      call_status: 'ended',
      from_number: '+18481234567',
      to_number: '+18489996854',
      direction: 'inbound',
      transcript: 'Agent: Hello, Material Solutions NJ.\nUser: Hi, I need a forklift.',
      call_analysis: {
        call_summary: 'Caller inquired about forklift rental.',
        user_sentiment: 'Positive',
        call_successful: true,
        in_voicemail: false,
        custom_analysis_data: {
          caller_name: 'John Smith',
          caller_email: 'john@example.com',
          caller_intent: 'forklift_rental',
          equipment_interest: 'Toyota 8FGU25',
        },
      },
      duration_ms: 90000,
      disconnection_reason: 'user_hangup',
      ...overrides,
    },
  };
}

function makeRequest(
  payload: unknown,
  options: { apiKey?: string | null; sign?: boolean } = {}
): NextRequest {
  const { apiKey = TEST_API_KEY, sign = true } = options;
  const rawBody = JSON.stringify(payload);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sign && apiKey) {
    headers['x-retell-signature'] = makeSignature(rawBody, apiKey);
  }
  return new NextRequest(new URL('/api/retell/postcall', APP_ORIGIN), {
    method: 'POST',
    headers,
    body: rawBody,
  });
}

function makeDeps(overrides: Partial<RetellPostcallDeps> = {}): RetellPostcallDeps {
  return {
    getApiKey: () => TEST_API_KEY,
    submitLead: async () => ({
      success: true,
      degraded: false,
      captureState: 'success',
      lead_id: 'lead_test_001',
    }),
    persistChat: async () => ({ ok: true }),
    resolveOrigin: () => APP_ORIGIN,
    ...overrides,
  };
}

// ─── Unit tests: verifyRetellSignature ────────────────────────────────────────

test('verifyRetellSignature accepts a valid HMAC-SHA256 base64 signature', () => {
  const body = '{"event":"call_ended"}';
  const sig = makeSignature(body);
  assert.equal(verifyRetellSignature(body, sig, TEST_API_KEY), true);
});

test('verifyRetellSignature rejects a tampered signature', () => {
  const body = '{"event":"call_ended"}';
  const badSig = makeSignature(body, 'wrong-key');
  assert.equal(verifyRetellSignature(body, badSig, TEST_API_KEY), false);
});

test('verifyRetellSignature rejects a garbage string', () => {
  assert.equal(verifyRetellSignature('body', 'not-a-signature', TEST_API_KEY), false);
});

// ─── Unit tests: extractRetellFields ─────────────────────────────────────────

test('extractRetellFields extracts all structured fields from a full call payload', () => {
  const payload = buildCallEndedPayload();
  const fields = extractRetellFields(payload.call);

  assert.equal(fields.call_id, 'call_abc123');
  assert.equal(fields.caller_phone, '+18481234567');
  assert.equal(fields.caller_name, 'John Smith');
  assert.equal(fields.caller_email, 'john@example.com');
  assert.equal(fields.caller_intent, 'forklift_rental');
  assert.equal(fields.equipment_interest, 'Toyota 8FGU25');
  assert.equal(fields.summary, 'Caller inquired about forklift rental.');
  assert.equal(fields.user_sentiment, 'Positive');
  assert.equal(fields.call_successful, true);
  assert.equal(fields.duration_ms, 90000);
});

test('extractRetellFields falls back to custom_analysis_data.caller_phone when from_number absent', () => {
  const payload = buildCallEndedPayload({
    from_number: undefined,
    call_analysis: {
      custom_analysis_data: { caller_phone: '+19731234567' },
    },
  });
  const fields = extractRetellFields(payload.call);
  assert.equal(fields.caller_phone, '+19731234567');
});

test('extractRetellFields returns nulls for absent optional fields', () => {
  const fields = extractRetellFields({
    call_id: 'call_min',
    agent_id: 'agent_x',
    call_status: 'ended',
  });
  assert.equal(fields.caller_phone, null);
  assert.equal(fields.summary, null);
  assert.equal(fields.caller_name, null);
  assert.equal(fields.call_successful, false);
});

// ─── Integration tests: handler ──────────────────────────────────────────────

test('happy path: valid signature + call_ended → 200, lead submitted, chat persisted', async () => {
  const submittedLeads: unknown[] = [];
  const persistedChats: unknown[] = [];

  const handler = createRetellPostcallHandler(
    makeDeps({
      submitLead: async (lead) => {
        submittedLeads.push(lead);
        return { success: true, degraded: false, captureState: 'success', lead_id: 'lead_001' };
      },
      persistChat: async (payload) => {
        persistedChats.push(payload);
        return { ok: true };
      },
    })
  );

  const payload = buildCallEndedPayload();
  const req = makeRequest(payload);
  const res = await handler(req);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.call_id, 'call_abc123');
  assert.equal(body.lead.captureState, 'success');
  assert.equal(body.lead.lead_id, 'lead_001');
  assert.equal(body.chat.ok, true);

  assert.equal(submittedLeads.length, 1);
  assert.equal(persistedChats.length, 1);

  const lead = submittedLeads[0] as Record<string, unknown>;
  assert.equal(lead.source, 'retell_voice_call');
  assert.equal(lead.phone, '+18481234567');
  assert.equal(lead.name, 'John Smith');

  const chat = persistedChats[0] as Record<string, unknown>;
  assert.equal(chat.call_id, 'call_abc123');
  assert.equal(chat.channel, 'voice');
  assert.equal(chat.lead_id, 'lead_001');
});

test('signature mismatch → 401', async () => {
  const handler = createRetellPostcallHandler(makeDeps());
  const payload = buildCallEndedPayload();
  const rawBody = JSON.stringify(payload);
  const req = new NextRequest(new URL('/api/retell/postcall', APP_ORIGIN), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-retell-signature': 'bad-signature-value',
    },
    body: rawBody,
  });

  const res = await handler(req);
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.error, 'Invalid signature');
});

test('missing x-retell-signature header → 401', async () => {
  const handler = createRetellPostcallHandler(makeDeps());
  const payload = buildCallEndedPayload();
  const req = makeRequest(payload, { sign: false });

  const res = await handler(req);
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.error, 'Missing x-retell-signature');
});

test('non call_ended event → 200 skipped', async () => {
  const handler = createRetellPostcallHandler(makeDeps());
  const payload = { event: 'call_started', call: { call_id: 'call_x', agent_id: 'a', call_status: 'ongoing' } };
  const req = makeRequest(payload);

  const res = await handler(req);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.skipped, true);
  assert.equal(body.reason, 'not call_ended');
});

test('invalid JSON body → 400', async () => {
  const handler = createRetellPostcallHandler(makeDeps());
  const rawBody = 'not-json{{{';
  const req = new NextRequest(new URL('/api/retell/postcall', APP_ORIGIN), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-retell-signature': makeSignature(rawBody),
    },
    body: rawBody,
  });

  const res = await handler(req);
  assert.equal(res.status, 400);
});

test('missing call.call_id → 400', async () => {
  const handler = createRetellPostcallHandler(makeDeps());
  const payload = { event: 'call_ended', call: { agent_id: 'a', call_status: 'ended' } };
  const req = makeRequest(payload);

  const res = await handler(req);
  assert.equal(res.status, 400);
});

test('when RETELL_API_KEY is absent, signature check is skipped', async () => {
  const submittedLeads: unknown[] = [];
  const handler = createRetellPostcallHandler(
    makeDeps({
      getApiKey: () => undefined,
      submitLead: async (lead) => {
        submittedLeads.push(lead);
        return { success: true, degraded: false, captureState: 'success', lead_id: 'lead_no_auth' };
      },
    })
  );

  const payload = buildCallEndedPayload();
  const req = makeRequest(payload, { sign: false });

  const res = await handler(req);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(submittedLeads.length, 1);
});

test('FSM chat persist failure is non-fatal — lead still captured', async () => {
  const submittedLeads: unknown[] = [];
  const handler = createRetellPostcallHandler(
    makeDeps({
      submitLead: async (lead) => {
        submittedLeads.push(lead);
        return { success: true, degraded: false, captureState: 'success', lead_id: 'lead_002' };
      },
      persistChat: async () => ({ ok: false, error: 'FSM offline' }),
    })
  );

  const payload = buildCallEndedPayload();
  const req = makeRequest(payload);
  const res = await handler(req);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.lead.captureState, 'success');
  assert.equal(body.chat.ok, false);
  assert.equal(body.chat.error, 'FSM offline');
  assert.equal(submittedLeads.length, 1);
});

test('degraded lead capture still returns 200 with captureState=degraded', async () => {
  const handler = createRetellPostcallHandler(
    makeDeps({
      submitLead: async () => ({
        success: false,
        degraded: true,
        captureState: 'degraded',
        lead_id: null,
        queue_id: 'q_001',
      }),
    })
  );

  const payload = buildCallEndedPayload();
  const req = makeRequest(payload);
  const res = await handler(req);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.lead.captureState, 'degraded');
  assert.equal(body.lead.lead_id, null);
});
