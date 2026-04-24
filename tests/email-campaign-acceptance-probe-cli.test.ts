import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'scripts', 'email_campaign_acceptance_probe.mjs');

function runProbe(extraEnv: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, ['--import', 'tsx', scriptPath, '--preflight'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

test('email campaign acceptance probe preflight renders all required touches and reports missing SpamAssassin tooling', () => {
  const result = runProbe({ PATH: '/usr/bin:/bin' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    mode: string;
    inboundTouchesRendered: number;
    coldOutreachTouchesRendered: number;
    totalTouchesRendered: number;
    templateFilesPresent: boolean;
    missingTemplateFiles: string[];
    complianceFailures: string[];
    spamassassinAvailable: boolean;
    spamcAvailable: boolean;
    readyForOfflineSpamCheck: boolean;
  };

  assert.equal(parsed.mode, 'preflight');
  assert.equal(parsed.inboundTouchesRendered, 3);
  assert.equal(parsed.coldOutreachTouchesRendered, 12);
  assert.equal(parsed.totalTouchesRendered, 15);
  assert.equal(parsed.templateFilesPresent, true);
  assert.deepEqual(parsed.missingTemplateFiles, []);
  assert.deepEqual(parsed.complianceFailures, []);
  assert.equal(parsed.spamassassinAvailable, false);
  assert.equal(parsed.spamcAvailable, false);
  assert.equal(parsed.readyForOfflineSpamCheck, false);
});

test('email campaign acceptance probe preflight reports ready when SpamAssassin binaries are on PATH', () => {
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spam-bin-'));
  const spamassassinPath = path.join(binDir, 'spamassassin');
  const spamcPath = path.join(binDir, 'spamc');
  fs.writeFileSync(spamassassinPath, '#!/bin/sh\nexit 0\n');
  fs.writeFileSync(spamcPath, '#!/bin/sh\nexit 0\n');
  fs.chmodSync(spamassassinPath, 0o755);
  fs.chmodSync(spamcPath, 0o755);

  const result = runProbe({ PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}` });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const parsed = JSON.parse(result.stdout.trim()) as {
    spamassassinAvailable: boolean;
    spamcAvailable: boolean;
    readyForOfflineSpamCheck: boolean;
  };

  assert.equal(parsed.spamassassinAvailable, true);
  assert.equal(parsed.spamcAvailable, true);
  assert.equal(parsed.readyForOfflineSpamCheck, true);
});
