#!/usr/bin/env node
// Run with: npx tsx scripts/publish_button.mjs <unit_id> <platform>
// Example:  npx tsx scripts/publish_button.mjs RT-752R45TT-2018 facebook_marketplace
//
// API-capable platforms publish when required credentials are present.
// Otherwise they write ready-to-paste markdown to ~/Desktop/Claude_Dispatch_Operations/listings/_queue/.

import process from 'node:process';
import { runPublishPipeline } from '../src/lib/marketing/publishPipeline.ts';
import { getPasteQueueUnitById } from '../src/lib/marketing/pasteQueueData.ts';
import { formatPlatformPayload } from '../src/lib/marketing/formatters/index.ts';
import { publish as publishLinkedIn } from '../src/lib/marketing/formatters/linkedin.ts';
import { publish as publishMachineryTrader } from '../src/lib/marketing/formatters/machinery_trader.ts';
import { publish as publishIronPlanet } from '../src/lib/marketing/formatters/iron_planet.ts';

export const SUPPORTED_PLATFORMS = [
  'website',
  'facebook_marketplace',
  'craigslist',
  'offer_up',
  'ebay',
  'linkedin',
  'machinery_trader',
  'iron_planet',
];

const PIPELINE_PLATFORMS = new Set(['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay']);
const DIRECT_FORMATTER_PUBLISHERS = {
  linkedin: publishLinkedIn,
  machinery_trader: publishMachineryTrader,
  iron_planet: publishIronPlanet,
};

const [unitId, platform] = process.argv.slice(2);

if (!unitId || !platform) {
  console.error('Usage: npx tsx scripts/publish_button.mjs <unit_id> <platform>');
  console.error('');
  console.error('Examples:');
  console.error('  npx tsx scripts/publish_button.mjs RT-752R45TT-2018 facebook_marketplace');
  console.error('  npx tsx scripts/publish_button.mjs RT-752R45TT-2018 linkedin');
  console.error('  npx tsx scripts/publish_button.mjs RT-752R45TT-2018 machinery_trader');
  console.error('  npx tsx scripts/publish_button.mjs MD-LOT-001 iron_planet');
  console.error('');
  console.error(`Supported platforms: ${SUPPORTED_PLATFORMS.join(', ')}`);
  console.error('');
  console.error('Env vars (optional — omit to run paste-queue/DRY_RUN mode):');
  console.error('  FACEBOOK_ACCESS_TOKEN + FACEBOOK_CATALOG_ID');
  console.error('  LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORGANIZATION_URN [CONFIRM_WITH_CHRIS]');
  console.error('  MACHINERYTRADER_API_KEY + MACHINERYTRADER_DEALER_ID + MACHINERYTRADER_API_URL [CONFIRM_WITH_CHRIS]');
  console.error('  IRONPLANET_API_KEY + IRONPLANET_SELLER_ID + IRONPLANET_API_URL [CONFIRM_WITH_CHRIS]');
  console.error('  SENDGRID_API_KEY');
  process.exit(1);
}

if (!SUPPORTED_PLATFORMS.includes(platform)) {
  console.error(`Platform '${platform}' not supported. Supported: ${SUPPORTED_PLATFORMS.join(', ')}`);
  process.exit(1);
}

function toFormatterPayload(unit) {
  const imageUrls = unit.media_paths ?? [];
  const canonicalSlug = unit.canonical_slug ?? unit.unit_id.toLowerCase();
  return {
    unit_id: unit.unit_id,
    canonical_slug: canonicalSlug,
    year: unit.year ?? null,
    make: unit.make,
    model: unit.model,
    unit_type: unit.unit_type,
    condition: unit.condition ?? null,
    location: unit.location,
    price_usd: unit.asking_price_usd ?? null,
    sold_as_lot_only: Boolean(unit.sold_as_lot_only),
    key_specs: [
      unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lb capacity` : null,
      unit.hours_approx ? `${unit.hours_approx.toLocaleString()} hours` : null,
      unit.battery,
    ].filter(Boolean),
    feature_bullets: unit.features ?? [],
    description: [
      `${[unit.year, unit.make, unit.model, unit.unit_type].filter(Boolean).join(' ')} available from Material Solutions NJ.`,
      unit.condition ? `Condition: ${unit.condition}.` : '',
      unit.delivery_available ? 'Delivery available.' : 'Pickup/transport to be confirmed.',
    ].filter(Boolean).join(' '),
    faq_snippets: [
      `Availability: ${unit.status ?? 'unknown'}`,
      unit.delivery_available ? 'Delivery available.' : 'Pickup/transport to be confirmed.',
    ],
    primary_image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    canonical_url: `https://www.materialsolutionsnj.com/inventory/${canonicalSlug}`,
    platform_specific_fields: {
      source_kind: unit.source_kind,
      hold_reason: unit.hold_reason ?? null,
      serial: unit.serial ?? null,
    },
  };
}

async function runDirectFormatterPublish(unitId, platform) {
  const unit = getPasteQueueUnitById(unitId);
  if (!unit) {
    throw new Error(`Unit '${unitId}' not found in inventory`);
  }

  const payload = toFormatterPayload(unit);
  const channelCopy = formatPlatformPayload(platform, payload);
  const receipt = await DIRECT_FORMATTER_PUBLISHERS[platform](payload, { queueDir: process.env.PUBLISH_QUEUE_DIR });

  return {
    unitId,
    platform,
    mode: receipt.mode === 'api' ? 'api' : 'paste_queue',
    receipt,
    channelCopy,
    warnings: channelCopy.char_limit_warnings,
  };
}

console.log(`\nPublish Button — ${unitId} → ${platform}\n`);

let result;
try {
  result = PIPELINE_PLATFORMS.has(platform)
    ? await runPublishPipeline(unitId, platform)
    : await runDirectFormatterPublish(unitId, platform);
} catch (err) {
  console.error(`Publish error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const modeLabel = result.mode === 'api' ? '[API]' : result.mode === 'storage' ? '[STORAGE]' : result.mode === 'paste_queue' ? '[PASTE_QUEUE]' : '[DRY_RUN]';
console.log(`${modeLabel} Mode: ${result.mode}`);

if ('receiptId' in result) {
  console.log(`Receipt ID: ${result.receiptId}`);
}

if (result.listingUrl) {
  console.log(`Listing URL: ${result.listingUrl}`);
}

if (result.queueFilePath) {
  console.log(`Queue file written: ${result.queueFilePath}`);
}

if (result.receipt) {
  if (result.receipt.referenceId) console.log(`Reference ID: ${result.receipt.referenceId}`);
  if (result.receipt.url) console.log(`Listing URL: ${result.receipt.url}`);
  if (result.receipt.queueFilePath) console.log(`Queue file written: ${result.receipt.queueFilePath}`);
  if (result.receipt.missingCredentials.length > 0) {
    console.log(`Missing credentials: ${result.receipt.missingCredentials.join(', ')}`);
  }
  console.log(`Credential note: ${result.receipt.credentialNote}`);
}

if (result.warnings.length > 0) {
  console.log(`\nWarnings (${result.warnings.length}):`);
  for (const w of result.warnings) {
    console.log(`  ! ${w}`);
  }
}

if (result.notifications) {
  console.log('\nNotifications:');
  for (const n of result.notifications) {
    const icon = n.status === 'sent' ? '[OK]' : n.status === 'skipped' ? '[--]' : '[ERR]';
    const detail = n.error ? ` — ${n.error}` : '';
    console.log(`  ${icon} ${n.to}: ${n.status}${detail}`);
  }
}

console.log('\nChannel Copy:');
console.log(`  Title:  ${result.channelCopy.title}`);
console.log(`  Price:  ${result.channelCopy.price != null ? `$${result.channelCopy.price.toLocaleString()}` : 'Call for price'}`);
const descPreview = result.channelCopy.description.slice(0, 140).replace(/\n/g, ' ');
console.log(`  Desc:   ${descPreview}${result.channelCopy.description.length > 140 ? '…' : ''}`);
console.log(`  Images: ${result.channelCopy.image_urls.length} (primary: ${result.channelCopy.primary_image_url})`);

console.log('\nDone.\n');
