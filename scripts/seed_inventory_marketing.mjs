#!/usr/bin/env -S node --import tsx

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSupabaseAdmin } from '../src/lib/db/supabase.ts';
import { seedInventoryMarketing } from '../src/lib/marketing/seedInventoryMarketing.ts';
import { upsertCanonicalContent } from '../src/lib/marketing/canonical/persist.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INVENTORY_PATH = path.resolve(__dirname, '../data/forklift-inventory.json');

function parseArgs(argv) {
  const args = { dryRun: false, inventoryPath: DEFAULT_INVENTORY_PATH, unitId: null };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--inventory') {
      args.inventoryPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--unit-id') {
      args.unitId = argv[index + 1];
      index += 1;
      continue;
    }
  }

  return args;
}

async function listExisting(unitIds) {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('inventory_marketing')
    .select('*')
    .in('unit_id', unitIds);

  if (error) {
    throw new Error(`inventory_marketing select failed: ${error.message}`);
  }

  return Object.fromEntries((data ?? []).map((row) => [row.unit_id, row]));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await seedInventoryMarketing({
    inventoryPath: args.inventoryPath,
    dryRun: args.dryRun,
    unitIdFilter: args.unitId,
    listExisting: args.dryRun ? undefined : listExisting,
    upsert: args.dryRun ? undefined : (content) => upsertCanonicalContent(content),
  });

  console.log(
    JSON.stringify(
      {
        inventoryPath: args.inventoryPath,
        dryRun: args.dryRun,
        unitId: args.unitId,
        totalUnits: summary.totalUnits,
        upsertedCount: summary.upsertedUnits.length,
        skippedCount: summary.skippedUnits.length,
        upsertedUnits: summary.upsertedUnits,
        skippedUnits: summary.skippedUnits,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
