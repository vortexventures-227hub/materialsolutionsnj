import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'scripts', 'lane_h_readiness_probe.mjs');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

function runProbe(args: string[] = ['--preflight'], extraEnv: NodeJS.ProcessEnv = {}) {
  return spawnSync(tsxBin, [scriptPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: 'utf8',
  });
}

test('lane_h_readiness_probe aggregates the current environment, tooling, and packaging blockers into one machine-checkable report', () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  };

  const result = runProbe(['--preflight'], env);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    mode: string;
    overallReady: boolean;
    blockers: string[];
    emailAcceptance: {
      readyForOfflineSpamCheck: boolean;
      totalTouchesRendered: number;
    };
    inventorySync: {
      readyForWrite: boolean;
      envFileExists: boolean;
      missingEnv: string[];
    };
    inventoryMarketingSeed: {
      readyForWrite: boolean;
      missingEnv: string[];
      migrationPresent: boolean;
    };
    branchPackaging: {
      laneH: {
        branch: string;
        ahead: number;
        behind: number;
      };
      lightbox: {
        branch: string;
        ahead: number;
        behind: number;
      };
    };
  };

  assert.equal(parsed.mode, 'preflight');
  assert.equal(parsed.overallReady, false);
  assert.deepEqual(parsed.blockers, [
    'email_campaign_acceptance_probe',
    'pushbutton_inventory_sync',
    'seed_inventory_marketing',
    'lane_h_branch_packaging',
    'lightbox_branch_packaging',
  ]);
  assert.equal(parsed.emailAcceptance.readyForOfflineSpamCheck, false);
  assert.equal(parsed.emailAcceptance.totalTouchesRendered, 15);
  assert.equal(parsed.inventorySync.readyForWrite, false);
  assert.equal(parsed.inventorySync.envFileExists, false);
  assert.ok(parsed.inventorySync.missingEnv.length > 0);
  assert.equal(parsed.inventoryMarketingSeed.readyForWrite, false);
  assert.equal(parsed.inventoryMarketingSeed.migrationPresent, true);
  assert.deepEqual(parsed.inventoryMarketingSeed.missingEnv, [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]);
  assert.equal(parsed.branchPackaging.laneH.branch, 'feat/lane-h-execution-phase-1');
  assert.equal(parsed.branchPackaging.laneH.behind, 0);
  assert.ok(parsed.branchPackaging.laneH.ahead > 0);
  assert.equal(parsed.branchPackaging.lightbox.branch, 'feat/inventory-gallery-lightbox');
  assert.equal(parsed.branchPackaging.lightbox.behind, 0);
  assert.ok(parsed.branchPackaging.lightbox.ahead > 0);
});

test('lane_h_readiness_probe --assert-ready fails fast when any blocker remains', () => {
  const result = runProbe(['--preflight', '--assert-ready'], {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    overallReady: boolean;
    blockers: string[];
  };

  assert.equal(parsed.overallReady, false);
  assert.deepEqual(parsed.blockers, [
    'email_campaign_acceptance_probe',
    'pushbutton_inventory_sync',
    'seed_inventory_marketing',
    'lane_h_branch_packaging',
    'lightbox_branch_packaging',
  ]);
});

test('lane_h_readiness_probe surfaces branch packaging blockers from both active and lightbox worktrees', () => {
  const parsed = JSON.parse(runProbe(['--preflight'], {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  }).stdout.trim()) as {
    blockers: string[];
    branchPackaging?: {
      laneH: {
        branch: string;
        ahead: number;
        behind: number;
        requiresPush: boolean;
        workingTreeClean: boolean;
      };
      lightbox: {
        branch: string;
        ahead: number;
        behind: number;
        requiresPush: boolean;
        workingTreeClean: boolean;
      };
    };
  };

  assert.ok(parsed.branchPackaging, 'expected branchPackaging report');
  assert.equal(parsed.branchPackaging?.laneH.branch, 'feat/lane-h-execution-phase-1');
  assert.equal(parsed.branchPackaging?.laneH.behind, 0);
  assert.ok((parsed.branchPackaging?.laneH.ahead ?? 0) > 0);
  assert.equal(parsed.branchPackaging?.laneH.requiresPush, true);
  assert.equal(typeof parsed.branchPackaging?.laneH.workingTreeClean, 'boolean');
  assert.equal(parsed.branchPackaging?.lightbox.branch, 'feat/inventory-gallery-lightbox');
  assert.equal(parsed.branchPackaging?.lightbox.behind, 0);
  assert.ok((parsed.branchPackaging?.lightbox.ahead ?? 0) > 0);
  assert.equal(parsed.branchPackaging?.lightbox.requiresPush, true);
  assert.equal(typeof parsed.branchPackaging?.lightbox.workingTreeClean, 'boolean');
  assert.ok(parsed.blockers.includes('lane_h_branch_packaging'));
  assert.ok(parsed.blockers.includes('lightbox_branch_packaging'));
});
