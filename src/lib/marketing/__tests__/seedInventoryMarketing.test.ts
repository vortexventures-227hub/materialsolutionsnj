import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  collectCanonicalMarketingRows,
  loadInventorySeedSource,
  seedInventoryMarketing,
} from '../seedInventoryMarketing';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVENTORY_PATH = path.resolve(__dirname, '../../../../data/forklift-inventory.json');

test('collectCanonicalMarketingRows normalizes all 14 current units', async () => {
  const source = await loadInventorySeedSource(INVENTORY_PATH);
  const rows = collectCanonicalMarketingRows(source);

  assert.equal(rows.length, 14);
  assert.ok(rows.some((row) => row.unit_id === 'RT-752R45TT-2018'));
  assert.ok(rows.some((row) => row.unit_id === 'MD-LOT-001-unit-1'));
});

test('seedInventoryMarketing dry-run reports all rows without mutating', async () => {
  const summary = await seedInventoryMarketing({
    inventoryPath: INVENTORY_PATH,
    dryRun: true,
  });

  assert.equal(summary.totalUnits, 14);
  assert.equal(summary.upsertedUnits.length, 14);
  assert.equal(summary.skippedUnits.length, 0);
});

test('seedInventoryMarketing skips unchanged rows on rerun and updates only edited row after JSON change', async () => {
  const firstPass = await seedInventoryMarketing({
    inventoryPath: INVENTORY_PATH,
    dryRun: false,
    listExisting: async () => ({}),
    upsert: async (content) => ({
      ...content,
      id: content.unit_id,
      created_at: '2026-04-21T00:00:00.000Z',
      updated_at: '2026-04-21T00:00:00.000Z',
    }),
  });

  const existing = Object.fromEntries(firstPass.canonicalRows.map((row) => [row.unit_id, row]));
  const secondPass = await seedInventoryMarketing({
    inventoryPath: INVENTORY_PATH,
    dryRun: false,
    listExisting: async () => existing,
    upsert: async (content) => ({
      ...content,
      id: content.unit_id,
      created_at: '2026-04-21T00:00:00.000Z',
      updated_at: '2026-04-21T00:10:00.000Z',
    }),
  });

  assert.equal(secondPass.upsertedUnits.length, 0);
  assert.equal(secondPass.skippedUnits.length, 14);

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'inventory-seed-edit-'));
  const editedInventoryPath = path.join(tempDir, 'forklift-inventory.json');
  const raw = JSON.parse(await readFile(INVENTORY_PATH, 'utf8'));
  const target = raw.inventory.standalone_units.find((unit: { unit_id: string }) => unit.unit_id === 'RT-752R45TT-2018');
  target.asking_price_usd = 30100;
  await writeFile(editedInventoryPath, JSON.stringify(raw, null, 2));

  const editedPass = await seedInventoryMarketing({
    inventoryPath: editedInventoryPath,
    dryRun: false,
    listExisting: async () => existing,
    upsert: async (content) => ({
      ...content,
      id: content.unit_id,
      created_at: '2026-04-21T00:00:00.000Z',
      updated_at: '2026-04-21T00:20:00.000Z',
    }),
  });

  assert.deepEqual(editedPass.upsertedUnits, ['RT-752R45TT-2018']);
  assert.equal(editedPass.skippedUnits.length, 13);
});
