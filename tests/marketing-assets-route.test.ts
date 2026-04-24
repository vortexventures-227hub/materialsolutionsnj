import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('marketing-assets route exposes canonical marketing payload for an eligible inventory slug', async () => {
  const { GET } = await import('../src/app/api/inventory/[slug]/marketing-assets/route.ts');

  const response = await GET(
    new Request('http://localhost/api/inventory/rt-752r45tt-2018/marketing-assets'),
    { params: Promise.resolve({ slug: 'rt-752r45tt-2018' }) }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = (await response.json()) as {
    unit_id: string;
    canonical_url: string;
    publish_eligibility: boolean;
    hold_flag: boolean;
    lot_only_flag: boolean;
    derivation_version: string;
    claim_safety_flags: string[];
    seo_title: string;
    meta_description: string;
    og_title: string;
    og_description: string;
    faq_array: Array<{ question: string; answer: string }>;
    schema_payload: Record<string, unknown>;
    channel_copy_variants: Array<{ channel: string; title: string; description: string }>;
    alt_text_array: string[];
  };

  assert.equal(body.unit_id, 'RT-752R45TT-2018');
  assert.match(body.canonical_url, /\/inventory\/rt-752r45tt-2018$/);
  assert.equal(body.publish_eligibility, true);
  assert.equal(body.hold_flag, false);
  assert.equal(body.lot_only_flag, false);
  assert.equal(body.derivation_version, 'herm-v1-lane-h-exec-1');
  assert.deepEqual(body.claim_safety_flags, []);
  assert.match(body.seo_title, /Raymond 752R45TT/i);
  assert.match(body.meta_description, /2018 Raymond 752R45TT Reach Truck/i);
  assert.equal(body.og_title, body.seo_title);
  assert.ok(body.og_description.length > 20);
  assert.ok(body.faq_array.length >= 3);
  assert.ok(body.channel_copy_variants.length >= 5);
  assert.ok(body.alt_text_array.length >= 1);
  assert.equal(body.schema_payload.product['@type'], 'Product');
  assert.equal(body.schema_payload.vehicle['@type'], 'Vehicle');

  const facebookVariant = body.channel_copy_variants.find((entry) => entry.channel === 'facebook_marketplace');
  const linkedinVariant = body.channel_copy_variants.find((entry) => entry.channel === 'linkedin');
  const offerUpVariant = body.channel_copy_variants.find((entry) => entry.channel === 'offer_up');
  const machineryTraderVariant = body.channel_copy_variants.find((entry) => entry.channel === 'machinery_trader');
  const ironPlanetVariant = body.channel_copy_variants.find((entry) => entry.channel === 'iron_planet');
  assert.ok(facebookVariant);
  assert.ok(linkedinVariant);
  assert.ok(offerUpVariant);
  assert.ok(machineryTraderVariant);
  assert.ok(ironPlanetVariant);
  assert.notEqual(linkedinVariant.title, facebookVariant.title);
  assert.match(linkedinVariant.title, /Material Solutions NJ/);
  assert.match(linkedinVariant.description, /#forklift #materialhandling #usedequipment #warehousing/);

  for (const variant of [linkedinVariant, offerUpVariant, machineryTraderVariant, ironPlanetVariant]) {
    assert.doesNotMatch(variant.description, /marketplace_inbox/);
    assert.doesNotMatch(variant.description, /VEHICLES > FORKLIFTS/);
  }
});

test('marketing-assets route keeps lot-only gating visible for publishable lot members', async () => {
  const { GET } = await import('../src/app/api/inventory/[slug]/marketing-assets/route.ts');

  const response = await GET(
    new Request('http://localhost/api/inventory/md-lot-001-unit-1/marketing-assets'),
    { params: Promise.resolve({ slug: 'md-lot-001-unit-1' }) }
  );

  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    unit_id: string;
    publish_eligibility: boolean;
    lot_only_flag: boolean;
    claim_safety_flags: string[];
  };

  assert.equal(body.unit_id, 'MD-LOT-001-unit-1');
  assert.equal(body.publish_eligibility, true);
  assert.equal(body.lot_only_flag, true);
  assert.ok(body.claim_safety_flags.includes('lot_only_pricing'));
});

test('marketing-assets route returns 404 for an unknown inventory slug', async () => {
  const { GET } = await import('../src/app/api/inventory/[slug]/marketing-assets/route.ts');

  const response = await GET(
    new Request('http://localhost/api/inventory/not-a-real-unit/marketing-assets'),
    { params: Promise.resolve({ slug: 'not-a-real-unit' }) }
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Marketing assets not found' });
});

test('marketing-assets route source explicitly blocks ineligible units from public payload emission', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/inventory/[slug]/marketing-assets/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /generateMarketingAssets/);
  assert.match(routeSource, /findInventoryUnitBySlug/);
  assert.match(routeSource, /!canonical\.publish_eligibility/);
  assert.match(routeSource, /status:\s*404/);
});

test('marketing-assets route treats persisted blocked rows as authoritative instead of regenerating fallback payloads', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/inventory/[slug]/marketing-assets/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /if \(persistedCanonical\)/);
  assert.match(routeSource, /!persistedCanonical\.publish_eligibility/);
  assert.match(routeSource, /return NextResponse\.json\(\{ error: 'Marketing assets not found' \}, \{ status: 404 \}\);/);

  const blockedRowCheckIndex = routeSource.indexOf('!persistedCanonical.publish_eligibility');
  const fallbackLookupIndex = routeSource.indexOf('const unit = findInventoryUnitBySlug(slug);');
  assert.ok(blockedRowCheckIndex >= 0, 'expected a persisted blocked-row guard');
  assert.ok(fallbackLookupIndex >= 0, 'expected fallback slug regeneration lookup');
  assert.ok(
    blockedRowCheckIndex < fallbackLookupIndex,
    'persisted blocked rows should short-circuit before JSON fallback regeneration'
  );
});

test('marketing assets alias route exposes the same canonical marketing payload by slug', async () => {
  const { GET } = await import('../src/app/api/marketing/assets/[slug]/route.ts');

  const response = await GET(
    new Request('http://localhost/api/marketing/assets/rt-752r45tt-2018'),
    { params: Promise.resolve({ slug: 'rt-752r45tt-2018' }) }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('X-Marketing-Pipeline'), 'canonical-v1');

  const body = (await response.json()) as {
    unit_id: string;
    canonical_url: string;
    seo_title: string;
    channel_copy_variants: Array<{ channel: string; title: string; description: string }>;
  };

  assert.equal(body.unit_id, 'RT-752R45TT-2018');
  assert.match(body.canonical_url, /\/inventory\/rt-752r45tt-2018$/);
  assert.match(body.seo_title, /Raymond 752R45TT/i);
  assert.ok(body.channel_copy_variants.length >= 5);
});

test('marketing assets alias route source delegates to the inventory marketing-assets handler without extra exports', () => {
  const aliasRouteSource = readFileSync(
    new URL('../src/app/api/marketing/assets/[slug]/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(aliasRouteSource, /export const dynamic = 'force-dynamic'/);
  assert.match(aliasRouteSource, /export \{ GET \}/);
  assert.match(aliasRouteSource, /inventory\/\[slug\]\/marketing-assets\/route/);
});
