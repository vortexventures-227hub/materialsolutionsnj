import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalMigrationDir = path.join(repoRoot, 'supabase', 'migrations');
const inventoryMarketingMigrationPath = path.join(canonicalMigrationDir, '010_create_inventory_marketing.sql');
const listingStatusMigrationPath = path.join(canonicalMigrationDir, '011_create_listing_status.sql');
const legacyMigrationDir = path.join(repoRoot, 'src', 'lib', 'db', 'migrations');

test('inventory_marketing migration lives only under supabase/migrations', () => {
  assert.equal(existsSync(inventoryMarketingMigrationPath), true, 'canonical inventory_marketing migration missing from supabase/migrations');

  const legacyCopies = existsSync(legacyMigrationDir)
    ? readdirSync(legacyMigrationDir).filter((name) => /inventory_marketing/i.test(name))
    : [];

  assert.deepEqual(
    legacyCopies,
    [],
    `unexpected shadow inventory_marketing migrations found outside supabase/migrations: ${legacyCopies.join(', ')}`
  );
});

test('listing_status migration lives only under supabase/migrations', () => {
  assert.equal(existsSync(listingStatusMigrationPath), true, 'canonical listing_status migration missing from supabase/migrations');

  const legacyCopies = existsSync(legacyMigrationDir)
    ? readdirSync(legacyMigrationDir).filter((name) => /listing_status/i.test(name))
    : [];

  assert.deepEqual(
    legacyCopies,
    [],
    `unexpected shadow listing_status migrations found outside supabase/migrations: ${legacyCopies.join(', ')}`
  );
});
