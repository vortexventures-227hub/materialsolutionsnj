#!/usr/bin/env -S node --import tsx

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');
const laneHRepoRoot = process.env.LANE_H_BRANCH_REPO_PATH || repoRoot;
const lightboxRepoRoot =
  process.env.LIGHTBOX_BRANCH_REPO_PATH ||
  '/Users/vortexventures/Desktop/Vortex Ventures/VVAxeOps/Projects/materialsolutionsnj-0042';

function parseArgs(argv) {
  return {
    preflight: argv.includes('--preflight'),
    assertReady: argv.includes('--assert-ready'),
  };
}

function runJsonScript(relativeScriptPath, args = []) {
  const scriptPath = path.join(repoRoot, relativeScriptPath);
  const result = spawnSync(tsxBin, [scriptPath, ...args], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`${relativeScriptPath} failed${detail ? `: ${detail}` : ''}`);
  }

  try {
    return JSON.parse(result.stdout.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${relativeScriptPath} returned non-JSON output: ${message}`);
  }
}

function runGit(repoPath, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: repoPath,
    env: process.env,
    encoding: 'utf8',
  });

  if (result.status !== 0 && !allowFailure) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} failed in ${repoPath}${detail ? `: ${detail}` : ''}`);
  }

  return result;
}

function parseAheadBehind(raw) {
  const [behindRaw = '0', aheadRaw = '0'] = raw.trim().split(/\s+/);
  return {
    behind: Number.parseInt(behindRaw, 10) || 0,
    ahead: Number.parseInt(aheadRaw, 10) || 0,
  };
}

function getPackagingStatus({ upstream, fetchSucceeded, workingTreeClean, behind, ahead }) {
  if (!upstream) {
    return 'no-upstream';
  }

  if (!fetchSucceeded) {
    return 'fetch-failed';
  }

  if (!workingTreeClean) {
    return 'dirty';
  }

  if (behind > 0 && ahead > 0) {
    return 'diverged';
  }

  if (behind > 0) {
    return 'behind-upstream';
  }

  if (ahead > 0) {
    return 'ahead-of-upstream';
  }

  return 'synced';
}

function getBranchPackaging(repoPath) {
  const fetchResult = runGit(repoPath, ['fetch', '--quiet', '--all', '--prune'], { allowFailure: true });
  const fetchSucceeded = fetchResult.status === 0;
  const branch = runGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  const head = runGit(repoPath, ['rev-parse', '--short', 'HEAD']).stdout.trim();
  const upstreamResult = runGit(
    repoPath,
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
    { allowFailure: true }
  );
  const upstream = upstreamResult.status === 0 ? upstreamResult.stdout.trim() : null;
  const upstreamHead = upstream ? runGit(repoPath, ['rev-parse', '--short', upstream]).stdout.trim() : null;
  const workingTreeClean = runGit(repoPath, ['status', '--short']).stdout.trim() === '';
  const { behind, ahead } = upstream
    ? parseAheadBehind(runGit(repoPath, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]).stdout)
    : { behind: 0, ahead: 0 };
  const status = getPackagingStatus({ upstream, fetchSucceeded, workingTreeClean, behind, ahead });

  return {
    repoPath,
    branch,
    head,
    upstream,
    upstreamHead,
    fetchSucceeded,
    behind,
    ahead,
    status,
    ready: status === 'synced',
    requiresPush: ahead > 0,
    workingTreeClean,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const emailAcceptance = runJsonScript('scripts/email_campaign_acceptance_probe.mjs', ['--preflight']);
  const inventorySync = runJsonScript('scripts/pushbutton_inventory_sync.mjs', ['--preflight']);
  const inventoryMarketingSeed = runJsonScript('scripts/seed_inventory_marketing.mjs', ['--preflight']);
  const branchPackaging = {
    laneH: getBranchPackaging(laneHRepoRoot),
    lightbox: getBranchPackaging(lightboxRepoRoot),
  };

  const blockers = [];

  if (!emailAcceptance.readyForOfflineSpamCheck) {
    blockers.push('email_campaign_acceptance_probe');
  }

  if (!inventorySync.readyForWrite) {
    blockers.push('pushbutton_inventory_sync');
  }

  if (!inventoryMarketingSeed.readyForWrite) {
    blockers.push('seed_inventory_marketing');
  }

  if (!branchPackaging.laneH.ready) {
    blockers.push('lane_h_branch_packaging');
  }

  if (!branchPackaging.lightbox.ready) {
    blockers.push('lightbox_branch_packaging');
  }

  const report = {
    mode: 'preflight',
    overallReady: blockers.length === 0,
    blockers,
    emailAcceptance,
    inventorySync,
    inventoryMarketingSeed,
    branchPackaging,
  };

  console.log(JSON.stringify(report, null, 2));

  if (args.assertReady && !report.overallReady) {
    process.exitCode = 1;
  }
}

main();
