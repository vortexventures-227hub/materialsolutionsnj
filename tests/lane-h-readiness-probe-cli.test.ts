import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'scripts', 'lane_h_readiness_probe.mjs');
function runProbe(args: string[] = ['--preflight'], extraEnv: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, ['--import', 'tsx', scriptPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: 'utf8',
  });
}

function runGit(commandArgs: string[], cwd: string) {
  const result = spawnSync('git', commandArgs, {
    cwd,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function createBehindUpstreamRepoPair(prefix: string) {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  const originDir = path.join(baseDir, 'origin.git');
  const seedDir = path.join(baseDir, 'seed');
  const probeDir = path.join(baseDir, 'probe');

  runGit(['init', '--bare', originDir], baseDir);
  runGit(['clone', originDir, seedDir], baseDir);
  runGit(['config', 'user.name', 'Hermes Test'], seedDir);
  runGit(['config', 'user.email', 'hermes@example.com'], seedDir);
  fs.writeFileSync(path.join(seedDir, 'README.md'), '# base\n');
  runGit(['add', 'README.md'], seedDir);
  runGit(['commit', '-m', 'base'], seedDir);
  runGit(['push', '-u', 'origin', 'HEAD'], seedDir);

  runGit(['clone', originDir, probeDir], baseDir);
  runGit(['config', 'user.name', 'Hermes Test'], seedDir);
  runGit(['config', 'user.email', 'hermes@example.com'], seedDir);
  fs.writeFileSync(path.join(seedDir, 'README.md'), '# upstream moved\n');
  runGit(['commit', '-am', 'advance upstream'], seedDir);
  runGit(['push'], seedDir);

  return { baseDir, probeDir };
}

test('lane_h_readiness_probe aggregates the current environment, tooling, and packaging blockers into one machine-checkable report', () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    PATH: '/usr/bin:/bin',
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

  assert.equal(parsed.mode, 'preflight');
  assert.equal(parsed.overallReady, false);
  assert.ok(Array.isArray(parsed.blockers));
  assert.equal(typeof parsed.emailAcceptance.readyForOfflineSpamCheck, 'boolean');
  assert.equal(parsed.emailAcceptance.totalTouchesRendered, 15);
  assert.equal(parsed.inventorySync.readyForWrite, true);
  assert.equal(parsed.inventorySync.envFileExists, true);
  assert.deepEqual(parsed.inventorySync.missingEnv, []);
  assert.equal(parsed.inventoryMarketingSeed.readyForWrite, parsed.inventoryMarketingSeed.missingEnv.length === 0);
  assert.equal(parsed.inventoryMarketingSeed.migrationPresent, true);
  assert.ok(Array.isArray(parsed.inventoryMarketingSeed.missingEnv));
  assert.equal(typeof parsed.branchPackaging.laneH.branch, 'string');
  assert.equal(parsed.branchPackaging.laneH.behind, 0);
  assert.equal(parsed.branchPackaging.laneH.requiresPush, parsed.branchPackaging.laneH.ahead > 0);
  assert.equal(typeof parsed.branchPackaging.lightbox.branch, 'string');
  assert.equal(parsed.branchPackaging.lightbox.behind, 0);
  assert.equal(parsed.branchPackaging.lightbox.requiresPush, parsed.branchPackaging.lightbox.ahead > 0);
});

test('lane_h_readiness_probe --assert-ready fails fast when any blocker remains', () => {
  const result = runProbe(['--preflight', '--assert-ready'], {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    PATH: '/usr/bin:/bin',
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    overallReady: boolean;
    blockers: string[];
  };

  assert.equal(parsed.overallReady, false);
  assert.ok(parsed.blockers.length > 0);
});

test('lane_h_readiness_probe surfaces branch packaging status from both active and lightbox worktrees', () => {
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
  assert.equal(typeof parsed.branchPackaging?.laneH.branch, 'string');
  assert.equal(parsed.branchPackaging?.laneH.behind, 0);
  assert.equal(parsed.branchPackaging?.laneH.requiresPush, (parsed.branchPackaging?.laneH.ahead ?? 0) > 0);
  assert.equal(typeof parsed.branchPackaging?.laneH.workingTreeClean, 'boolean');
  assert.equal(typeof parsed.branchPackaging?.lightbox.branch, 'string');
  assert.equal(parsed.branchPackaging?.lightbox.behind, 0);
  assert.equal(parsed.branchPackaging?.lightbox.requiresPush, (parsed.branchPackaging?.lightbox.ahead ?? 0) > 0);
  assert.equal(typeof parsed.branchPackaging?.lightbox.workingTreeClean, 'boolean');
  const laneHPackagingBlocked =
    (parsed.branchPackaging?.laneH.ahead ?? 0) > 0 ||
    (parsed.branchPackaging?.laneH.behind ?? 0) > 0 ||
    parsed.branchPackaging?.laneH.workingTreeClean === false;
  const lightboxPackagingBlocked =
    (parsed.branchPackaging?.lightbox.ahead ?? 0) > 0 ||
    (parsed.branchPackaging?.lightbox.behind ?? 0) > 0 ||
    parsed.branchPackaging?.lightbox.workingTreeClean === false;
  assert.equal(parsed.blockers.includes('lane_h_branch_packaging'), laneHPackagingBlocked);
  assert.equal(parsed.blockers.includes('lightbox_branch_packaging'), lightboxPackagingBlocked);
});

test('lane_h_readiness_probe treats behind-upstream worktrees as packaging blockers instead of silently passing them', () => {
  const laneH = createBehindUpstreamRepoPair('lane-h-behind');
  const lightbox = createBehindUpstreamRepoPair('lightbox-behind');

  const result = runProbe(['--preflight'], {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    LANE_H_BRANCH_REPO_PATH: laneH.probeDir,
    LIGHTBOX_BRANCH_REPO_PATH: lightbox.probeDir,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    blockers: string[];
    branchPackaging: {
      laneH: {
        ahead: number;
        behind: number;
        status: string;
        requiresPush: boolean;
      };
      lightbox: {
        ahead: number;
        behind: number;
        status: string;
        requiresPush: boolean;
      };
    };
  };

  assert.equal(parsed.branchPackaging.laneH.behind, 1);
  assert.equal(parsed.branchPackaging.laneH.ahead, 0);
  assert.equal(parsed.branchPackaging.laneH.status, 'behind-upstream');
  assert.equal(parsed.branchPackaging.laneH.requiresPush, false);
  assert.equal(parsed.branchPackaging.lightbox.behind, 1);
  assert.equal(parsed.branchPackaging.lightbox.ahead, 0);
  assert.equal(parsed.branchPackaging.lightbox.status, 'behind-upstream');
  assert.equal(parsed.branchPackaging.lightbox.requiresPush, false);
  assert.ok(parsed.blockers.includes('lane_h_branch_packaging'));
  assert.ok(parsed.blockers.includes('lightbox_branch_packaging'));
});
