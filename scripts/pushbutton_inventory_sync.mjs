#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const inventoryPath = path.join(repoRoot, 'data', 'forklift-inventory.json');
const REQUIRED_WRITE_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

function parseArgs(argv) {
  const parsed = {
    dryRun: false,
    preflight: false,
    envPath: path.join(repoRoot, '.env.production.pull'),
  };

  for (const token of argv) {
    if (token === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (token === '--preflight') {
      parsed.preflight = true;
      continue;
    }
    if (!token.startsWith('--')) {
      parsed.envPath = token;
    }
  }

  return parsed;
}

const cli = parseArgs(process.argv.slice(2));

function readEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Strip trailing \n (backslash + literal 'n') from env-pull injection.
    // Mirrors the pattern already applied to production supabase.ts normalizeEnvValue.
    let cleaned = value.replace(/\\n/g, '').trim();
    while (cleaned.endsWith('\\n')) {
      cleaned = cleaned.slice(0, -2).trimEnd();
    }
    if (cleaned.endsWith('\\n')) {
      cleaned = cleaned.slice(0, -2).trimEnd();
    }
    out[key] = cleaned;
  }
  return out;
}

function envFileExists(filePath) {
  return fs.existsSync(filePath);
}

function getMissingEnv(env) {
  return REQUIRED_WRITE_ENV.filter((key) => !(env[key] || '').trim());
}

function runPreflight(envPath) {
  const inventoryExists = fs.existsSync(inventoryPath);
  const exists = envFileExists(envPath);
  const env = exists ? readEnv(envPath) : {};
  const missingEnv = getMissingEnv(env);

  console.log(
    JSON.stringify(
      {
        mode: 'preflight',
        envPath,
        envFileExists: exists,
        inventoryPath,
        inventoryExists,
        missingEnv,
        readyForWrite: exists && inventoryExists && missingEnv.length === 0,
      },
      null,
      2,
    ),
  );
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function normalizeType(unitType = '') {
  const value = unitType.toLowerCase();
  if (value.includes('order picker')) return 'order-picker';
  if (value.includes('reach')) return 'reach-truck';
  if (value.includes('swing')) return 'turret-truck';
  if (value.includes('bendi') || value.includes('articulated')) return 'sit-down';
  return 'sit-down';
}

function normalizeFuel(unitType = '', battery = '') {
  const text = `${unitType} ${battery}`.toLowerCase();
  if (text.includes('propane')) return 'propane';
  if (text.includes('diesel')) return 'diesel';
  return 'electric';
}

function normalizeCondition(value = '') {
  const text = value.toLowerCase();
  if (text.includes('excellent') || text.includes('retail ready')) return 'excellent';
  if (text.includes('fair')) return 'fair';
  return 'good';
}

function flattenInventory(doc) {
  const inventory = doc.inventory;
  const rows = [];

  for (const lot of inventory.lots || []) {
    for (const unit of lot.units || []) {
      const year = unit.year ?? unit.year_approx ?? null;
      const externalKey = unit.serial || `${lot.lot_id}-unit-${unit.unit_index}`;
      const title = `${year ?? 'Used'} ${unit.make} ${unit.model}`;
      rows.push({
        external_key: externalKey,
        slug: slugify(`${year ?? 'used'}-${unit.make}-${unit.model}-${externalKey}`),
        title,
        brand: unit.make,
        model: unit.model,
        year,
        type: normalizeType(lot.unit_type),
        fuel_type: normalizeFuel(lot.unit_type),
        capacity_lbs: null,
        lift_height_inches: lot.mast_extended_inches ?? null,
        hours: lot.hours_avg ?? null,
        price: lot.per_unit_price_usd ?? null,
        condition: normalizeCondition(lot.condition),
        description: [
          `${lot.title}.`,
          lot.location ? `Location: ${lot.location}.` : null,
          lot.guidance ? `Guidance: ${lot.guidance}.` : null,
          lot.notes || null,
        ].filter(Boolean).join(' '),
        features: [
          lot.guidance ? `${lot.guidance} guidance` : null,
          lot.battery_and_charger_included ? 'Battery and charger included' : null,
          lot.fob ? `FOB ${lot.fob}` : null,
        ].filter(Boolean),
        images: (lot.lot_photos || []).filter((p) => !p.startsWith('~/')),
        warranty_info: lot.warranty ? JSON.stringify(lot.warranty) : null,
        is_featured: false,
        is_available: lot.status === 'available',
        status: lot.status || 'available',
        hold_reason: lot.hold_reason || null,
        source_type: 'lot_unit',
        source_payload: {
          lot_id: lot.lot_id,
          unit_index: unit.unit_index,
          raw_unit: unit,
          raw_lot: lot,
        },
      });
    }
  }

  for (const unit of inventory.standalone_units || []) {
    const externalKey = unit.unit_id || unit.serial || `${unit.make}-${unit.model}-${unit.year}`;
    rows.push({
      external_key: externalKey,
      slug: slugify(`${unit.year ?? 'used'}-${unit.make}-${unit.model}-${externalKey}`),
      title: `${unit.year ?? 'Used'} ${unit.make} ${unit.model}`,
      brand: unit.make,
      model: unit.model,
      year: unit.year ?? null,
      type: normalizeType(unit.unit_type),
      fuel_type: normalizeFuel(unit.unit_type, unit.battery),
      capacity_lbs: unit.capacity_lbs ?? null,
      lift_height_inches: unit.mast_extended_inches ?? unit.lift_height_inches ?? null,
      hours: unit.hours ?? null,
      price: unit.asking_price_usd ?? null,
      condition: normalizeCondition(unit.condition),
      description: [
        unit.unit_type ? `${unit.unit_type}.` : null,
        unit.location ? `Location: ${unit.location}.` : null,
        unit.hold_reason ? `Hold: ${unit.hold_reason}.` : null,
      ].filter(Boolean).join(' '),
      features: [
        unit.guidance ? `${unit.guidance} guidance` : null,
        unit.delivery_available ? 'Delivery available' : null,
        unit.battery || null,
        unit.model_variant || null,
      ].filter(Boolean),
      images: (unit.media_paths || (unit.media_path ? [unit.media_path] : [])).filter((p) => !p.startsWith('~/')),
      warranty_info: null,
      is_featured: false,
      is_available: unit.status === 'available',
      status: unit.status || 'hold',
      hold_reason: unit.hold_reason || null,
      source_type: 'standalone_unit',
      source_payload: unit,
    });
  }

  return rows;
}

async function main() {
  const payload = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  const rows = flattenInventory(payload);
  const statusCounts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  if (cli.preflight) {
    runPreflight(cli.envPath);
    return;
  }

  if (cli.dryRun) {
    // Explicit image audit: check if any unit has usable (non-~/ local) image paths.
    // All current source paths are ~/Desktop/MS Forklift Inventory/* — local Mac paths.
    // A live sync would write images:[] for every row. Bill must upload to Supabase Storage first.
    const imagesLoaded = rows.some(r => (r.images || []).length > 0);
    console.log(JSON.stringify({
      attempted: rows.length,
      statusCounts,
      images_loaded: imagesLoaded,       // false = all rows push images:[] to DB
      pending_new_units: payload.inventory.pending_new_units ?? null,
      sample: rows.slice(0, 3),
    }, null, 2));
    return;
  }

  const env = readEnv(cli.envPath);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(`Missing Supabase credentials in ${cli.envPath}`);
  }

  const supabase = createClient(url, serviceRoleKey);

  // Pre-flight: verify credentials are accepted before attempting write.
  // This fails fast with a clear message instead of an opaque upsert error.
  const { data: pingData, error: pingError } = await supabase
    .from('inventory')
    .select('id')
    .limit(1);

  if (pingError) {
    const hint =
      pingError.message.includes('Invalid API key') ||
      pingError.message.includes('API key')
        ? ' — Supabase API key is invalid or revoked. Update SUPABASE_SERVICE_ROLE_KEY in .env.production.pull and Vercel env vars.'
        : '';
    throw new Error(`Preflight auth check failed: ${pingError.message}${hint}`);
  }

  const { data, error } = await supabase
    .from('inventory')
    .upsert(rows, { onConflict: 'external_key' })
    .select('external_key,status,hold_reason');

  if (error) {
    throw error;
  }

  const freshStatusCounts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    attempted: rows.length,
    returned: data?.length || 0,
    statusCounts: freshStatusCounts,
    sample: data?.slice(0, 3) || [],
  }, null, 2));
}

main().catch((error) => {
  console.error('[pushbutton_inventory_sync] failed');
  console.error(error);
  process.exit(1);
});
