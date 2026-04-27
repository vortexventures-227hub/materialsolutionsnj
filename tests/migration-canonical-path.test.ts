import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalMigrationDir = path.join(repoRoot, 'supabase', 'migrations');
const inventoryMarketingMigrationPath = path.join(canonicalMigrationDir, '010_create_inventory_marketing.sql');
const inventoryMarketingAssetsJsonMigrationPath = path.join(canonicalMigrationDir, '011_add_assets_json.sql');
const listingStatusMigrationPath = path.join(canonicalMigrationDir, '012_create_listing_status.sql');
const davidConversationIdentityMigrationPath = path.join(
  canonicalMigrationDir,
  '015_add_conversations_identity_columns.sql'
);
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

test('inventory_marketing assets_json migration lives under supabase/migrations', () => {
  assert.equal(
    existsSync(inventoryMarketingAssetsJsonMigrationPath),
    true,
    'canonical assets_json migration missing from supabase/migrations'
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

test('David conversation identity migration is in the canonical Supabase migration chain', () => {
  assert.equal(
    existsSync(davidConversationIdentityMigrationPath),
    true,
    'canonical David conversation identity migration missing from supabase/migrations'
  );

  const migrationSql = readFileSync(davidConversationIdentityMigrationPath, 'utf8');
  assert.match(migrationSql, /ALTER TABLE conversations ADD COLUMN IF NOT EXISTS email TEXT;/);
  assert.match(migrationSql, /ALTER TABLE conversations ADD COLUMN IF NOT EXISTS phone TEXT;/);
  assert.match(migrationSql, /CREATE INDEX IF NOT EXISTS idx_conversations_email/);
  assert.match(migrationSql, /CREATE INDEX IF NOT EXISTS idx_conversations_phone/);
});
