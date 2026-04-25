import test from 'node:test';
import assert from 'node:assert/strict';

import {
  summarizeBatchMarketingResults,
  type BatchMarketingAssetResult,
} from '../src/lib/marketing/batchMarketingAssets.ts';

test('batch marketing summary counts only non-hold non-lot entries as publish-ready', () => {
  const summary = summarizeBatchMarketingResults([
    {
      slug: 'eligible-unit',
      unit_id: 'ELIGIBLE-1',
      publish_eligibility: true,
      hold_flag: false,
      lot_only_flag: false,
      images: [],
      channel_copy_variants: [],
    },
    {
      slug: 'lot-member',
      unit_id: 'LOT-1',
      publish_eligibility: true,
      hold_flag: false,
      lot_only_flag: true,
      images: [],
      channel_copy_variants: [],
    },
    {
      slug: 'held-unit',
      unit_id: 'HOLD-1',
      publish_eligibility: true,
      hold_flag: true,
      lot_only_flag: false,
      images: [],
      channel_copy_variants: [],
    },
  ] satisfies BatchMarketingAssetResult[]);

  assert.deepEqual(summary, {
    eligible: 1,
    on_hold: 1,
    lot_only: 1,
    total: 3,
  });
});

test('batch marketing-assets route scopes channel variants to requested platforms', async () => {
  const { GET } = await import('../src/app/api/inventory/marketing-assets/route.ts');

  const response = await GET(
    new Request(
      'http://localhost/api/inventory/marketing-assets?slugs=rt-970csr30t-2016,md-lot-001-unit-1&platforms=facebook_marketplace,craigslist,unknown'
    )
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = (await response.json()) as {
    slugs_requested: string[];
    platforms_included: string[];
    results: Array<{
      slug: string;
      unit_id: string;
      publish_eligibility: boolean;
      hold_flag: boolean;
      lot_only_flag: boolean;
      images: Array<{ url: string; alt: string }>;
      channel_copy_variants: Array<{ channel: string; title: string; description: string }>;
    }>;
  };

  assert.deepEqual(body.slugs_requested, ['rt-970csr30t-2016', 'md-lot-001-unit-1']);
  assert.deepEqual(body.platforms_included, ['facebook_marketplace', 'craigslist']);
  assert.equal(body.results.length, 2);

  const reachTruck = body.results.find((entry) => entry.slug === 'rt-970csr30t-2016');
  assert.ok(reachTruck);
  assert.equal(reachTruck.unit_id, 'RT-970CSR30T-2016');
  assert.equal(reachTruck.publish_eligibility, true);
  assert.equal(reachTruck.hold_flag, false);
  assert.ok(Array.isArray(reachTruck.images));
  assert.ok(reachTruck.images.length > 0);
  assert.match(reachTruck.images[0].url, /^https?:\/\//);
  assert.equal(typeof reachTruck.images[0].alt, 'string');
  assert.ok(reachTruck.images[0].alt.length > 0);
  assert.deepEqual(
    reachTruck.channel_copy_variants.map((entry) => entry.channel),
    ['facebook_marketplace', 'craigslist']
  );

  const lotUnit = body.results.find((entry) => entry.slug === 'md-lot-001-unit-1');
  assert.ok(lotUnit);
  assert.equal(lotUnit.unit_id, 'MD-LOT-001-unit-1');
  assert.equal(lotUnit.lot_only_flag, true);
  assert.deepEqual(
    lotUnit.channel_copy_variants.map((entry) => entry.channel),
    ['facebook_marketplace', 'craigslist']
  );
});

test('batch marketing-assets route can emit plain-text preview output', async () => {
  const { GET } = await import('../src/app/api/inventory/marketing-assets/route.ts');

  const response = await GET(
    new Request(
      'http://localhost/api/inventory/marketing-assets?slugs=rt-970csr30t-2016&platforms=facebook_marketplace,craigslist&format=plain'
    )
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = await response.text();
  assert.match(body, /RT-970CSR30T-2016/);
  assert.match(body, /\[facebook_marketplace\]/);
  assert.match(body, /\[craigslist\]/);
  assert.doesNotMatch(body, /\[linkedin\]/);
  assert.match(body, /Images:/);
});

test('batch marketing-assets route can limit results to publish-ready units only', async () => {
  const { GET } = await import('../src/app/api/inventory/marketing-assets/route.ts');

  const response = await GET(
    new Request(
      'http://localhost/api/inventory/marketing-assets?slugs=rt-970csr30t-2016,md-lot-001-unit-1&platforms=facebook_marketplace,craigslist&eligible_only=true'
    )
  );

  assert.equal(response.status, 200);

  const body = (await response.json()) as {
    results: Array<{
      slug: string;
      unit_id: string;
      hold_flag: boolean;
      lot_only_flag: boolean;
      publish_eligibility: boolean;
    }>;
  };

  assert.deepEqual(
    body.results.map((entry) => entry.slug),
    ['rt-970csr30t-2016']
  );
  assert.equal(body.results[0]?.unit_id, 'RT-970CSR30T-2016');
  assert.equal(body.results[0]?.publish_eligibility, true);
  assert.equal(body.results[0]?.hold_flag, false);
  assert.equal(body.results[0]?.lot_only_flag, false);
});
