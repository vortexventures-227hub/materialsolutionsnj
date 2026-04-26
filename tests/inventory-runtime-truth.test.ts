import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createInventoryGetHandler } from '@/app/api/inventory/handler';
import { findInventoryUnitBySlug, inventoryUnitToListing } from '@/lib/inventorySeo';
import { generateMarketingAssets } from '@/lib/marketing/canonical/generateMarketingAssets';

test('inventory page does not silently fall back to unlabeled sample listings', () => {
  const inventoryPageSource = readFileSync(
    new URL('../src/components/inventory/InventoryPageClient.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(inventoryPageSource, /setListings\(sampleListings\)/);
  assert.match(
    inventoryPageSource,
    /do not silently substitute unlabeled sample listings on the live buyer path/
  );
  assert.match(inventoryPageSource, /const phoneContact = CONTACT_DETAILS\.find/);
  assert.match(inventoryPageSource, /const phoneLabel = phoneContact\?\.primary/);
  // phone truth now sourced from CONTACT_DETAILS — stale (973) 500-1010 must not appear
  assert.doesNotMatch(inventoryPageSource, /\(973\) 500-1010/);
  // error message uses phoneLabel variable, not a hardcoded number
  assert.match(
    inventoryPageSource,
    /Live inventory is temporarily unavailable\.\s*\$\{phoneLabel\}/
  );
  assert.match(
    inventoryPageSource,
    /instead of relying on placeholder listings/
  );
  assert.match(inventoryPageSource, /source: 'inventory_contact'/);
  assert.match(inventoryPageSource, /'inventory_results_contact'/);
  assert.match(inventoryPageSource, /'inventory_empty_contact'/);
  assert.match(inventoryPageSource, /href=\{inventoryHelpHref\}/);
  // onClick={openChat} is now legitimately present on the empty-state "Ask David About Inventory" button
  assert.match(inventoryPageSource, /onClick=\{openChat\}/);
});

test('inventory page hero copy avoids AI-verified claims when live inventory truth is unavailable', () => {
  const inventoryPageSource = readFileSync(
    new URL('../src/components/inventory/InventoryPageClient.tsx', import.meta.url),
    'utf8'
  );

  assert.match(inventoryPageSource, /Live Equipment Inventory/);
  assert.match(inventoryPageSource, /Inventory Feed Status/);
  assert.doesNotMatch(inventoryPageSource, /AI-Verified Inventory/);
  assert.doesNotMatch(
    inventoryPageSource,
    /Every unit AI-analyzed\. Every listing verified\. Every price transparent\./
  );
});

test('inventory detail page does not silently fall back to sample listings or AI-verified pricing claims', () => {
  const inventoryDetailSource = readFileSync(
    new URL('../src/components/inventory/InventoryDetailClient.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(inventoryDetailSource, /setListing\(sampleListing\)/);
  assert.doesNotMatch(inventoryDetailSource, /AI-Verified Pricing/);
  assert.match(inventoryDetailSource, /Live listing details are temporarily unavailable/);
  assert.match(inventoryDetailSource, /Pricing shown from (the )?current listing data/);
  assert.match(inventoryDetailSource, /source: 'inventory_detail_contact'/);
  assert.match(inventoryDetailSource, /ctaOrigin: 'inventory_detail_ask_david'/);
  assert.match(inventoryDetailSource, /ctaOrigin: 'inventory_detail_unavailable_contact'/);
  // "Ask David" now uses onClick={handleAskDavidAboutListing} — honest storefront button, not a href
  assert.match(inventoryDetailSource, /handleAskDavidAboutListing/);
  assert.match(inventoryDetailSource, /onClick=\{handleAskDavidAboutListing\}/);
  assert.doesNotMatch(inventoryDetailSource, /onClick=\{handleAskDavid\}/);
});

test('inventory detail page body renders canonical buyer copy from Lane H assets, not metadata only', () => {
  const inventoryPageSource = readFileSync(
    new URL('../src/app/inventory/[slug]/page.tsx', import.meta.url),
    'utf8'
  );
  const inventoryDetailSource = readFileSync(
    new URL('../src/components/inventory/InventoryDetailClient.tsx', import.meta.url),
    'utf8'
  );

  assert.match(inventoryPageSource, /<InventoryDetailClient[\s\S]*canonical=\{canonical \?\? null\}/);
  assert.match(inventoryDetailSource, /canonical\?: CanonicalContent \| null;/);
  assert.match(inventoryDetailSource, /canonical\.long_description/);
  assert.match(inventoryDetailSource, /canonical\.structured_feature_list\.length > 0/);
  assert.match(inventoryDetailSource, /canonical\.faq\.length > 0/);
  assert.match(inventoryDetailSource, /Buyer-ready description/);
  assert.match(inventoryDetailSource, /Key machine highlights/);
  assert.match(inventoryDetailSource, /Questions buyers ask first/);
});

test('inventory detail call CTAs use shared contact details instead of hardcoded phone literals', () => {
  const inventoryDetailSource = readFileSync(
    new URL('../src/components/inventory/InventoryDetailClient.tsx', import.meta.url),
    'utf8'
  );

  assert.match(inventoryDetailSource, /import \{ PUBLIC_PHONE_HREF \} from '@\/lib\/contactDetails';/);
  assert.match(inventoryDetailSource, /const contactPhoneHref = PUBLIC_PHONE_HREF/);
  assert.doesNotMatch(inventoryDetailSource, /href="tel:9735001010"/);
  assert.doesNotMatch(inventoryDetailSource, /const contactPhoneHref = CONTACT_DETAILS\.find\(/);
  assert.doesNotMatch(inventoryDetailSource, /Call Now[\s\S]{0,250}mailto:info@materialsolutionsnj\.com/);
});

test('inventory JSON fallback listing stays aligned with canonical marketing assets', () => {
  const unit = findInventoryUnitBySlug('bendi-b40-landoll');
  assert.ok(unit, 'expected locked inventory fallback unit to exist');

  const canonical = generateMarketingAssets(unit);
  const listing = inventoryUnitToListing(unit, 'bendi-b40-landoll');
  const canonicalImageUrls = canonical.images
    .map((image) => image.public_url)
    .filter((url): url is string => Boolean(url));

  assert.equal(listing.title, canonical.title);
  assert.equal(listing.ai_description, canonical.long_description);
  assert.deepEqual(
    listing.ai_highlights,
    canonical.structured_feature_list.map((feature) => `${feature.label}: ${feature.value}`)
  );
  assert.equal(listing.listing_images?.length ?? 0, canonicalImageUrls.length);
  assert.deepEqual(
    listing.listing_images?.map((image) => image.url) ?? [],
    canonicalImageUrls
  );
  assert.ok(
    canonicalImageUrls.length > 0,
    'expected canonical marketing assets to expose public media URLs'
  );
  assert.ok(
    canonicalImageUrls.every((url) => url.includes('/inventory-media/')),
    'canonical marketing asset URLs must use the deployed /inventory-media/ path'
  );
  assert.ok(
    canonicalImageUrls.every((url) => !url.includes('/inventory-assets/')),
    'canonical marketing asset URLs must not point at the nonexistent /inventory-assets/ path'
  );
});

async function withInventoryArtifactRoot<T>(run: (artifactRoot: string) => Promise<T>) {
  const artifactRoot = await mkdtemp(path.join(tmpdir(), 'inventory-route-artifacts-'));
  const previousRoot = process.env.INVENTORY_ARTIFACT_ROOT;
  process.env.INVENTORY_ARTIFACT_ROOT = artifactRoot;

  try {
    return await run(artifactRoot);
  } finally {
    if (previousRoot === undefined) {
      delete process.env.INVENTORY_ARTIFACT_ROOT;
    } else {
      process.env.INVENTORY_ARTIFACT_ROOT = previousRoot;
    }
    await rm(artifactRoot, { recursive: true, force: true });
  }
}

test('inventory route enriches Supabase rows with public media URLs from source payloads', async () => {
  const rows = [
    {
      id: 'row-with-media',
      is_available: true,
      images: [],
      source_payload: {
        media_paths: [
          'Axe Media/Raymond 752R45TT 2018 ReachTruck still 01.jpeg',
          '/already-public.jpg',
          'https://cdn.example.com/unit.jpg',
          'not-an-image.txt',
        ],
      },
    },
    {
      id: 'row-with-existing-images',
      is_available: true,
      images: ['/preserve-existing.jpg'],
      source_payload: {
        media_paths: ['should-not-replace.jpg'],
      },
    },
  ];

  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    gte() {
      return this;
    },
    lte() {
      return this;
    },
    order() {
      return this;
    },
    then(onfulfilled: (value: { data: typeof rows; error: null }) => unknown) {
      return Promise.resolve(onfulfilled({ data: rows, error: null }));
    },
  };

  const handler = createInventoryGetHandler({
    getSupabase() {
      return {
        from(table: 'inventory') {
          assert.equal(table, 'inventory');
          return query;
        },
      };
    },
    makeInventoryFailureId() {
      return 'not-used';
    },
    async sendInventoryFailureNotification() {
      return false;
    },
    async writeInventoryFailureArtifact() {
      return '/tmp/not-used.json';
    },
  });

  const response = await handler(new Request('http://localhost/api/inventory'));
  assert.equal(response.status, 200);

  const body = (await response.json()) as { inventory: Array<{ id: string; images?: string[] }> };
  assert.deepEqual(body.inventory[0]?.images, [
    '/already-public.jpg',
    'https://cdn.example.com/unit.jpg',
  ]);
  assert.deepEqual(body.inventory[1]?.images, ['/preserve-existing.jpg']);
});

test('inventory route collapses lot-member rows into one buyer-facing lot card', async () => {
  const rows = [
    {
      id: 'lot-unit-1',
      external_key: 'md-lot-001-unit-1',
      title: 'Raymond Order Picker Unit 1',
      brand: 'Raymond',
      model: 'Order Picker',
      year: 2012,
      is_available: true,
      images: [],
      source_payload: {
        raw_lot: {
          lot_id: 'MD-LOT-001',
          title: 'Maryland Raymond Order Picker Lot',
          location: 'Maryland',
          condition: 'Used, operational',
          lot_asking_price_usd: 150000,
          hours_avg: 4200,
          mast_extended_inches: 300,
          guidance: 'wire',
          battery_and_charger_included: true,
          fob: 'Maryland',
        },
        raw_unit: {
          make: 'Raymond',
          model: 'Order Picker',
          year: 2012,
        },
        lot_photos: ['MS Forklift Inventory/Maryland OrderPicker Lot 1.jpg'],
      },
    },
    {
      id: 'lot-unit-2',
      external_key: 'md-lot-001-unit-2',
      title: 'Raymond Order Picker Unit 2',
      brand: 'Raymond',
      model: 'Order Picker',
      year: 2014,
      is_available: true,
      images: [],
      source_payload: {
        raw_lot: {
          lot_id: 'MD-LOT-001',
          title: 'Maryland Raymond Order Picker Lot',
          location: 'Maryland',
          lot_asking_price_usd: 150000,
        },
        raw_unit: {
          make: 'Raymond',
          model: 'Order Picker',
          year: 2014,
        },
      },
    },
    {
      id: 'standalone',
      external_key: 'rt-752r45tt-2018',
      slug: 'rt-752r45tt-2018',
      title: 'Standalone Reach Truck',
      brand: 'Raymond',
      model: '752R45TT',
      year: 2018,
      is_available: true,
      images: ['/standalone.jpg'],
      source_payload: {},
    },
  ];

  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    gte() {
      return this;
    },
    lte() {
      return this;
    },
    order() {
      return this;
    },
    then(onfulfilled: (value: { data: typeof rows; error: null }) => unknown) {
      return Promise.resolve(onfulfilled({ data: rows, error: null }));
    },
  };

  const handler = createInventoryGetHandler({
    getSupabase() {
      return {
        from(table: 'inventory') {
          assert.equal(table, 'inventory');
          return query;
        },
      };
    },
    makeInventoryFailureId() {
      return 'not-used';
    },
    async sendInventoryFailureNotification() {
      return false;
    },
    async writeInventoryFailureArtifact() {
      return '/tmp/not-used.json';
    },
  });

  const response = await handler(new Request('http://localhost/api/inventory'));
  assert.equal(response.status, 200);

  const body = (await response.json()) as {
    inventory: Array<{
      slug: string;
      title: string;
      model: string;
      source_type?: string;
      source_payload?: { unit_count?: number; lot_only?: boolean };
      images?: string[];
    }>;
  };

  assert.equal(body.inventory.length, 2);
  const lot = body.inventory.find((row) => row.slug === 'md-lot-001');
  assert.ok(lot, 'expected lot row to collapse to the lot id slug');
  assert.equal(lot.title, 'Maryland Raymond Order Picker Lot');
  assert.equal(lot.model, 'Lot of 2 Order Picker');
  assert.equal(lot.source_type, 'lot');
  assert.equal(lot.source_payload?.unit_count, 2);
  assert.equal(lot.source_payload?.lot_only, true);
  assert.deepEqual(lot.images, ['/inventory-media/Maryland%20OrderPicker%20Lot%201.jpg']);
  assert.ok(body.inventory.find((row) => row.slug === 'rt-752r45tt-2018'));
});

test('createInventoryGetHandler returns HTTP 500 + durable artifact on unexpected handler failure', async () => {
  await withInventoryArtifactRoot(async (artifactRoot) => {
    const sentAlerts: Array<Record<string, unknown>> = [];
    const handler = createInventoryGetHandler({
      getSupabase() {
        throw new Error('supabase bootstrap exploded');
      },
      makeInventoryFailureId() {
        return 'inv-test-unexpected';
      },
      async sendInventoryFailureNotification(input) {
        sentAlerts.push(input as Record<string, unknown>);
        return false;
      },
      async writeInventoryFailureArtifact(input) {
        const filePath = path.join(artifactRoot, `${input.failureId}.json`);
        await writeFile(
          filePath,
          `${JSON.stringify(
            {
              failure_id: input.failureId,
              route: input.route,
              kind: input.kind,
              operator_alerted: input.operatorAlerted,
              reason: input.reason,
              details: input.details ?? null,
            },
            null,
            2
          )}\n`,
          'utf8'
        );
        return filePath;
      },
    });

    const response = await handler(new Request('http://localhost/api/inventory?featured=true'));

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Failed to fetch inventory' });
    assert.equal(sentAlerts.length, 1);
    assert.equal(sentAlerts[0]?.kind, 'unexpected_error');
    assert.match(String(sentAlerts[0]?.reason ?? ''), /Supabase client initialization failed/);
    assert.match(
      JSON.stringify((sentAlerts[0] as Record<string, unknown>)?.details),
      /supabase bootstrap exploded/
    );

    const artifact = JSON.parse(
      await readFile(path.join(artifactRoot, 'inv-test-unexpected.json'), 'utf8')
    ) as {
      route: string;
      kind: string;
      operator_alerted: boolean;
      reason: string;
      details: unknown;
    };

    assert.equal(artifact.route, '/api/inventory');
    assert.equal(artifact.kind, 'unexpected_error');
    assert.equal(artifact.operator_alerted, false);
    assert.match(artifact.reason, /Supabase client initialization failed/);
    assert.match(JSON.stringify(artifact.details), /supabase bootstrap exploded/);
  });
});

test('inventory route delegates to the extracted testable handler and preserves failure wiring', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/inventory/route.ts', import.meta.url),
    'utf8'
  );
  const handlerSource = readFileSync(
    new URL('../src/app/api/inventory/handler.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /import \{ createInventoryGetHandler \} from '\.\/handler';/);
  assert.match(routeSource, /export const GET = createInventoryGetHandler\(\);/);

  assert.match(handlerSource, /from '@\/lib\/inventory\/errors'/);
  assert.match(handlerSource, /from '@\/lib\/notifications\/telegram'/);
  assert.match(handlerSource, /makeInventoryFailureId\(\)/);
  assert.match(handlerSource, /writeInventoryFailureArtifact\(\{/);
  assert.match(handlerSource, /sendInventoryFailureNotification\(\{/);
  assert.match(handlerSource, /kind:\s*'supabase_error'/);
  assert.match(handlerSource, /kind:\s*'unexpected_error'/);
  assert.match(handlerSource, /return NextResponse\.json\(\{ error: 'Failed to fetch inventory' \}, \{ status: 500 \}\)/);
  assert.doesNotMatch(handlerSource, /catch \(error\)[\s\S]*return NextResponse\.json\(\{ inventory: \[\] \}\)/);
});

test('inventory detail route handler reads from current inventory table instead of stale listings joins', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/inventory/[slug]/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /from\('inventory'\)/);
  assert.doesNotMatch(routeSource, /from\('listings'\)/);
  assert.doesNotMatch(routeSource, /listing_images\(\*\)/);
  assert.doesNotMatch(routeSource, /listing_specs\(\*\)/);
});

test('inventory detail route can fall back to locked inventory JSON slug resolution when the live table slug misses', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/inventory/[slug]/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /findInventoryUnitBySlug/);
  assert.match(routeSource, /inventoryUnitToListing/);
  assert.match(routeSource, /const inventoryUnit = findInventoryUnitBySlug\(slug\)/);
  assert.match(routeSource, /const listing = inventoryUnitToListing\(inventoryUnit,\s*slug\)/);
  assert.match(routeSource, /media_paths:\s*inventoryUnit\.media_paths/);
  assert.match(routeSource, /video_paths:\s*inventoryUnit\.media_paths\.filter/);
});

test('inventory detail API fallback exposes approved reach-truck video without generated stills', async () => {
  const { GET } = await import('../src/app/api/inventory/[slug]/route');
  const response = await GET(new Request('http://localhost/api/inventory/rt-752r45tt-2018') as any, {
    params: Promise.resolve({ slug: 'rt-752r45tt-2018' }),
  });
  assert.equal(response.status, 200);

  const body = await response.json() as { listing: { listing_images?: Array<{ url: string }> } };
  const urls = body.listing.listing_images?.map((image) => image.url) ?? [];

  assert.ok(
    urls.includes('/inventory-media/Raymond_752R45TT_2018_ReachTruck.mp4'),
    'expected real approved reach-truck mp4 in detail listing media'
  );
  assert.equal(
    urls.some((url) => /Raymond_752R45TT_2018_ReachTruck_photo_\d+\.jpe?g/i.test(url)),
    false,
    'must not fabricate generated reach-truck still photos'
  );
});

test('inventory detail route handler wires inventory failure alerting — artifact + Telegram notification', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/inventory/[slug]/route.ts', import.meta.url),
    'utf8'
  );

  // Failure utilities are imported
  assert.match(routeSource, /from '@\/lib\/inventory\/errors'/);
  assert.match(routeSource, /from '@\/lib\/notifications\/telegram'/);

  // makeInventoryFailureId is called in the catch block
  assert.match(routeSource, /makeInventoryFailureId\(\)/);

  // writeInventoryFailureArtifact is called with all required fields
  assert.match(routeSource, /writeInventoryFailureArtifact\(\{/);
  assert.match(routeSource, /failureId,\s*\n\s*route: routePath/);
  assert.match(routeSource, /operatorAlerted:\s*await sendInventoryFailureNotification/);

  // sendInventoryFailureNotification is called with slug in details
  assert.match(routeSource, /sendInventoryFailureNotification\(\{/);
  assert.match(routeSource, /slug/);

  // Kind is 'unexpected_error' for the detail route catch block
  assert.match(routeSource, /kind:\s*'unexpected_error'/);
});

test('inventory failure utilities produce well-formed artifact records', () => {
  const errorsSource = readFileSync(
    new URL('../src/lib/inventory/errors.ts', import.meta.url),
    'utf8'
  );

  // InventoryFailureRecord interface has all required fields per CONTRACTS.md
  assert.match(errorsSource, /failure_id:\s*string/);
  assert.match(errorsSource, /route:\s*string/);
  assert.match(errorsSource, /kind:\s*'supabase_error'\s*\|\s*'parse_error'\s*\|\s*'unexpected_error'/);
  assert.match(errorsSource, /operator_alerted:\s*boolean/);
  assert.match(errorsSource, /reason:\s*string/);
  assert.match(errorsSource, /details:\s*unknown/);
  assert.match(errorsSource, /created_at:\s*string/);

  // makeInventoryFailureId generates recoverable ID with required prefix
  assert.match(errorsSource, /export function makeInventoryFailureId/);
  assert.match(errorsSource, /inv-\$\{ts\}-\$\{urand\}/);

  // writeInventoryFailureArtifact writes to runtime_artifacts/inventory_failures/
  assert.match(errorsSource, /inventory_failures/);
  assert.match(errorsSource, /export async function writeInventoryFailureArtifact/);
  assert.match(errorsSource, /await mkdir\(dir,\s*\{\s*recursive:\s*true\s*\}\)/);
  assert.match(errorsSource, /await writeFile\(filePath,\s*`\$\{JSON\.stringify\(record/);
});

test('inventory failure notification produces Telegram-ready message', () => {
  const telegramSource = readFileSync(
    new URL('../src/lib/notifications/telegram.ts', import.meta.url),
    'utf8'
  );

  // sendInventoryFailureNotification signature matches alert shape
  assert.match(telegramSource, /export async function sendInventoryFailureNotification/);
  assert.match(telegramSource, /InventoryFailureAlert/);

  // Uses same cleanEnv guard as lead capture (credential surface reuse)
  assert.match(telegramSource, /cleanEnv\(process\.env\.TELEGRAM_BOT_TOKEN\)/);
  assert.match(telegramSource, /cleanEnv\(process\.env\.TELEGRAM_CHAT_ID\)/);

  // Returns boolean (operator_alerted: boolean in artifact record)
  assert.match(telegramSource, /Promise<boolean>/);

  // Formats message with failure_id, route, kind, reason — no hallucinated fields
  assert.match(telegramSource, /Failure ID: \$\{alert\.failureId\}/);
  assert.match(telegramSource, /Route: \$\{alert\.route\}/);
  assert.match(telegramSource, /Kind: \$\{alert\.kind\}/);
  assert.match(telegramSource, /Reason: \$\{alert\.reason\}/);
});

test('inventory marketing surfaces avoid unsupported AI-verification claims', () => {
  const inventoryCardSource = readFileSync(
    new URL('../src/components/inventory/InventoryCard.tsx', import.meta.url),
    'utf8'
  );
  const imageGallerySource = readFileSync(
    new URL('../src/components/InventoryGallery.tsx', import.meta.url),
    'utf8'
  );
  const analysisSource = readFileSync(
    new URL('../src/components/inventory/AIAnalysis.tsx', import.meta.url),
    'utf8'
  );
  const featuredInventorySource = readFileSync(
    new URL('../src/components/home/FeaturedInventory.tsx', import.meta.url),
    'utf8'
  );
  const ctaBannerSource = readFileSync(
    new URL('../src/components/home/CTABanner.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(inventoryCardSource, /AI-Verified/);
  assert.doesNotMatch(imageGallerySource, /AI-Verified/);
  assert.doesNotMatch(analysisSource, /AI Equipment Analysis/);
  assert.doesNotMatch(analysisSource, /Powered by computer vision & machine learning/);
  assert.doesNotMatch(analysisSource, /AI-Verified/);
  assert.doesNotMatch(analysisSource, /Analyzed\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4}/);
  assert.doesNotMatch(featuredInventorySource, /AI-Verified/);
  assert.doesNotMatch(ctaBannerSource, /AI-verified inventory/i);
  assert.doesNotMatch(ctaBannerSource, /24\/7 support/i);
  assert.doesNotMatch(ctaBannerSource, /available 24\/7/i);
  assert.match(analysisSource, /Equipment analysis notes/);
  assert.match(analysisSource, /Listing notes generated from the current listing data/);
  assert.match(analysisSource, /Listing updated/);
  assert.match(featuredInventorySource, /Live Listing/);
  assert.match(ctaBannerSource, /Browse our current inventory/);
  assert.match(ctaBannerSource, /a direct path to David chat or the team/i);
});
