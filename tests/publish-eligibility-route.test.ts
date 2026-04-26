import test from 'node:test';
import assert from 'node:assert/strict';

test('publish-eligibility route returns a lightweight summary for all inventory units', async () => {
  const { GET } = await import('../src/app/api/inventory/publish-eligibility/route.ts');

  const response = await GET(new Request('http://localhost/api/inventory/publish-eligibility'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = (await response.json()) as {
    total: number;
    eligible_count: number;
    filter: string;
    units: Array<{
      canonical_slug: string;
      unit_id: string;
      publish_eligibility: boolean;
      hold_flag: boolean;
      lot_only_flag: boolean;
      title?: string;
    }>;
  };

  assert.equal(body.total, 14);
  assert.equal(body.filter, 'none');
  assert.equal(body.units.length, 14);
  assert.equal(body.eligible_count, 5);
  assert.equal(body.eligible_count, body.units.filter((unit) => unit.publish_eligibility && !unit.hold_flag && !unit.lot_only_flag).length);

  const reachTruck = body.units.find((unit) => unit.unit_id === 'RT-752R45TT-2018');
  assert.ok(reachTruck);
  assert.equal(reachTruck.canonical_slug, 'rt-752r45tt-2018');
  assert.equal(reachTruck.publish_eligibility, true);
  assert.equal(reachTruck.hold_flag, false);
  assert.equal(reachTruck.lot_only_flag, false);
  assert.equal(reachTruck.title, undefined);
});

test('publish-eligibility route can filter down to publish-ready inventory only', async () => {
  const { GET } = await import('../src/app/api/inventory/publish-eligibility/route.ts');

  const response = await GET(new Request('http://localhost/api/inventory/publish-eligibility?eligible=true'));

  assert.equal(response.status, 200);

  const body = (await response.json()) as {
    total: number;
    eligible_count: number;
    filter: string;
    units: Array<{
      unit_id: string;
      publish_eligibility: boolean;
      hold_flag: boolean;
      lot_only_flag: boolean;
    }>;
  };

  assert.equal(body.filter, 'eligible_only');
  assert.ok(body.total > 0);
  assert.equal(body.total, body.eligible_count);
  assert.ok(body.units.every((unit) => unit.publish_eligibility && !unit.hold_flag && !unit.lot_only_flag));
  assert.ok(body.units.some((unit) => unit.unit_id === 'RT-970CSR30T-2016'));
  assert.ok(body.units.some((unit) => unit.unit_id === 'RT-752R45TT-2018'));
  assert.ok(body.units.every((unit) => unit.unit_id !== 'MD-LOT-001-unit-1'));
});

test('publish-eligibility route can expose richer operational fields on demand', async () => {
  const { GET } = await import('../src/app/api/inventory/publish-eligibility/route.ts');

  const response = await GET(new Request('http://localhost/api/inventory/publish-eligibility?format=full'));

  assert.equal(response.status, 200);

  const body = (await response.json()) as {
    units: Array<{
      unit_id: string;
      title: string;
      location: string;
      status: string | null;
      asking_price_usd: number | null;
      image_count: number;
      source_kind: 'standalone' | 'lot_member';
      lot_id: string | null;
    }>;
  };

  const lotMember = body.units.find((unit) => unit.unit_id === 'MD-LOT-001-unit-1');
  assert.ok(lotMember);
  assert.match(lotMember.title, /2012 Raymond 5600PC30TT/i);
  assert.match(lotMember.location, /Baltimore|Hamilton/i);
  assert.equal(lotMember.status, 'available');
  assert.equal(lotMember.source_kind, 'lot_member');
  assert.equal(lotMember.lot_id, 'MD-LOT-001');
  assert.ok(lotMember.image_count >= 1);
});
