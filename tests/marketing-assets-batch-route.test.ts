import test from 'node:test';
import assert from 'node:assert/strict';

test('batch marketing-assets route scopes channel variants to requested platforms', async () => {
  const { GET } = await import('../src/app/api/inventory/marketing-assets/route.ts');

  const response = await GET(
    new Request(
      'http://localhost/api/inventory/marketing-assets?slugs=rt-752r45tt-2018,md-lot-001-unit-1&platforms=facebook_marketplace,craigslist,unknown'
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

  assert.deepEqual(body.slugs_requested, ['rt-752r45tt-2018', 'md-lot-001-unit-1']);
  assert.deepEqual(body.platforms_included, ['facebook_marketplace', 'craigslist']);
  assert.equal(body.results.length, 2);

  const reachTruck = body.results.find((entry) => entry.slug === 'rt-752r45tt-2018');
  assert.ok(reachTruck);
  assert.equal(reachTruck.unit_id, 'RT-752R45TT-2018');
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
      'http://localhost/api/inventory/marketing-assets?slugs=rt-752r45tt-2018&platforms=facebook_marketplace,craigslist&format=plain'
    )
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = await response.text();
  assert.match(body, /RT-752R45TT-2018/);
  assert.match(body, /\[facebook_marketplace\]/);
  assert.match(body, /\[craigslist\]/);
  assert.doesNotMatch(body, /\[linkedin\]/);
  assert.match(body, /Images:/);
});
