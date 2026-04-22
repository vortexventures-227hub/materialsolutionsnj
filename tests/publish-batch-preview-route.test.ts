import assert from 'node:assert/strict';
import test from 'node:test';

import { handleBatchPublishPreviewRequest } from '../src/app/api/inventory/publish/preview/handler';

test('GET batch publish preview route returns preview payloads plus missing slugs', async () => {
  const request = new Request(
    'http://localhost/api/inventory/publish/preview?slugs=rt-752r45tt-2018,missing-lot,md-lot-001&platform=facebook_marketplace'
  );

  const response = await handleBatchPublishPreviewRequest(request, {
    resolveUnitIdBySlug: (slug) => {
      if (slug === 'rt-752r45tt-2018') return 'RT-752R45TT-2018';
      if (slug === 'md-lot-001') return 'MD-LOT-001';
      return null;
    },
    previewPublishPipeline: async (unitId, platform) => ({
      unitId,
      platform,
      mode: 'preview',
      warnings: unitId === 'MD-LOT-001' ? ['lot-only listing'] : [],
      blockedByQa: unitId === 'MD-LOT-001',
      eligible: unitId !== 'MD-LOT-001',
      holdFlag: false,
      lotOnlyFlag: unitId === 'MD-LOT-001',
      publishEligibility: true,
      qaSummary: { overallStatus: unitId === 'MD-LOT-001' ? 'fail' : 'pass', results: [], errorLog: [] },
      channelCopy: {
        title: `${unitId} title`,
        description: `${unitId} description`,
        price: unitId === 'MD-LOT-001' ? null : 29500,
        image_urls: ['https://example.com/image.jpg'],
        primary_image_url: 'https://example.com/image.jpg',
        category_mapping: 'Vehicles > Commercial > Forklifts',
        platform_specific_fields: {},
        char_limit_warnings: [],
      },
    }),
    now: () => new Date('2026-04-22T12:00:00.000Z'),
  });

  assert.equal(response.status, 200);

  const json = (await response.json()) as {
    requested: string[];
    found: number;
    missing: string[];
    platform: string;
    generated_at: string;
    units: Array<{
      slug: string;
      unitId: string;
      eligible: boolean;
      holdFlag: boolean;
      lotOnlyFlag: boolean;
      publishEligibility: boolean;
      warnings: string[];
      blockedByQa: boolean;
      channelCopy: { title: string; description: string; image_urls: string[]; price: number | null };
    }>;
  };

  assert.deepEqual(json.requested, ['rt-752r45tt-2018', 'missing-lot', 'md-lot-001']);
  assert.equal(json.found, 2);
  assert.deepEqual(json.missing, ['missing-lot']);
  assert.equal(json.platform, 'facebook_marketplace');
  assert.equal(json.generated_at, '2026-04-22T12:00:00.000Z');
  assert.equal(json.units.length, 2);
  assert.deepEqual(
    json.units.map((unit) => ({
      slug: unit.slug,
      unitId: unit.unitId,
      eligible: unit.eligible,
      holdFlag: unit.holdFlag,
      lotOnlyFlag: unit.lotOnlyFlag,
      publishEligibility: unit.publishEligibility,
      warnings: unit.warnings,
      blockedByQa: unit.blockedByQa,
      title: unit.channelCopy.title,
      description: unit.channelCopy.description,
    })),
    [
      {
        slug: 'rt-752r45tt-2018',
        unitId: 'RT-752R45TT-2018',
        eligible: true,
        holdFlag: false,
        lotOnlyFlag: false,
        publishEligibility: true,
        warnings: [],
        blockedByQa: false,
        title: 'RT-752R45TT-2018 title',
        description: 'RT-752R45TT-2018 description',
      },
      {
        slug: 'md-lot-001',
        unitId: 'MD-LOT-001',
        eligible: false,
        holdFlag: false,
        lotOnlyFlag: true,
        publishEligibility: true,
        warnings: ['lot-only listing'],
        blockedByQa: true,
        title: 'MD-LOT-001 title',
        description: 'MD-LOT-001 description',
      },
    ],
  );
  assert.deepEqual(json.units[0]?.channelCopy.image_urls, ['https://example.com/image.jpg']);
  assert.equal(json.units[1]?.channelCopy.price, null);
});

test('GET batch publish preview route rejects unsupported platforms before preview execution', async () => {
  let previewCalls = 0;

  const response = await handleBatchPublishPreviewRequest(
    new Request('http://localhost/api/inventory/publish/preview?slugs=rt-752r45tt-2018&platform=linkedin'),
    {
      resolveUnitIdBySlug: () => 'RT-752R45TT-2018',
      previewPublishPipeline: async () => {
        previewCalls += 1;
        throw new Error('should not run');
      },
      now: () => new Date('2026-04-22T12:00:00.000Z'),
    }
  );

  assert.equal(response.status, 400);
  assert.equal(previewCalls, 0);
  assert.deepEqual(await response.json(), {
    error: 'Unsupported platform',
    supportedPlatforms: ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'],
  });
});
