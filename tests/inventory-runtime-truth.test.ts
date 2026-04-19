import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('inventory page does not silently fall back to unlabeled sample listings', () => {
  const inventoryPageSource = readFileSync(
    new URL('../src/app/inventory/page.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(inventoryPageSource, /setListings\(sampleListings\)/);
  assert.match(
    inventoryPageSource,
    /do not silently substitute unlabeled sample listings on the live buyer path/
  );
  assert.match(
    inventoryPageSource,
    /Live inventory is temporarily unavailable\. Call \(973\) 500-1010 or ask David for help finding the right machine\./
  );
  assert.match(
    inventoryPageSource,
    /instead of relying on placeholder listings/
  );
  assert.match(inventoryPageSource, /source: 'inventory_contact'/);
  assert.match(inventoryPageSource, /'inventory_results_contact'/);
  assert.match(inventoryPageSource, /'inventory_empty_contact'/);
  assert.match(inventoryPageSource, /href=\{inventoryHelpHref\}/);
  assert.doesNotMatch(inventoryPageSource, /onClick=\{openChat\}/);
});

test('inventory page hero copy avoids AI-verified claims when live inventory truth is unavailable', () => {
  const inventoryPageSource = readFileSync(
    new URL('../src/app/inventory/page.tsx', import.meta.url),
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
    new URL('../src/app/inventory/[slug]/page.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(inventoryDetailSource, /setListing\(sampleListing\)/);
  assert.doesNotMatch(inventoryDetailSource, /AI-Verified Pricing/);
  assert.match(inventoryDetailSource, /Live listing details are temporarily unavailable/);
  assert.match(inventoryDetailSource, /Pricing shown from (the )?current listing data/);
  assert.match(inventoryDetailSource, /source: 'inventory_detail_contact'/);
  assert.match(inventoryDetailSource, /ctaOrigin: 'inventory_detail_ask_david'/);
  assert.match(inventoryDetailSource, /ctaOrigin: 'inventory_detail_unavailable_contact'/);
  assert.match(inventoryDetailSource, /href=\{inventoryContactHref\}/);
  assert.doesNotMatch(inventoryDetailSource, /onClick=\{handleAskDavid\}/);
});

test('inventory route handler wires inventory failure alerting — artifact + Telegram notification', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/inventory/route.ts', import.meta.url),
    'utf8'
  );

  // Failure utilities are imported
  assert.match(routeSource, /from '@\/lib\/inventory\/errors'/);
  assert.match(routeSource, /from '@\/lib\/notifications\/telegram'/);

  // makeInventoryFailureId is called in both error branches
  assert.match(routeSource, /makeInventoryFailureId\(\)/);

  // writeInventoryFailureArtifact is called in both error branches
  assert.match(routeSource, /writeInventoryFailureArtifact\(\{/);

  // sendInventoryFailureNotification is called in both error branches
  assert.match(routeSource, /sendInventoryFailureNotification\(\{/);

  // Both error branches produce a durable artifact with recoverable failure_id
  assert.match(routeSource, /failureId,\s*\n\s*route: '\/api\/inventory'/);
  assert.match(routeSource, /operatorAlerted: await sendInventoryFailureNotification/);

  // Supabase error branch sets kind: 'supabase_error'
  assert.match(routeSource, /kind:\s*'supabase_error'/);

  // Unexpected error branch sets kind: 'unexpected_error'
  assert.match(routeSource, /kind:\s*'unexpected_error'/);

  // operatorAlerted is wired to the Telegram call result (boolean)
  assert.match(routeSource, /operatorAlerted:\s*await sendInventoryFailureNotification/);
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
    new URL('../src/components/inventory/ImageGallery.tsx', import.meta.url),
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
