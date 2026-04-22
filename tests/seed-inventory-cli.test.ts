import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'scripts', 'seed_inventory_marketing.mjs');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

function runSeedCli(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(tsxBin, [scriptPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });
}

test('seed_inventory_marketing preflight reports exact missing env surface without attempting writes', () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  };

  const result = runSeedCli(['--preflight'], env);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    mode: string;
    readyForWrite: boolean;
    missingEnv: string[];
    migrationPath: string;
    migrationPresent: boolean;
    inventoryExists: boolean;
  };

  assert.equal(parsed.mode, 'preflight');
  assert.equal(parsed.readyForWrite, false);
  assert.deepEqual(parsed.missingEnv, [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]);
  assert.equal(parsed.inventoryExists, true);
  assert.equal(parsed.migrationPresent, true);
  assert.match(parsed.migrationPath, /010_create_inventory_marketing\.sql$/);
});
