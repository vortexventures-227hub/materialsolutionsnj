import assert from 'node:assert/strict';
import test from 'node:test';

import { handlePublishPreviewRequest, handlePublishRequest } from '../../../app/api/inventory/[slug]/publish/handler';

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
      qaSummary: { overallStatus: 'pass', results: [], errorLog: [] },
      channelCopy: {
        title: '2018 Raymond Reach Truck',
        description: 'Ready to preview',
        price: 29500,
        image_urls: ['https://example.com/image.jpg'],
        primary_image_url: 'https://example.com/image.jpg',
        category_mapping: 'Vehicles > Commercial > Forklifts',
        platform_specific_fields: {},
        char_limit_warnings: [],
      },
    }),
    runPublishPipeline: async () => {
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.deepStrictEqual(json, {
    unitId: 'RT-752R45TT-2018',
    platform: 'facebook_marketplace',
    mode: 'preview',
    channelCopy: {
      title: '2018 Raymond Reach Truck',
      description: 'Ready to preview',
      price: 29500,
      image_urls: ['https://example.com/image.jpg'],
      primary_image_url: 'https://example.com/image.jpg',
      category_mapping: 'Vehicles > Commercial > Forklifts',
      platform_specific_fields: {},
      char_limit_warnings: [],
    },
    warnings: [],
    blockedByQa: false,
  });
});

test('POST publish route resolves slug, runs pipeline, and returns receipt payload', async () => {
  const request = new Request('http://localhost/api/inventory/rt-752r45tt-2018/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform: 'facebook_marketplace' }),
  });

  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: (slug) => slug === 'rt-752r45tt-2018' ? 'RT-752R45TT-2018' : null,
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    runPublishPipeline: async (unitId, platform) => ({
      unitId,
      platform,
      mode: 'dry_run',
      receiptId: 'abc123def456',
      queueFilePath: '/tmp/queue/rt-752r45tt-2018-facebook.json',
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
  });

  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.deepStrictEqual(json, {
    unitId: 'RT-752R45TT-2018',
    platform: 'facebook_marketplace',
    receiptId: 'abc123def456',
    mode: 'dry_run',
    queueFilePath: '/tmp/queue/rt-752r45tt-2018-facebook.json',
    warnings: ['SENDGRID_API_KEY not set'],
    blockedByQa: false,
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
    runPublishPipeline: async () => {
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

  let pipelineCalled = false;
  const response = await handlePublishRequest(request, 'rt-752r45tt-2018', {
    resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
    previewPublishPipeline: async () => {
      throw new Error('should not run');
    },
    runPublishPipeline: async () => {
      pipelineCalled = true;
      throw new Error('should not run');
    },
  });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(pipelineCalled, false);
  const json = await response.json();
  assert.deepStrictEqual(json, {
    error: 'Unsupported platform',
    supportedPlatforms: ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'],
  });
});
