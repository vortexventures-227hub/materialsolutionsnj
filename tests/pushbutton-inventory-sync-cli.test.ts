import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'scripts', 'pushbutton_inventory_sync.mjs');

function runSyncCli(args: string[]) {
  return spawnSync('node', [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('pushbutton_inventory_sync preflight reports missing env file instead of crashing', () => {
  const missingEnvPath = path.join(os.tmpdir(), `pushbutton-missing-${process.pid}-${Date.now()}.env`);
  const result = runSyncCli(['--preflight', missingEnvPath]);

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    mode: string;
    envPath: string;
    envFileExists: boolean;
    inventoryExists: boolean;
    missingEnv: string[];
    readyForWrite: boolean;
  };

  assert.equal(parsed.mode, 'preflight');
  assert.equal(parsed.envPath, missingEnvPath);
  assert.equal(parsed.envFileExists, false);
  assert.equal(parsed.inventoryExists, true);
  assert.deepEqual(parsed.missingEnv, ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  assert.equal(parsed.readyForWrite, false);
});

test('pushbutton_inventory_sync preflight reports exact missing credential keys from env file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pushbutton-sync-'));
  const envPath = path.join(tmpDir, 'partial.env');
  fs.writeFileSync(envPath, 'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\n');

  const result = runSyncCli(['--preflight', envPath]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    envFileExists: boolean;
    missingEnv: string[];
    readyForWrite: boolean;
  };

  assert.equal(parsed.envFileExists, true);
  assert.deepEqual(parsed.missingEnv, ['SUPABASE_SERVICE_ROLE_KEY']);
  assert.equal(parsed.readyForWrite, false);
});
