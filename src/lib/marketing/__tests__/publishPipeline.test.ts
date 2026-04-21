import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runPublishPipeline } from '../publishPipeline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVENTORY_PATH = path.resolve(__dirname, '../../../../data/forklift-inventory.json');

test('dry-run: RT-752R45TT-2018 → facebook_marketplace generates ChannelCopy and fires notification', async () => {
  const result = await runPublishPipeline('RT-752R45TT-2018', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
    dryRunOverride: true,
  });

  assert.strictEqual(result.mode, 'dry_run');
  assert.strictEqual(result.unitId, 'RT-752R45TT-2018');
  assert.strictEqual(result.platform, 'facebook_marketplace');

  // ChannelCopy: title contains make and year
  assert.ok(result.channelCopy.title.length > 0, 'title is non-empty');
  assert.ok(result.channelCopy.title.includes('Raymond'), `title includes make, got: ${result.channelCopy.title}`);
  assert.ok(result.channelCopy.title.includes('2018'), `title includes year, got: ${result.channelCopy.title}`);

  // ChannelCopy: description is present
  assert.ok(result.channelCopy.description.length > 0, 'description is non-empty');

  // ChannelCopy: price matches asking_price_usd in inventory
  assert.strictEqual(result.channelCopy.price, 29500, `price should be 29500, got ${result.channelCopy.price}`);

  // Queue file written in dry_run
  assert.ok(result.queueFilePath, 'queueFilePath is set in dry_run mode');
  assert.ok(result.queueFilePath!.includes('RT-752R45TT-2018'), 'queue file name contains unit id');
  assert.ok(result.queueFilePath!.includes('facebook_marketplace'), 'queue file name contains platform');

  // Receipt ID is 12-char hex
  assert.match(result.receiptId, /^[0-9a-f]{12}$/, `receipt ID format wrong: ${result.receiptId}`);

  // Notifications: two records (Chris + Bill), each sent or skipped (never error)
  assert.strictEqual(result.notifications.length, 2, 'two notification records');
  assert.ok(
    result.notifications.some((n) => n.to === 'crazzuoli@MaterialSolutions.com'),
    'Chris notification record present',
  );
  assert.ok(
    result.notifications.some((n) => n.to === 'bwhite@MaterialSolutions.com'),
    'Bill notification record present',
  );
  for (const n of result.notifications) {
    assert.ok(
      n.status === 'sent' || n.status === 'skipped',
      `notification to ${n.to} must be sent or skipped, got: ${n.status} (${n.error ?? ''})`,
    );
  }

  // No hard errors in warnings
  for (const w of result.warnings) {
    assert.ok(!w.includes('FETCH_FAILED'), `unexpected fetch error in warnings: ${w}`);
  }
});

test('dry-run: craigslist platform writes queue file with manual posting instructions', async () => {
  const result = await runPublishPipeline('RT-752R45TT-2018', 'craigslist', {
    inventoryPath: INVENTORY_PATH,
    dryRunOverride: true,
    skipNotifications: true,
  });

  assert.strictEqual(result.mode, 'dry_run');
  assert.strictEqual(result.platform, 'craigslist');
  assert.ok(result.queueFilePath, 'queueFilePath set for craigslist');
  assert.ok(result.channelCopy.posting_instructions, 'craigslist copy has posting instructions (manual tier)');
  assert.ok(result.channelCopy.title.length <= 70, `craigslist title within 70 chars, got ${result.channelCopy.title.length}`);
});

test('lot unit: MD-LOT-001 → facebook_marketplace resolves as lot and generates ChannelCopy', async () => {
  const result = await runPublishPipeline('MD-LOT-001', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
    dryRunOverride: true,
    skipNotifications: true,
  });

  assert.strictEqual(result.unitId, 'MD-LOT-001');
  assert.strictEqual(result.mode, 'dry_run');
  assert.ok(result.channelCopy.title.length > 0, 'lot title is non-empty');
  // Lot-only units have null price
  assert.strictEqual(result.channelCopy.price, null, 'lot price is null (sold_as_lot_only)');
});

test('unsupported platform throws', async () => {
  await assert.rejects(
    () => runPublishPipeline('RT-752R45TT-2018', 'tiktok'),
    /not supported/,
  );
});

test('unknown unit_id throws', async () => {
  await assert.rejects(
    () =>
      runPublishPipeline('INVALID-UNIT-DOES-NOT-EXIST', 'facebook_marketplace', {
        inventoryPath: INVENTORY_PATH,
      }),
    /not found in inventory/,
  );
});
