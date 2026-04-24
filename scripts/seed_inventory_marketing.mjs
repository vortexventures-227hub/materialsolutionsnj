#!/usr/bin/env -S node --import tsx

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSupabaseAdmin } from '../src/lib/db/supabase.ts';
import { seedInventoryMarketing } from '../src/lib/marketing/seedInventoryMarketing.ts';
import { upsertCanonicalContent } from '../src/lib/marketing/canonical/persist.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INVENTORY_PATH = path.resolve(__dirname, '../data/forklift-inventory.json');
const DEFAULT_ENV_PATH = path.resolve(__dirname, '../.env.production.pull');
const INVENTORY_MARKETING_MIGRATION_PATH = path.resolve(__dirname, '../supabase/migrations/010_create_inventory_marketing.sql');
const REQUIRED_WRITE_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

function parseArgs(argv) {
  const args = {
    dryRun: false,
    preflight: false,
    inventoryPath: DEFAULT_INVENTORY_PATH,
    envPath: DEFAULT_ENV_PATH,
    unitId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--preflight') {
      args.preflight = true;
      continue;
    }
    if (token === '--inventory') {
      args.inventoryPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--env') {
      args.envPath = argv[index + 1];
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

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeEnvValue(value) {
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '').replace(/[\r\n]+$/g, '').trim();
}

async function readEnvFile(envPath) {
  if (!(await fileExists(envPath))) {
    return {};
  }

  const text = await readFile(envPath, 'utf8');
  const parsed = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    parsed[key] = normalizeEnvValue(line.slice(separatorIndex + 1));
  }
  return parsed;
}

async function loadWriteEnv(envPath) {
  const fileEnv = await readEnvFile(envPath);
  const resolved = {};
  for (const name of REQUIRED_WRITE_ENV) {
    const current = (process.env[name] ?? '').trim();
    resolved[name] = current || fileEnv[name] || '';
    if (!current && fileEnv[name]) {
      process.env[name] = fileEnv[name];
    }
  }
  return resolved;
}

function getMissingWriteEnv(resolvedEnv) {
  return REQUIRED_WRITE_ENV.filter((name) => !(resolvedEnv[name] ?? '').trim());
}

async function runPreflight(inventoryPath, envPath) {
  const resolvedEnv = await loadWriteEnv(envPath);
  const missingEnv = getMissingWriteEnv(resolvedEnv);
  const inventoryExists = await fileExists(inventoryPath);
  const migrationPresent = await fileExists(INVENTORY_MARKETING_MIGRATION_PATH);

  console.log(
    JSON.stringify(
      {
        mode: 'preflight',
        inventoryPath,
        inventoryExists,
        migrationPath: INVENTORY_MARKETING_MIGRATION_PATH,
        migrationPresent,
        envPath,
        envFileExists: await fileExists(envPath),
        missingEnv,
        readyForWrite: inventoryExists && migrationPresent && missingEnv.length === 0,
      },
      null,
      2,
    ),
  );
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

  if (args.preflight) {
    await runPreflight(args.inventoryPath, args.envPath);
    return;
  }

  await loadWriteEnv(args.envPath);

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
