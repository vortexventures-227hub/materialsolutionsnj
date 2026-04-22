import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMarketingPublishRequest } from '../../../app/api/marketing/publish/handler';

test('POST /api/marketing/publish accepts unitId directly, persists listing status, and returns publish receipt payload', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const upsertCalls: Array<{
    unit_id: string;
    platform: string;
    status: string;
    live_url?: string | null;
    posted_at?: string | null;
  }> = [];

  const response = await handleMarketingPublishRequest(request, {
    runPublishPipeline: async (unitId, platform) => ({
      unitId,
      platform,
      mode: 'dry_run',
      receiptId: 'abc123def456',
      queueFilePath: '/tmp/queue/rt-752r45tt-2018-facebook.md',
      listingUrl: null,
      warnings: ['SENDGRID_API_KEY not set'],
      notifications: [],
      blockedByQa: false,
      qaSummary: { overallStatus: 'pass', results: [], errorLog: [] },
      channelCopy: {
        title: '2018 Raymond Reach Truck',
        description: 'Ready to publish',
        price: 29500,
        image_urls: ['https://example.com/image.jpg'],
        primary_image_url: 'https://example.com/image.jpg',
        category_mapping: 'Vehicles > Commercial > Forklifts',
        platform_specific_fields: {},
        posting_instructions: null,
        char_limit_warnings: [],
      },
    }),
    upsertListingStatus: async (input) => {
      upsertCalls.push(input);
      return null;
    },
  });

  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.deepStrictEqual(json, {
    unitId: 'RT-752R45TT-2018',
    platform: 'facebook_marketplace',
    receiptId: 'abc123def456',
    mode: 'dry_run',
    listingUrl: null,
    queueFilePath: '/tmp/queue/rt-752r45tt-2018-facebook.md',
    warnings: ['SENDGRID_API_KEY not set'],
    blockedByQa: false,
  });
  assert.strictEqual(upsertCalls.length, 1);
  assert.deepStrictEqual(upsertCalls[0], {
    unit_id: 'RT-752R45TT-2018',
    platform: 'facebook_marketplace',
    status: 'posted',
    live_url: '/tmp/queue/rt-752r45tt-2018-facebook.md',
    posted_at: null,
  });
});

test('POST /api/marketing/publish rejects invalid JSON bodies', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{bad json',
  });

  const response = await handleMarketingPublishRequest(request, {
    runPublishPipeline: async () => {
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(await response.json(), { error: 'Invalid JSON body' });
});

test('POST /api/marketing/publish rejects unsupported platforms before pipeline execution', async () => {
  let pipelineCalled = false;
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'linkedin' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    runPublishPipeline: async () => {
      pipelineCalled = true;
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(pipelineCalled, false);
  assert.deepStrictEqual(await response.json(), {
    error: 'Unsupported platform',
    supportedPlatforms: ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'],
  });
});

test('POST /api/marketing/publish maps missing inventory units to 404', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'INVALID-UNIT', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    runPublishPipeline: async () => {
      throw new Error("Unit 'INVALID-UNIT' not found in inventory");
    },
  });

  assert.strictEqual(response.status, 404);
  assert.deepStrictEqual(await response.json(), { error: 'Inventory unit not found' });
});

test('POST /api/marketing/publish maps unexpected pipeline failures to 500', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    runPublishPipeline: async () => {
      throw new Error('formatter publish failed');
    },
  });

  assert.strictEqual(response.status, 500);
  assert.deepStrictEqual(await response.json(), { error: 'Failed to publish marketing payload' });
});
