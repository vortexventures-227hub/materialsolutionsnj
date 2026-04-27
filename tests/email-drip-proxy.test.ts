import assert from 'node:assert/strict';
import test from 'node:test';

import { handleEmailProxyRequest } from '../src/app/api/email/handler';
import { handleDripProxyRequest } from '../src/app/api/drip/handler';

// ── email proxy tests ──────────────────────────────────────────────────────

test('email proxy: success — forwards to FSM /api/email/trigger-sequence and returns response', async () => {
  let capturedPath: string | undefined;
  let capturedBody: unknown;

  const FSM_RESPONSE = {
    sequenceId: 'seq-abc123',
    campaignId: 42,
    leadId: 'lead-001',
    inventoryId: 'RT-752R45TT-2018',
    totalSteps: 4,
    nextScheduledAt: '2026-04-27T10:00:00.000Z',
  };

  const request = new Request('http://localhost/api/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId: 'lead-001', inventoryId: 'RT-752R45TT-2018', sequenceType: 'follow-up' }),
  });

  const response = await handleEmailProxyRequest(request, {
    backendPost: async <T>(path: string, body: unknown): Promise<T> => {
      capturedPath = path;
      capturedBody = body;
      return FSM_RESPONSE as T;
    },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(capturedPath, '/api/email/trigger-sequence');
  assert.deepStrictEqual(capturedBody, {
    leadId: 'lead-001',
    inventoryId: 'RT-752R45TT-2018',
    sequenceType: 'follow-up',
    source: 'storefront-email-proxy',
  });
  assert.deepStrictEqual(await response.json(), FSM_RESPONSE);
});

test('email proxy: 502 — error from FSM returns 502 with error detail', async () => {
  const fsmError = Object.assign(new Error('Service Unavailable'), { status: 503, body: { error: 'downstream timeout' } });

  const request = new Request('http://localhost/api/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId: 'lead-001', inventoryId: 'RT-752R45TT-2018' }),
  });

  const response = await handleEmailProxyRequest(request, {
    backendPost: async <T>(): Promise<T> => { throw fsmError; },
  });

  const body = await response.json() as { error: string; fsmStatus?: number };
  assert.strictEqual(response.status, 502);
  assert.strictEqual(body.error, 'FSM email proxy failed');
});

// ── drip proxy tests ───────────────────────────────────────────────────────

test('drip proxy: success — forwards to FSM /api/drip/schedule and returns response', async () => {
  let capturedPath: string | undefined;
  let capturedBody: unknown;

  const FSM_RESPONSE = {
    message: 'Drip campaign scheduled successfully',
    leadId: 'lead-002',
    campaignType: 'follow-up',
  };

  const request = new Request('http://localhost/api/drip', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId: 'lead-002', campaignType: 'follow-up' }),
  });

  const response = await handleDripProxyRequest(request, {
    backendPost: async <T>(path: string, body: unknown): Promise<T> => {
      capturedPath = path;
      capturedBody = body;
      return FSM_RESPONSE as T;
    },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(capturedPath, '/api/drip/schedule');
  assert.deepStrictEqual(capturedBody, {
    leadId: 'lead-002',
    campaignType: 'follow-up',
    source: 'storefront-drip-proxy',
  });
  assert.deepStrictEqual(await response.json(), FSM_RESPONSE);
});

test('drip proxy: 502 — error from FSM returns 502 with error detail', async () => {
  const fsmError = Object.assign(new Error('Internal Server Error'), { status: 500, body: { error: 'drip scheduler crash' } });

  const request = new Request('http://localhost/api/drip', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId: 'lead-002' }),
  });

  const response = await handleDripProxyRequest(request, {
    backendPost: async <T>(): Promise<T> => { throw fsmError; },
  });

  const body = await response.json() as { error: string };
  assert.strictEqual(response.status, 502);
  assert.strictEqual(body.error, 'FSM drip proxy failed');
});
