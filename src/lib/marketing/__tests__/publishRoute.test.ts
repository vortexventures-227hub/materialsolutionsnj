import assert from 'node:assert/strict';
import test from 'node:test';

import { handlePublishPreviewRequest, handlePublishRequest } from '../../../app/api/inventory/[slug]/publish/handler';
import { BackendError } from '@/lib/api/backend';

test('GET publish preview route resolves slug, previews channel copy, and returns no-side-effect payload', async () => {
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish?platform=facebook_marketplace');

  const response = await handlePublishPreviewRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: (slug) => slug === 'rt-752r45tt-2018' ? 'RT-752R45TT-2018' : null,
    previewPublishPipeline: async (unitId, platform) => ({
      unitId,
      platform,
      mode: 'preview',
      warnings: [],
      blockedByQa: false,
      eligible: true,
      holdFlag: false,
      lotOnlyFlag: false,
      publishEligibility: true,
      qaSummary: { overallStatus: 'pass', results: [], errorLog: [] },
      channelCopy: {
        title: '2018 Raymond Reach Truck',
        description: 'Ready to preview',
        price: 29500,
        image_urls: ['https://example.com/image.jpg'],
        primary_image_url: 'https://example.com/image.jpg',
        category_mapping: 'Vehicles > Commercial > Forklifts',
        platform_specific_fields: {},
        posting_instructions: null,
        char_limit_warnings: [],
      },
    }),
    backendPost: async () => {
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.deepStrictEqual(json, {
    unitId: 'RT-752R45TT-2018',
    platform: 'facebook_marketplace',
    mode: 'preview',
    eligible: true,
    holdFlag: false,
    lotOnlyFlag: false,
    publishEligibility: true,
    channelCopy: {
      title: '2018 Raymond Reach Truck',
      description: 'Ready to preview',
      price: 29500,
      image_urls: ['https://example.com/image.jpg'],
      primary_image_url: 'https://example.com/image.jpg',
      category_mapping: 'Vehicles > Commercial > Forklifts',
      platform_specific_fields: {},
      posting_instructions: null,
      char_limit_warnings: [],
    },
    warnings: [],
    blockedByQa: false,
  });
});

test('POST publish route proxies slug publish to FSM and returns the FSM receipt', async () => {
  const fsmInventoryId = '11111111-1111-4111-8111-111111111111';
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace', fsmInventoryId }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: (slug) => slug === 'rt-752r45tt-2018' ? 'RT-752R45TT-2018' : null,
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    backendPost: async <T>(path: string, body: unknown): Promise<T> => {
      assert.strictEqual(path, `/api/publish/${fsmInventoryId}`);
      assert.deepStrictEqual(body, {
        platforms: ['facebook_marketplace'],
        skipEmail: false,
        source: 'storefront',
        storefront: {
          slug: 'rt-752r45tt-2018',
          unitId: 'RT-752R45TT-2018',
          fsmInventoryId,
          route: '/api/inventory/rt-752r45tt-2018/publish',
        },
      });
      return {
        inventoryId: fsmInventoryId,
        summary: { published: 1, errors: 0 },
        results: [{ platform: 'facebook_marketplace', status: 'queued' }],
      } as T;
    },
  });

  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.deepStrictEqual(json, {
    inventoryId: fsmInventoryId,
    summary: { published: 1, errors: 0 },
    results: [{ platform: 'facebook_marketplace', status: 'queued' }],
  });
});

test('POST publish route blocks FSM proxy when slug resolves only to a storefront unit id', async () => {
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace' }),
  });

  let backendCalled = false;
  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    backendPost: async () => {
      backendCalled = true;
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 409);
  assert.strictEqual(backendCalled, false);
  assert.deepStrictEqual(await response.json(), {
    error: 'FSM inventory UUID mapping required',
    detail: 'Storefront unit ids cannot be proxied to FSM publish until they are mapped to a canonical FSM inventory UUID.',
    storefrontUnitId: 'RT-752R45TT-2018',
  });
});

test('POST publish route uses a supplied FSM inventory UUID instead of the storefront unit id', async () => {
  const fsmInventoryId = '11111111-1111-4111-8111-111111111111';
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace', fsmInventoryId }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    backendPost: async <T>(path: string, body: unknown): Promise<T> => {
      assert.strictEqual(path, `/api/publish/${fsmInventoryId}`);
      assert.deepStrictEqual(body, {
        platforms: ['facebook_marketplace'],
        skipEmail: false,
        source: 'storefront',
        storefront: {
          slug: 'rt-752r45tt-2018',
          unitId: 'RT-752R45TT-2018',
          fsmInventoryId,
          route: '/api/inventory/rt-752r45tt-2018/publish',
        },
      });
      return { inventoryId: fsmInventoryId, summary: { published: 1, errors: 0 } } as T;
    },
  });

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), {
    inventoryId: fsmInventoryId,
    summary: { published: 1, errors: 0 },
  });
});

test('POST publish route maps FSM 4xx responses to a 502 proxy failure', async () => {
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace', fsmInventoryId: '11111111-1111-4111-8111-111111111111' }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
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

test('POST publish route maps FSM network failures to a 502 proxy failure', async () => {
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace', fsmInventoryId: '11111111-1111-4111-8111-111111111111' }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
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

test('POST publish route returns 404 when slug does not resolve', async () => {
  const request = new Request('http://localhost/api/inventory/missing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace' }),
  });

  const response = await handlePublishRequest(request, 'missing-slug', {
    resolveUnitIdBySlug: () => null,
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    backendPost: async () => {
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 404);
  const json = await response.json();
  assert.deepStrictEqual(json, { error: 'Inventory unit not found' });
});

test('POST publish route rejects unsupported platforms before pipeline execution', async () => {
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'linkedin' }),
  });

  let backendCalled = false;
  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    backendPost: async () => {
      backendCalled = true;
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(backendCalled, false);
  const json = await response.json();
  assert.deepStrictEqual(json, {
    error: 'Unsupported platform',
    supportedPlatforms: ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'],
  });
});

test('GET publish preview route resolves lot slug via default deps and returns lot publish preview', async () => {
  const request = new Request('http://localhost/api/inventory/md-lot-001/publish?platform=facebook_marketplace');

  const response = await handlePublishPreviewRequest(request, 'md-lot-001');

  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.strictEqual(json.unitId, 'MD-LOT-001');
  assert.strictEqual(json.platform, 'facebook_marketplace');
  assert.strictEqual(json.mode, 'preview');
  assert.strictEqual(json.lotOnlyFlag, true);
  assert.ok(json.channelCopy.title.length > 0);
});
