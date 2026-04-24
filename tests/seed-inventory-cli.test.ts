import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

function blankWriteEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  };
}

test('seed_inventory_marketing preflight reports exact missing env surface without attempting writes', () => {
  const result = runSeedCli(['--preflight', '--env', path.join(tmpdir(), 'missing-herm-seed-env')], blankWriteEnv());
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

test('seed_inventory_marketing preflight can resolve write env from a pulled env file', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'seed-inventory-env-'));
  const envPath = path.join(tempDir, '.env.production.pull');
  writeFileSync(
    envPath,
    [
      'NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co\\n"',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-test-key',
      'SUPABASE_SERVICE_ROLE_KEY=service-role-test-key',
      '',
    ].join('\n'),
  );

  const result = runSeedCli(['--preflight', '--env', envPath], blankWriteEnv());
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    readyForWrite: boolean;
    missingEnv: string[];
    envPath: string;
    envFileExists: boolean;
  };

  assert.equal(parsed.envPath, envPath);
  assert.equal(parsed.envFileExists, true);
  assert.deepEqual(parsed.missingEnv, []);
  assert.equal(parsed.readyForWrite, true);
});
