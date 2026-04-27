import assert from 'node:assert/strict';
import test from 'node:test';

import { handleSmsProxyRequest } from '../src/app/api/sms/handler';

test('sms proxy: success — forwards to FSM /api/sms/send and returns response', async () => {
  let capturedPath: string | undefined;
  let capturedBody: unknown;

  const FSM_RESPONSE = {
    success: true,
    message: 'SMS sent successfully',
    leadId: 'lead-001',
  };

  const request = new Request('http://localhost/api/sms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId: 'lead-001', message: 'Your quote is ready!' }),
  });

  const response = await handleSmsProxyRequest(request, {
    backendPost: async <T>(path: string, body: unknown): Promise<T> => {
      capturedPath = path;
      capturedBody = body;
      return FSM_RESPONSE as T;
    },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(capturedPath, '/api/sms/send');
  assert.deepStrictEqual(capturedBody, {
    leadId: 'lead-001',
    message: 'Your quote is ready!',
    source: 'storefront-sms-proxy',
  });
  assert.deepStrictEqual(await response.json(), FSM_RESPONSE);
});

test('sms proxy: 502 — error from FSM returns 502 with error detail', async () => {
  const fsmError = Object.assign(new Error('Service Unavailable'), {
    status: 503,
    body: { error: 'Telnyx downstream timeout' },
  });

  const request = new Request('http://localhost/api/sms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId: 'lead-001', message: 'Hello from storefront' }),
  });

  const response = await handleSmsProxyRequest(request, {
    backendPost: async <T>(): Promise<T> => {
      throw fsmError;
    },
  });

  const body = (await response.json()) as { error: string };
  assert.strictEqual(response.status, 502);
  assert.strictEqual(body.error, 'FSM SMS proxy failed');
});
