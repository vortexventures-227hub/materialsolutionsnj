import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalMigrationPath = path.join(repoRoot, 'supabase', 'migrations', '010_create_inventory_marketing.sql');
const legacyMigrationDir = path.join(repoRoot, 'src', 'lib', 'db', 'migrations');

test('inventory_marketing migration lives only under supabase/migrations', () => {
  assert.equal(existsSync(canonicalMigrationPath), true, 'canonical inventory_marketing migration missing from supabase/migrations');

  const legacyCopies = existsSync(legacyMigrationDir)
    ? readdirSync(legacyMigrationDir).filter((name) => /inventory_marketing/i.test(name))
    : [];

  assert.deepEqual(
    legacyCopies,
    [],
    `unexpected shadow inventory_marketing migrations found outside supabase/migrations: ${legacyCopies.join(', ')}`
  );
});
