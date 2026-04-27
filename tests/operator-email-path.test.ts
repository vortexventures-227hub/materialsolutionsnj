import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile } from 'node:fs/promises';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runPublishPipeline } from '../src/lib/marketing/publishPipeline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const INVENTORY_PATH = path.join(REPO_ROOT, 'data', 'forklift-inventory.json');
const DAVID_RUNTIME_ROOT = '/Users/vortexventures/Desktop/Vortex Ventures/VVMaterialSolutionsOps/runtime/david-agent';

async function createPipelinePaths() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'operator-email-path-'));
  return {
    manualQueueDir: path.join(root, 'queue'),
    receiptLogPath: path.join(root, 'publish_receipts.jsonl'),
  };
}

test('Publish Button operator email uses David sender and records SendGrid failure without a live send', async () => {
  const paths = await createPipelinePaths();
  const originalRequest = https.request;
  const originalApiKey = process.env.SENDGRID_API_KEY;
  const capturedBodies: string[] = [];

  Object.defineProperty(https, 'request', {
    configurable: true,
    value: (_options: https.RequestOptions, callback: (res: NodeJS.ReadableStream & { statusCode?: number }) => void) => {
      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string | Buffer) => void;
        end: () => void;
      };

      req.write = (chunk: string | Buffer) => {
        capturedBodies.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk);
      };
      req.end = () => {
        const res = new EventEmitter() as NodeJS.ReadableStream & {
          statusCode?: number;
          read: () => null;
        };
        res.statusCode = 500;
        res.read = () => null;
        setImmediate(() => {
          callback(res);
          res.emit('data', Buffer.from('stubbed SendGrid 500'));
          res.emit('end');
        });
      };

      return req;
    },
  });

  process.env.SENDGRID_API_KEY = 'SG.stubbed-test-key';

  try {
    const result = await runPublishPipeline('RT-752R45TT-2018', 'facebook_marketplace', {
      inventoryPath: INVENTORY_PATH,
      dryRunOverride: true,
      ...paths,
    });

    assert.equal(capturedBodies.length, 1);
    const sendGridPayload = JSON.parse(capturedBodies[0]);

    assert.deepEqual(
      sendGridPayload.personalizations[0].to.map((recipient: { email: string }) => recipient.email).sort(),
      ['bwhite@MaterialSolutions.com', 'crazzuoli@MaterialSolutions.com'].sort(),
    );
    assert.equal(sendGridPayload.from.email, 'david@materialsolutionsnj.com');
    assert.equal(sendGridPayload.from.name, 'David of Material Solutions NJ');
    assert.doesNotMatch(JSON.stringify(sendGridPayload), /info@materialsolutionsnj\.com/i);

    assert.equal(result.notifications.length, 2);
    assert.ok(result.notifications.every((notification) => notification.status === 'error'));
    assert.ok(
      result.notifications.every((notification) => notification.error?.includes('HTTP 500')),
      'SendGrid 500 is returned as a visible notification error',
    );

    const receiptRows = (await readFile(paths.receiptLogPath, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    assert.equal(receiptRows.length, 1);
    assert.equal(receiptRows[0].receiptId, result.receiptId);
    assert.deepEqual(receiptRows[0].notifications, result.notifications);
  } finally {
    Object.defineProperty(https, 'request', {
      configurable: true,
      value: originalRequest,
    });
    if (originalApiKey === undefined) {
      delete process.env.SENDGRID_API_KEY;
    } else {
      process.env.SENDGRID_API_KEY = originalApiKey;
    }
  }
});

test('David SendGrid operator email sources stay on David sender and avoid info@ headers', async () => {
  const sources = await Promise.all([
    readFile(path.join(DAVID_RUNTIME_ROOT, 'src', 'notify.ts'), 'utf8'),
    readFile(path.join(DAVID_RUNTIME_ROOT, 'src', 'post_conversation_email.ts'), 'utf8'),
    readFile(path.join(REPO_ROOT, 'src', 'lib', 'marketing', 'publishPipeline.ts'), 'utf8'),
  ]);
  const joinedSources = sources.join('\n');

  assert.match(joinedSources, /david@materialsolutionsnj\.com/);
  assert.match(joinedSources, /crazzuoli@MaterialSolutions\.com/);
  assert.match(joinedSources, /bwhite@MaterialSolutions\.com/);
  assert.doesNotMatch(joinedSources, /from:\s*\{[^}]*info@materialsolutionsnj\.com/i);
  assert.match(joinedSources, /candidate\.toLowerCase\(\) === 'info@materialsolutionsnj\.com' \? DAVID_/);
  assert.match(sources[0], /logEmailSend/);
  assert.match(sources[0], /console\.error\('\[notify\] SendGrid lead notification error:'/);
  assert.match(sources[1], /logEmailSend/);
  assert.match(sources[1], /console\.error\('\[post_email\] SendGrid error:'/);
});
