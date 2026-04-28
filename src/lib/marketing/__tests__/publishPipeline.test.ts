import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { previewPublishPipeline, runPublishPipeline } from '../publishPipeline';
import inventorySource from '../../../../data/forklift-inventory.json';
import { generateMarketingAssets } from '../canonical/generateMarketingAssets';
import { normalizeStandaloneUnit, type StandaloneForkliftJsonUnit } from '../schemaTransformers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVENTORY_PATH = path.resolve(__dirname, '../../../../data/forklift-inventory.json');
const reachTruck = normalizeStandaloneUnit(
  inventorySource.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-752R45TT-2018'
  ) as StandaloneForkliftJsonUnit
);

async function createPipelinePaths() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'publish-pipeline-test-'));
  return {
    manualQueueDir: path.join(root, 'queue'),
    receiptLogPath: path.join(root, 'publish_receipts.jsonl'),
  };
}

test('previewPublishPipeline returns channel copy without writing queue or receipt artifacts', async () => {
  const paths = await createPipelinePaths();
  const result = await previewPublishPipeline('RT-752R45TT-2018', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
    ...paths,
  });

  assert.equal(result.mode, 'preview');
  assert.equal(result.platform, 'facebook_marketplace');
  assert.equal(result.blockedByQa, false);
  assert.ok(result.channelCopy.title.includes('Raymond'));
  await assert.rejects(() => readFile(paths.receiptLogPath, 'utf8'));
});

test('dry-run: RT-752R45TT-2018 → facebook_marketplace generates ChannelCopy and fires notification', async () => {
  const paths = await createPipelinePaths();
  const result = await runPublishPipeline('RT-752R45TT-2018', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
    dryRunOverride: true,
    ...paths,
  });

  assert.strictEqual(result.mode, 'dry_run');
  assert.strictEqual(result.unitId, 'RT-752R45TT-2018');
  assert.strictEqual(result.platform, 'facebook_marketplace');
  assert.equal(result.qaSummary.overallStatus, 'pass');
  assert.equal(result.blockedByQa, false);

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
  const receiptLog = await readFile(paths.receiptLogPath, 'utf8');
  assert.match(receiptLog, /"qa_blocked":false/);

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

test('craigslist preview stays anchored to canonical long description before formatter extras', async () => {
  const canonical = generateMarketingAssets(reachTruck);
  const result = await previewPublishPipeline('RT-752R45TT-2018', 'craigslist', {
    inventoryPath: INVENTORY_PATH,
  });

  assert.equal(result.blockedByQa, false);
  assert.ok(
    result.channelCopy.description.startsWith(canonical.long_description),
    `craigslist description should start with canonical long description. got: ${result.channelCopy.description}`,
  );
});

test('dry-run: craigslist platform writes queue file with manual posting instructions', async () => {
  const paths = await createPipelinePaths();
  const result = await runPublishPipeline('RT-752R45TT-2018', 'craigslist', {
    inventoryPath: INVENTORY_PATH,
    dryRunOverride: true,
    skipNotifications: true,
    ...paths,
  });

  assert.strictEqual(result.mode, 'dry_run');
  assert.strictEqual(result.platform, 'craigslist');
  assert.ok(result.queueFilePath, 'queueFilePath set for craigslist');
  assert.ok(result.channelCopy.posting_instructions, 'craigslist copy has posting instructions (manual tier)');
  assert.ok(result.channelCopy.title.length <= 70, `craigslist title within 70 chars, got ${result.channelCopy.title.length}`);
});

test('lot unit: MD-LOT-001 → facebook_marketplace resolves as lot and preserves lot-only publish metadata', async () => {
  const paths = await createPipelinePaths();
  const result = await runPublishPipeline('MD-LOT-001', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
    dryRunOverride: true,
    skipNotifications: true,
    ...paths,
  });

  assert.strictEqual(result.unitId, 'MD-LOT-001');
  assert.strictEqual(result.mode, 'dry_run');
  assert.equal(result.qaSummary.overallStatus, 'downgrade');
  assert.equal(result.blockedByQa, false);
  assert.ok(result.queueFilePath, 'aggregate lot should produce a manual queue file');
  assert.ok(
    result.warnings.every((warning) => !warning.includes('lot-only-pricing-block')),
    'aggregate lot listing should not be blocked as individual-unit pricing',
  );
  assert.ok(result.channelCopy.title.length > 0, 'lot title is non-empty');
  // Lot-only units have null price
  assert.strictEqual(result.channelCopy.price, null, 'lot price is null (sold_as_lot_only)');
  assert.strictEqual(
    result.channelCopy.platform_specific_fields.sold_as_lot_only,
    true,
    'lot publish payload should preserve sold_as_lot_only metadata',
  );
});

test('previewPublishPipeline treats aggregate MD lot as eligible while preserving lot-only metadata', async () => {
  const result = await previewPublishPipeline('MD-LOT-001', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
  });

  assert.equal(result.unitId, 'MD-LOT-001');
  assert.equal(result.blockedByQa, false);
  assert.equal(result.eligible, true);
  assert.equal(result.lotOnlyFlag, true);
  assert.equal(result.channelCopy.price, null);
  assert.ok(
    result.warnings.every((warning) => !warning.includes('lot-only-pricing-block')),
    'aggregate lot preview should not fail the individual-unit pricing guard',
  );
});

test('previewPublishPipeline accepts current Bendi launch price within the articulated truck band', async () => {
  const result = await previewPublishPipeline('BENDI-B40-LANDOLL', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
  });

  assert.equal(result.unitId, 'BENDI-B40-LANDOLL');
  assert.equal(result.blockedByQa, false);
  assert.equal(result.eligible, true);
  assert.equal(result.channelCopy.price, 53500);
  assert.ok(
    result.warnings.every((warning) => !warning.includes('price_sanity')),
    'Bendi launch price should not trip stale counterbalance price bounds',
  );
});

test('website pipeline uses ChannelFormatter storage publish contract', async () => {
  const persisted = new Map<string, unknown>();
  const paths = await createPipelinePaths();
  const result = await runPublishPipeline('RT-752R45TT-2018', 'website', {
    inventoryPath: INVENTORY_PATH,
    skipNotifications: true,
    ...paths,
    formatterContext: {
      persistCanonical: async (content) => {
        persisted.set('canonical_slug', content.canonical_slug);
        return {
          ...content,
          id: 'inventory-marketing-row-1',
          created_at: '2026-04-21T18:40:00.000Z',
          updated_at: '2026-04-21T18:40:00.000Z',
        };
      },
    },
  });

  assert.strictEqual(result.mode, 'storage');
  assert.strictEqual(result.platform, 'website');
  assert.strictEqual(result.channelPublishReceipt?.channel, 'website');
  assert.strictEqual(result.channelPublishReceipt?.mode, 'storage');
  assert.strictEqual(result.channelPublishReceipt?.referenceId, 'inventory-marketing-row-1');
  assert.strictEqual(persisted.get('canonical_slug'), 'rt-752r45tt-2018');
  assert.strictEqual(result.channelCopy.platform_specific_fields.canonical_slug, 'rt-752r45tt-2018');
});

test('ebay pipeline uses ChannelFormatter http publish contract', async () => {
  const requests: Array<{ url: string; body: Record<string, unknown>; headers?: Record<string, string> }> = [];
  const paths = await createPipelinePaths();
  const result = await runPublishPipeline('RT-752R45TT-2018', 'ebay', {
    inventoryPath: INVENTORY_PATH,
    skipNotifications: true,
    ...paths,
    formatterContext: {
      postJson: async (url, body, headers) => {
        requests.push({ url, body, headers });
        return { sku: 'RT-752R45TT-2018' };
      },
    },
  });

  assert.strictEqual(result.mode, 'api');
  assert.strictEqual(result.platform, 'ebay');
  assert.strictEqual(result.channelPublishReceipt?.channel, 'ebay');
  assert.strictEqual(result.channelPublishReceipt?.mode, 'http');
  assert.strictEqual(result.channelPublishReceipt?.referenceId, 'RT-752R45TT-2018');
  assert.strictEqual(requests.length, 1);
  assert.match(requests[0]!.url, /api\.ebay\.com\/sell\/inventory/);
});

test('publish pipeline honors env-configured queue and receipt paths when options are omitted', async () => {
  const paths = await createPipelinePaths();
  process.env.PUBLISH_QUEUE_DIR = paths.manualQueueDir;
  process.env.PUBLISH_RECEIPTS_PATH = paths.receiptLogPath;

  try {
    const result = await runPublishPipeline('RT-752R45TT-2018', 'craigslist', {
      inventoryPath: INVENTORY_PATH,
      dryRunOverride: true,
      skipNotifications: true,
    });

    assert.ok(result.queueFilePath, 'queueFilePath set from env-configured default');
    assert.match(result.queueFilePath!, new RegExp(`^${paths.manualQueueDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    const receiptLog = await readFile(paths.receiptLogPath, 'utf8');
    assert.match(receiptLog, /"receiptId":"[0-9a-f]{12}"/);
  } finally {
    delete process.env.PUBLISH_QUEUE_DIR;
    delete process.env.PUBLISH_RECEIPTS_PATH;
  }
});

test('unsupported platform throws', async () => {
  await assert.rejects(
    () => runPublishPipeline('RT-752R45TT-2018', 'tiktok'),
    /not supported/,
  );
});

test('qa gate failures block queue creation and surface an error log', async () => {
  const paths = await createPipelinePaths();
  const result = await runPublishPipeline('SR-960CSR30TT-2018', 'facebook_marketplace', {
    inventoryPath: INVENTORY_PATH,
    dryRunOverride: true,
    skipNotifications: true,
    ...paths,
    qaContext: {
      existingCanonicalSlugs: new Set(['sr-960csr30tt-2018']),
      imageMetadataByUrl: {
        '~/Desktop/MS Forklift Inventory/SwingReach_2018_960CSR30TT.jpg': { width: 640, height: 640 },
      },
    },
  });

  assert.equal(result.qaSummary.overallStatus, 'fail');
  assert.equal(result.blockedByQa, true);
  assert.equal(result.queueFilePath, undefined);
  assert.ok(result.warnings.some((warning) => warning.includes('qa-block')));
  assert.ok(result.qaSummary.errorLog.some((entry) => entry.includes('canonical_collision')));
  assert.ok(result.qaSummary.errorLog.length > 0);
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
