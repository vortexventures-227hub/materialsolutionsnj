#!/usr/bin/env node
// Run with: npx tsx scripts/publish_button.mjs <unit_id> <platform>
// Example:  npx tsx scripts/publish_button.mjs RT-752R45TT-2018 facebook_marketplace
// Platforms: facebook_marketplace, craigslist, offer_up
//
// Without FACEBOOK_ACCESS_TOKEN + FACEBOOK_CATALOG_ID: runs in DRY_RUN mode
// and writes a ready-to-paste markdown file to ~/Desktop/Claude_Dispatch_Operations/listings/_queue/

import process from 'node:process';
import { runPublishPipeline } from '../src/lib/marketing/publishPipeline.ts';

const [unitId, platform] = process.argv.slice(2);

if (!unitId || !platform) {
  console.error('Usage: npx tsx scripts/publish_button.mjs <unit_id> <platform>');
  console.error('');
  console.error('Examples:');
  console.error('  npx tsx scripts/publish_button.mjs RT-752R45TT-2018 facebook_marketplace');
  console.error('  npx tsx scripts/publish_button.mjs RT-752R45TT-2018 craigslist');
  console.error('  npx tsx scripts/publish_button.mjs MD-LOT-001 facebook_marketplace');
  console.error('');
  console.error('Supported platforms: facebook_marketplace, craigslist, offer_up');
  console.error('');
  console.error('Env vars (optional — omit to run in DRY_RUN mode):');
  console.error('  FACEBOOK_ACCESS_TOKEN   FB Graph API token with catalog_management scope');
  console.error('  FACEBOOK_CATALOG_ID     FB Commerce Manager catalog ID');
  console.error('  SENDGRID_API_KEY        SendGrid API key for notification emails');
  process.exit(1);
}

console.log(`\nPublish Button — ${unitId} → ${platform}\n`);

let result;
try {
  result = await runPublishPipeline(unitId, platform);
} catch (err) {
  console.error(`Pipeline error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const modeLabel = result.mode === 'api' ? '[API]' : '[DRY_RUN]';
console.log(`${modeLabel} Mode: ${result.mode}`);
console.log(`Receipt ID: ${result.receiptId}`);

if (result.listingUrl) {
  console.log(`Listing URL: ${result.listingUrl}`);
}

if (result.queueFilePath) {
  console.log(`Queue file written: ${result.queueFilePath}`);
}

if (result.warnings.length > 0) {
  console.log(`\nWarnings (${result.warnings.length}):`);
  for (const w of result.warnings) {
    console.log(`  ! ${w}`);
  }
}

console.log('\nNotifications:');
for (const n of result.notifications) {
  const icon = n.status === 'sent' ? '[OK]' : n.status === 'skipped' ? '[--]' : '[ERR]';
  const detail = n.error ? ` — ${n.error}` : '';
  console.log(`  ${icon} ${n.to}: ${n.status}${detail}`);
}

console.log('\nChannel Copy:');
console.log(`  Title:  ${result.channelCopy.title}`);
console.log(`  Price:  ${result.channelCopy.price != null ? `$${result.channelCopy.price.toLocaleString()}` : 'Call for price'}`);
const descPreview = result.channelCopy.description.slice(0, 140).replace(/\n/g, ' ');
console.log(`  Desc:   ${descPreview}${result.channelCopy.description.length > 140 ? '…' : ''}`);
console.log(`  Images: ${result.channelCopy.image_urls.length} (primary: ${result.channelCopy.primary_image_url})`);

console.log('\nDone.\n');
