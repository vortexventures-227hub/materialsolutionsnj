#!/usr/bin/env -S node --import tsx

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

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

function main() {
  const args = parseArgs(process.argv.slice(2));
  const emailAcceptance = runJsonScript('scripts/email_campaign_acceptance_probe.mjs', ['--preflight']);
  const inventorySync = runJsonScript('scripts/pushbutton_inventory_sync.mjs', ['--preflight']);
  const inventoryMarketingSeed = runJsonScript('scripts/seed_inventory_marketing.mjs', ['--preflight']);

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

  const report = {
    mode: 'preflight',
    overallReady: blockers.length === 0,
    blockers,
    emailAcceptance,
    inventorySync,
    inventoryMarketingSeed,
  };

  console.log(JSON.stringify(report, null, 2));

  if (args.assertReady && !report.overallReady) {
    process.exitCode = 1;
  }
}

main();
