import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMarketingPublishRequest } from '../../../app/api/marketing/publish/handler';

const mockEligiblePreview = {
  eligible: true,
  holdFlag: false,
  lotOnlyFlag: false,
  blockedByQa: false,
  qaSummary: { overallStatus: 'pass' as const, results: [], errorLog: [] },
  publishEligibility: true,
  unitId: 'RT-752R45TT-2018',
  platform: 'facebook_marketplace' as const,
  mode: 'preview' as const,
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
  warnings: [] as string[],
};

test('POST /api/marketing/publish returns dry-run payloads without persisting listing status', async () => {
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
    previewPublishPipeline: async () => mockEligiblePreview,
    runPublishPipeline: async (unitId, platform) => ({
      unitId,
      platform,
      mode: 'dry_run',
      receiptId: 'abc123def456',
      queueFilePath: '/tmp/queue/rt-752r45tt-2018-facebook.md',
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
  assert.deepStrictEqual(upsertCalls, []);
});

test('POST /api/marketing/publish persists listing status for api publishes', async () => {
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
    previewPublishPipeline: async () => mockEligiblePreview,
    runPublishPipeline: async (unitId, platform) => ({
      unitId,
      platform,
      mode: 'api',
      receiptId: 'live123',
      listingUrl: 'https://example.com/listings/rt-752r45tt-2018',
      warnings: [],
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
  assert.equal(json.mode, 'api');
  assert.equal(upsertCalls.length, 1);
  assert.equal(upsertCalls[0]?.unit_id, 'RT-752R45TT-2018');
  assert.equal(upsertCalls[0]?.platform, 'facebook_marketplace');
  assert.equal(upsertCalls[0]?.status, 'posted');
  assert.equal(upsertCalls[0]?.live_url, 'https://example.com/listings/rt-752r45tt-2018');
  assert.match(String(upsertCalls[0]?.posted_at), /^\d{4}-\d{2}-\d{2}T/);
});

test('POST /api/marketing/publish rejects invalid JSON bodies', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{bad json',
  });

  const response = await handleMarketingPublishRequest(request, {
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    runPublishPipeline: async () => {
      throw new Error('should not run');
    },
    upsertListingStatus: async () => null,
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
    previewPublishPipeline: async () => {
      pipelineCalled = true;
      return mockEligiblePreview;
    },
    runPublishPipeline: async () => {
      throw new Error('should not run');
    },
    upsertListingStatus: async () => null,
  });

  assert.strictEqual(response.status, 400);
  // pipelineCalled is false because platform check fails before previewPublishPipeline
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
    previewPublishPipeline: async () => mockEligiblePreview,
    runPublishPipeline: async () => {
      throw new Error("Unit 'INVALID-UNIT' not found in inventory");
    },
    upsertListingStatus: async () => null,
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
    previewPublishPipeline: async () => mockEligiblePreview,
    runPublishPipeline: async () => {
      throw new Error('formatter publish failed');
    },
    upsertListingStatus: async () => null,
  });

  assert.strictEqual(response.status, 500);
  assert.deepStrictEqual(await response.json(), { error: 'Failed to publish marketing payload' });
});

test('POST /api/marketing/publish returns 422 for ineligible units', async () => {
  const request = new Request('http://localhost/api/marketing/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId: 'RT-752R45TT-2018', platform: 'facebook_marketplace' }),
  });

  const response = await handleMarketingPublishRequest(request, {
    previewPublishPipeline: async () => ({
      eligible: false,
      holdFlag: false,
      lotOnlyFlag: false,
      blockedByQa: false,
      qaSummary: { overallStatus: 'fail' as const, results: [], errorLog: [] },
      publishEligibility: false,
      unitId: 'RT-752R45TT-2018',
      platform: 'facebook_marketplace' as const,
      mode: 'preview' as const,
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
      warnings: [],
    }),
    runPublishPipeline: async () => {
      throw new Error('should not run');
    },
    upsertListingStatus: async () => null,
  });

  assert.strictEqual(response.status, 422);
  const json = await response.json();
  assert.equal(json.error, 'Unit is not eligible for publish');
  assert.equal(json.unitId, 'RT-752R45TT-2018');
  assert.ok(Array.isArray(json.ineligibleReasons));
});
