import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMarketingPublishRequest, type MarketingPublishRouteDeps } from '../src/app/api/marketing/publish/handler.ts';
import { handlePublishRequest, type PublishRouteDeps } from '../src/app/api/inventory/[slug]/publish/handler.ts';
import type { PublishPreviewResult } from '../src/lib/marketing/publishPipeline.ts';

async function withProductionAdminToken<T>(run: () => Promise<T>): Promise<T> {
  const previousToken = process.env.ADMIN_PASTE_QUEUE_TOKEN;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.ADMIN_PASTE_QUEUE_TOKEN = ['admin', 'fixture'].join('-');
  process.env.NODE_ENV = 'production';
  try {
    return await run();
  } finally {
    if (previousToken === undefined) delete process.env.ADMIN_PASTE_QUEUE_TOKEN;
    else process.env.ADMIN_PASTE_QUEUE_TOKEN = previousToken;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
}

async function withFsmBackendApiKey<T>(run: () => Promise<T>): Promise<T> {
  const previousKey = process.env.BACKEND_API_KEY;
  process.env.BACKEND_API_KEY = ['fsm', 'jwt', 'fixture'].join('-');
  try {
    return await run();
  } finally {
    if (previousKey === undefined) delete process.env.BACKEND_API_KEY;
    else process.env.BACKEND_API_KEY = previousKey;
  }
}

function jsonPost(path: string, body: unknown, headers: HeadersInit = {}): Request {
  return new Request(new URL(path, 'https://www.materialsolutionsnj.com'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function previewResult(): PublishPreviewResult {
  return {
    unitId: 'rt-970csr30t-2016',
    platform: 'website',
    mode: 'preview',
    channelCopy: { title: 'Test', description: 'Test', bullets: [], metadata: {} },
    warnings: [],
    qaSummary: { passed: true, checks: [] },
    blockedByQa: false,
    eligible: true,
    holdFlag: false,
    lotOnlyFlag: false,
    publishEligibility: true,
  } as PublishPreviewResult;
}

test('marketing publish proxy rejects direct unauthenticated calls before backend side effects', async () => {
  await withProductionAdminToken(async () => {
    let backendCalls = 0;
    const deps: MarketingPublishRouteDeps = {
      async backendPost() {
        backendCalls += 1;
        return { ok: true };
      },
    };

    const response = await handleMarketingPublishRequest(
      jsonPost('/api/marketing/publish', { unitId: 'rt-970csr30t-2016', platform: 'website' }),
      deps,
    );

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(backendCalls, 0);
  });
});

test('inventory publish proxy rejects direct unauthenticated calls before backend side effects', async () => {
  await withProductionAdminToken(async () => {
    let backendCalls = 0;
    const deps: PublishRouteDeps = {
      resolveUnitIdBySlug: () => 'rt-970csr30t-2016',
      async previewPublishPipeline() {
        return previewResult();
      },
      async backendPost() {
        backendCalls += 1;
        return { ok: true };
      },
    };

    const response = await handlePublishRequest(
      jsonPost('/api/inventory/rt-970csr30t-2016/publish', { platform: 'website' }),
      'rt-970csr30t-2016',
      deps,
    );

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(backendCalls, 0);
  });
});

test('publish proxies allow direct calls when the admin bearer token and FSM backend key are valid', async () => {
  await withProductionAdminToken(async () => withFsmBackendApiKey(async () => {
    let marketingBackendCalls = 0;
    let inventoryBackendCalls = 0;
    const marketingDeps: MarketingPublishRouteDeps = {
      async backendPost() {
        marketingBackendCalls += 1;
        return { ok: true };
      },
    };
    const inventoryDeps: PublishRouteDeps = {
      resolveUnitIdBySlug: () => 'rt-970csr30t-2016',
      async previewPublishPipeline() {
        return previewResult();
      },
      async backendPost() {
        inventoryBackendCalls += 1;
        return { ok: true };
      },
    };

    const authHeader = { authorization: 'Bearer admin-fixture' };
    const fsmInventoryId = '11111111-1111-4111-8111-111111111111';
    const marketingResponse = await handleMarketingPublishRequest(
      jsonPost('/api/marketing/publish', { unitId: 'rt-970csr30t-2016', fsmInventoryId, platform: 'website' }, authHeader),
      marketingDeps,
    );
    const inventoryResponse = await handlePublishRequest(
      jsonPost('/api/inventory/rt-970csr30t-2016/publish', { platform: 'website', fsmInventoryId }, authHeader),
      'rt-970csr30t-2016',
      inventoryDeps,
    );

    assert.equal(marketingResponse.status, 200);
    assert.equal(inventoryResponse.status, 200);
    assert.equal(marketingBackendCalls, 1);
    assert.equal(inventoryBackendCalls, 1);
  }));
});

test('publish proxies fail closed before backend calls when the FSM backend key is missing', async () => {
  await withProductionAdminToken(async () => {
    const previousKey = process.env.BACKEND_API_KEY;
    delete process.env.BACKEND_API_KEY;
    try {
      let marketingBackendCalls = 0;
      let inventoryBackendCalls = 0;
      const marketingDeps: MarketingPublishRouteDeps = {
        async backendPost() {
          marketingBackendCalls += 1;
          return { ok: true };
        },
      };
      const inventoryDeps: PublishRouteDeps = {
        resolveUnitIdBySlug: () => 'rt-970csr30t-2016',
        async previewPublishPipeline() {
          return previewResult();
        },
        async backendPost() {
          inventoryBackendCalls += 1;
          return { ok: true };
        },
      };

      const authHeader = { authorization: 'Bearer admin-fixture' };
      const fsmInventoryId = '11111111-1111-4111-8111-111111111111';
      const marketingResponse = await handleMarketingPublishRequest(
        jsonPost('/api/marketing/publish', { unitId: 'rt-970csr30t-2016', fsmInventoryId, platform: 'website' }, authHeader),
        marketingDeps,
      );
      const inventoryResponse = await handlePublishRequest(
        jsonPost('/api/inventory/rt-970csr30t-2016/publish', { platform: 'website', fsmInventoryId }, authHeader),
        'rt-970csr30t-2016',
        inventoryDeps,
      );

      assert.equal(marketingResponse.status, 503);
      assert.equal(inventoryResponse.status, 503);
      assert.equal(marketingBackendCalls, 0);
      assert.equal(inventoryBackendCalls, 0);
      assert.match(await marketingResponse.text(), /FSM backend API key not configured/);
      assert.match(await inventoryResponse.text(), /FSM backend API key not configured/);
    } finally {
      if (previousKey === undefined) delete process.env.BACKEND_API_KEY;
      else process.env.BACKEND_API_KEY = previousKey;
    }
  });
});
