import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMarketingPublishRequest } from '../src/app/api/marketing/publish/handler.ts';
import { handlePublishRequest, type PublishRouteDeps } from '../src/app/api/inventory/[slug]/publish/handler.ts';
import type { MarketingPublishRouteDeps } from '../src/app/api/marketing/publish/handler.ts';
import type { PipelineResult, PublishPreviewResult } from '../src/lib/marketing/publishPipeline.ts';

function withAdminEnv<T>(run: () => T): T {
  const previous = process.env.ADMIN_PASTE_QUEUE_TOKEN;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.ADMIN_PASTE_QUEUE_TOKEN = 'secret-token';
  process.env.NODE_ENV = 'production';
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PASTE_QUEUE_TOKEN;
    else process.env.ADMIN_PASTE_QUEUE_TOKEN = previous;
    process.env.NODE_ENV = previousNodeEnv;
  }
}

function jsonRequest(path: string, body: unknown, init?: RequestInit): Request {
  return new Request(new URL(path, 'https://www.materialsolutionsnj.com'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });
}

function pipelineResult(overrides: Partial<PipelineResult> = {}): PipelineResult {
  return {
    unitId: 'rt-752r45tt-2018',
    platform: 'website',
    mode: 'api',
    channelCopy: { title: 'Test', description: 'Test', bullets: [], metadata: {} },
    receiptId: 'receipt-1',
    notifications: [],
    warnings: [],
    qaSummary: { passed: true, checks: [] },
    blockedByQa: false,
    ...overrides,
  } as PipelineResult;
}

function previewResult(): PublishPreviewResult {
  return {
    unitId: 'rt-752r45tt-2018',
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

test('marketing publish handler rejects direct unauthenticated calls before side effects', async () => {
  await withAdminEnv(async () => {
    let pipelineCalls = 0;
    let listingStatusCalls = 0;
    const deps: MarketingPublishRouteDeps = {
      async runPublishPipeline() {
        pipelineCalls += 1;
        return pipelineResult();
      },
      async upsertListingStatus() {
        listingStatusCalls += 1;
        return null;
      },
    };

    const response = await handleMarketingPublishRequest(
      jsonRequest('/api/marketing/publish', { unitId: 'rt-752r45tt-2018', platform: 'website' }),
      deps,
    );

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex,nofollow');
    assert.equal(pipelineCalls, 0);
    assert.equal(listingStatusCalls, 0);
  });
});

test('inventory publish handler rejects direct unauthenticated calls before side effects', async () => {
  await withAdminEnv(async () => {
    let pipelineCalls = 0;
    const deps: PublishRouteDeps = {
      resolveUnitIdBySlug: () => 'rt-752r45tt-2018',
      async runPublishPipeline() {
        pipelineCalls += 1;
        return pipelineResult();
      },
      async previewPublishPipeline() {
        return previewResult();
      },
    };

    const response = await handlePublishRequest(
      jsonRequest('/api/inventory/rt-752r45tt-2018/publish', { platform: 'website' }),
      'rt-752r45tt-2018',
      deps,
    );

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex,nofollow');
    assert.equal(pipelineCalls, 0);
  });
});

test('marketing publish handler allows direct calls with a valid primary admin token header', async () => {
  await withAdminEnv(async () => {
    let marketingCalls = 0;
    const marketingDeps: MarketingPublishRouteDeps = {
      async runPublishPipeline() {
        marketingCalls += 1;
        return pipelineResult();
      },
      async upsertListingStatus() {
        return null;
      },
    };

    const response = await handleMarketingPublishRequest(
      jsonRequest('/api/marketing/publish', { unitId: 'rt-752r45tt-2018', platform: 'website' }, {
        headers: { 'x-msnj-admin-token': 'secret-token' },
      }),
      marketingDeps,
    );

    assert.equal(response.status, 200);
    assert.equal(marketingCalls, 1);
  });
});

test('inventory publish handler allows direct calls with a valid legacy admin token header', async () => {
  await withAdminEnv(async () => {
    let inventoryCalls = 0;
    const inventoryDeps: PublishRouteDeps = {
      resolveUnitIdBySlug: () => 'rt-752r45tt-2018',
      async runPublishPipeline() {
        inventoryCalls += 1;
        return pipelineResult();
      },
      async previewPublishPipeline() {
        return previewResult();
      },
    };

    const response = await handlePublishRequest(
      jsonRequest('/api/inventory/rt-752r45tt-2018/publish', { platform: 'website' }, {
        headers: { 'x-admin-token': 'secret-token' },
      }),
      'rt-752r45tt-2018',
      inventoryDeps,
    );

    assert.equal(response.status, 200);
    assert.equal(inventoryCalls, 1);
  });
});
