import test from 'node:test';
import assert from 'node:assert/strict';

test('canonical batch route returns the full canonical snapshot for all inventory units', async () => {
  const { GET } = await import('../src/app/api/inventory/canonical/batch/route.ts');

  const response = await GET(new Request('http://localhost/api/inventory/canonical/batch'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = (await response.json()) as {
    count: number;
    assets_included: boolean;
    results: Array<{
      unit_id: string;
      canonical_slug: string;
      title: string;
      publish_eligibility: boolean;
      lot_only_flag: boolean;
      platform_overrides?: unknown[];
    }>;
  };

  assert.equal(body.assets_included, false);
  assert.equal(body.count, 14);
  assert.equal(body.results.length, 14);

  const reachTruck = body.results.find((entry) => entry.unit_id === 'RT-752R45TT-2018');
  assert.ok(reachTruck);
  assert.equal(reachTruck.canonical_slug, 'rt-752r45tt-2018');
  assert.match(reachTruck.title, /Raymond 752R45TT/i);
  assert.equal(reachTruck.publish_eligibility, false);
  assert.equal(reachTruck.lot_only_flag, false);
  assert.equal(reachTruck.platform_overrides, undefined);

  const swingReach = body.results.find((entry) => entry.unit_id === 'RT-970CSR30T-2016');
  assert.ok(swingReach);
  assert.equal(swingReach.canonical_slug, 'rt-970csr30t-2016');
  assert.match(swingReach.title, /Raymond 970CSR30T/i);
  assert.equal(swingReach.publish_eligibility, true);
  assert.equal(swingReach.lot_only_flag, false);
});

test('canonical batch route can include full marketing assets for every inventory unit', async () => {
  const { GET } = await import('../src/app/api/inventory/canonical/batch/route.ts');

  const response = await GET(new Request('http://localhost/api/inventory/canonical/batch?assets=1'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = (await response.json()) as {
    count: number;
    assets_included: boolean;
    results: Array<{
      unit_id: string;
      canonical_slug: string;
      faq: Array<{ question: string; answer: string }>;
      platform_overrides: Array<{ channel: string; title: string; description: string }>;
      images: Array<{ alt: string }>;
    }>;
  };

  assert.equal(body.assets_included, true);
  assert.equal(body.count, 14);
  assert.equal(body.results.length, 14);

  const lotUnit = body.results.find((entry) => entry.unit_id === 'MD-LOT-001-unit-1');
  assert.ok(lotUnit);
  assert.equal(lotUnit.canonical_slug, 'md-lot-001-unit-1');
  assert.ok(lotUnit.faq.length >= 3);
  assert.ok(lotUnit.images.length >= 1);
  assert.ok(lotUnit.platform_overrides.length >= 7);
  assert.ok(lotUnit.platform_overrides.some((override) => override.channel === 'linkedin'));
});
