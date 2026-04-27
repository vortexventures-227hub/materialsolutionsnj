import test from 'node:test';
import assert from 'node:assert/strict';

import { backendGet, backendPost, BackendError } from '@/lib/api/backend';

const RAILWAY_URL = 'https://vortex-forklift-api-production.up.railway.app';

type FetchMock = typeof globalThis.fetch;

function mockFetch(responses: Array<{ ok: boolean; status: number; body?: unknown }>): FetchMock {
  let call = 0;
  return async (_url: string, _init?: RequestInit): Promise<Response> => {
    const r = responses[call++];
    if (!r) throw new TypeError('Network error: no more mock responses');
    return {
      ok: r.ok,
      status: r.status,
      statusText: String(r.status),
      json: async () => r.body,
    } as unknown as Response;
  };
}

// ---------------------------------------------------------------------------

test('GET includes Authorization: Bearer header when BACKEND_API_KEY is set', async () => {
  process.env.NEXT_PUBLIC_BACKEND_URL = RAILWAY_URL;
  process.env.BACKEND_API_KEY = 'test-secret-key';

  let capturedHeaders: Record<string, string> | undefined;

  globalThis.fetch = async (_url: string, init?: RequestInit): Promise<Response> => {
    capturedHeaders = init?.headers as Record<string, string>;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: true }),
    } as unknown as Response;
  };

  await backendGet('/ping');

  assert.ok(capturedHeaders, 'fetch was called');
  assert.equal(capturedHeaders['Authorization'], 'Bearer test-secret-key');

  delete process.env.BACKEND_API_KEY;
});

test('GET supports FSM production env aliases for base URL and service JWT', async () => {
  delete process.env.NEXT_PUBLIC_BACKEND_URL;
  delete process.env.BACKEND_API_KEY;
  process.env.FSM_API_BASE = 'https://fsm.example.test/';
  process.env.FSM_SERVICE_JWT = 'fsm-service-token';

  let capturedUrl: string | undefined;
  let capturedHeaders: Record<string, string> | undefined;

  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    capturedUrl = String(url);
    capturedHeaders = init?.headers as Record<string, string>;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: true }),
    } as unknown as Response;
  };

  await backendGet('/ping');

  assert.equal(capturedUrl, 'https://fsm.example.test/ping');
  assert.ok(capturedHeaders, 'fetch was called');
  assert.equal(capturedHeaders['Authorization'], 'Bearer fsm-service-token');

  delete process.env.FSM_API_BASE;
  delete process.env.FSM_SERVICE_JWT;
});

test('200 response returns parsed JSON', async () => {
  process.env.NEXT_PUBLIC_BACKEND_URL = RAILWAY_URL;
  delete process.env.BACKEND_API_KEY;

  const payload = { id: 1, name: 'Yale ERP050' };
  globalThis.fetch = mockFetch([{ ok: true, status: 200, body: payload }]);

  const result = await backendGet<typeof payload>('/items/1');
  assert.deepEqual(result, payload);
});

test('401 response throws BackendError with status 401', async () => {
  process.env.NEXT_PUBLIC_BACKEND_URL = RAILWAY_URL;
  delete process.env.BACKEND_API_KEY;

  globalThis.fetch = mockFetch([{ ok: false, status: 401, body: { message: 'Unauthorized' } }]);

  await assert.rejects(
    () => backendGet('/protected'),
    (err: unknown) => {
      assert.ok(err instanceof BackendError, `expected BackendError, got ${String(err)}`);
      assert.equal((err as BackendError).status, 401);
      return true;
    },
  );
});

test('network failure retries once then throws if second attempt also fails', async () => {
  process.env.NEXT_PUBLIC_BACKEND_URL = RAILWAY_URL;
  delete process.env.BACKEND_API_KEY;

  let callCount = 0;
  globalThis.fetch = async (): Promise<Response> => {
    callCount++;
    throw new TypeError('fetch failed');
  };

  await assert.rejects(() => backendGet('/fail'), TypeError);
  assert.equal(callCount, 2, 'should have attempted exactly 2 times');
});

test('network failure retries once and succeeds on second attempt', async () => {
  process.env.NEXT_PUBLIC_BACKEND_URL = RAILWAY_URL;
  delete process.env.BACKEND_API_KEY;

  let callCount = 0;
  globalThis.fetch = async (): Promise<Response> => {
    callCount++;
    if (callCount === 1) throw new TypeError('fetch failed');
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ retried: true }),
    } as unknown as Response;
  };

  const result = await backendGet<{ retried: boolean }>('/retry-test');
  assert.equal(callCount, 2, 'should have tried twice');
  assert.deepEqual(result, { retried: true });
});

test('backendPost sends JSON body and returns parsed response', async () => {
  process.env.NEXT_PUBLIC_BACKEND_URL = RAILWAY_URL;
  delete process.env.BACKEND_API_KEY;

  let capturedBody: string | undefined;
  globalThis.fetch = async (_url: string, init?: RequestInit): Promise<Response> => {
    capturedBody = init?.body as string;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ created: true }),
    } as unknown as Response;
  };

  const result = await backendPost<{ created: boolean }>('/leads', { name: 'Test Lead' });
  assert.deepEqual(JSON.parse(capturedBody ?? '{}'), { name: 'Test Lead' });
  assert.deepEqual(result, { created: true });
});
