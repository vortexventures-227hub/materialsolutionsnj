import assert from 'node:assert/strict';
import test from 'node:test';

import { handlePublishRequest } from '../src/app/api/inventory/[slug]/publish/handler';
import { handleMarketingPublishRequest } from '../src/app/api/marketing/publish/handler';
import type { ProxyReceiptEntry } from '../src/lib/marketing/publishReceiptLedger';

// ---- shared FSM mock response ----

const FSM_RESPONSE = {
  inventoryId: 'RT-752R45TT-2018',
  summary: { published: 1, errors: 0 },
  results: [{ platform: 'facebook_marketplace', status: 'published' }],
};

// ---- inventory/[slug]/publish idempotency tests ----

test('[slug]/publish: first call with Idempotency-Key calls FSM and writes receipt', async () => {
  let fsmCallCount = 0;
  let writtenEntry: Omit<ProxyReceiptEntry, 'receiptId'> | null = null;

  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Idempotency-Key': 'idem-inv-001' },
    body: JSON.stringify({ platform: 'facebook_marketplace' }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => { throw new Error('should not run'); },
    backendPost: async <T>(): Promise<T> => {
      fsmCallCount++;
      return FSM_RESPONSE as T;
    },
    lookupIdempotencyKey: async () => null,
    writeProxyReceipt: async (entry) => {
      writtenEntry = entry;
      return 'abc123def456';
    },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(fsmCallCount, 1);
  assert.ok(writtenEntry);
  assert.strictEqual((writtenEntry as Omit<ProxyReceiptEntry, 'receiptId'>).idempotencyKey, 'idem-inv-001');
  assert.strictEqual(response.headers.get('X-Receipt-Id'), 'abc123def456');
  assert.deepStrictEqual(await response.json(), FSM_RESPONSE);
});

test('[slug]/publish: second call with same Idempotency-Key returns cached receipt without calling FSM', async () => {
  let fsmCallCount = 0;
  const cachedEntry: ProxyReceiptEntry = {
    receiptId: 'abc123def456',
    idempotencyKey: 'idem-inv-001',
    unitId: 'RT-752R45TT-2018',
    platform: 'facebook_marketplace',
    timestamp: '2026-04-26T20:00:00.000Z',
    fsmResponse: FSM_RESPONSE,
    source: 'storefront:/api/inventory/rt-752r45tt-2018/publish',
  };

  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Idempotency-Key': 'idem-inv-001' },
    body: JSON.stringify({ platform: 'facebook_marketplace' }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => { throw new Error('should not run'); },
    backendPost: async <T>(): Promise<T> => {
      fsmCallCount++;
      throw new Error('should not reach FSM on replay');
    },
    lookupIdempotencyKey: async () => cachedEntry,
    writeProxyReceipt: async () => { throw new Error('should not write on replay'); },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(fsmCallCount, 0, 'FSM must not be called on idempotency replay');
  assert.strictEqual(response.headers.get('X-Idempotency-Replayed'), 'true');
  assert.strictEqual(response.headers.get('X-Receipt-Id'), 'abc123def456');
  assert.deepStrictEqual(await response.json(), FSM_RESPONSE);
});

test('[slug]/publish: call without Idempotency-Key calls FSM without writing receipt', async () => {
  let fsmCallCount = 0;
  let writeReceiptCalled = false;

  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace' }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => { throw new Error('should not run'); },
    backendPost: async <T>(): Promise<T> => {
      fsmCallCount++;
      return FSM_RESPONSE as T;
    },
    lookupIdempotencyKey: async () => null,
    writeProxyReceipt: async () => {
      writeReceiptCalled = true;
      return 'ignored';
    },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(fsmCallCount, 1);
  assert.strictEqual(writeReceiptCalled, false, 'no receipt written when no idempotency key');
  assert.strictEqual(response.headers.get('X-Receipt-Id'), null);
});

// ---- marketing/publish idempotency tests ----

test('marketing/publish: first call with Idempotency-Key calls FSM and writes receipt', async () => {
  let fsmCallCount = 0;
  let writtenEntry: Omit<ProxyReceiptEntry, 'receiptId'> | null = null;

  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Idempotency-Key': 'idem-mkt-001' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    backendPost: async <T>(): Promise<T> => {
      fsmCallCount++;
      return FSM_RESPONSE as T;
    },
    lookupIdempotencyKey: async () => null,
    writeProxyReceipt: async (entry) => {
      writtenEntry = entry;
      return 'def456abc123';
    },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(fsmCallCount, 1);
  assert.ok(writtenEntry);
  assert.strictEqual((writtenEntry as Omit<ProxyReceiptEntry, 'receiptId'>).idempotencyKey, 'idem-mkt-001');
  assert.strictEqual(response.headers.get('X-Receipt-Id'), 'def456abc123');
  assert.deepStrictEqual(await response.json(), FSM_RESPONSE);
});

test('marketing/publish: second call with same Idempotency-Key returns cached receipt without calling FSM', async () => {
  let fsmCallCount = 0;
  const cachedEntry: ProxyReceiptEntry = {
    receiptId: 'def456abc123',
    idempotencyKey: 'idem-mkt-001',
    unitId: 'RT-752R45TT-2018',
    platform: 'facebook_marketplace',
    timestamp: '2026-04-26T20:05:00.000Z',
    fsmResponse: FSM_RESPONSE,
    source: 'storefront:/api/marketing/publish',
  };

  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Idempotency-Key': 'idem-mkt-001' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    backendPost: async <T>(): Promise<T> => {
      fsmCallCount++;
      throw new Error('should not reach FSM on replay');
    },
    lookupIdempotencyKey: async () => cachedEntry,
    writeProxyReceipt: async () => { throw new Error('should not write on replay'); },
  });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(fsmCallCount, 0, 'FSM must not be called on idempotency replay');
  assert.strictEqual(response.headers.get('X-Idempotency-Replayed'), 'true');
  assert.strictEqual(response.headers.get('X-Receipt-Id'), 'def456abc123');
  assert.deepStrictEqual(await response.json(), FSM_RESPONSE);
});
