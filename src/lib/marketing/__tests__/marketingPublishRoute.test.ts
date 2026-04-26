import assert from 'node:assert/strict';
import test from 'node:test';

import { BackendError } from '@/lib/api/backend';
import { handleMarketingPublishRequest } from '../../../app/api/marketing/publish/handler';

test('POST /api/marketing/publish proxies publish requests to FSM and returns the FSM receipt', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    backendPost: async <T>(path: string, body: unknown): Promise<T> => {
      assert.strictEqual(path, '/api/publish/RT-752R45TT-2018');
      assert.deepStrictEqual(body, {
        platforms: ['facebook_marketplace'],
        skipEmail: false,
        source: 'storefront-marketing-publish',
        storefront: {
          unitId: 'RT-752R45TT-2018',
          route: '/api/marketing/publish',
        },
      });
      return {
        inventoryId: 'RT-752R45TT-2018',
        summary: { queued: 1, errors: 0 },
        results: [{ platform: 'facebook_marketplace', status: 'queued' }],
      } as T;
    },
  });

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), {
    inventoryId: 'RT-752R45TT-2018',
    summary: { queued: 1, errors: 0 },
    results: [{ platform: 'facebook_marketplace', status: 'queued' }],
  });
});

test('POST /api/marketing/publish rejects invalid JSON bodies', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{bad json',
  });

  const response = await handleMarketingPublishRequest(request, {
    backendPost: async () => {
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(await response.json(), { error: 'Invalid JSON body' });
});

test('POST /api/marketing/publish rejects unsupported platforms before proxy execution', async () => {
  let backendCalled = false;
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'linkedin' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    backendPost: async () => {
      backendCalled = true;
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(backendCalled, false);
  assert.deepStrictEqual(await response.json(), {
    error: 'Unsupported platform',
    supportedPlatforms: ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'],
  });
});

test('POST /api/marketing/publish maps FSM 4xx responses to a 502 proxy failure', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    backendPost: async () => {
      throw new BackendError(422, 'Invalid inventory id', { error: 'Invalid inventory id' });
    },
  });

  assert.strictEqual(response.status, 502);
  assert.deepStrictEqual(await response.json(), {
    error: 'FSM publish proxy failed',
    fsmStatus: 422,
    fsmBody: { error: 'Invalid inventory id' },
  });
});

test('POST /api/marketing/publish maps FSM network failures to a 502 proxy failure', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    backendPost: async () => {
      throw new TypeError('fetch failed');
    },
  });

  assert.strictEqual(response.status, 502);
  assert.deepStrictEqual(await response.json(), {
    error: 'FSM publish proxy failed',
    detail: 'fetch failed',
  });
});
