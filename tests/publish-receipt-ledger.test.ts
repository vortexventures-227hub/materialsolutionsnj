import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';

import {
  generateReceiptId,
  lookupIdempotencyKey,
  writeProxyReceipt,
} from '../src/lib/marketing/publishReceiptLedger';

test('generateReceiptId produces a 12-char hex string deterministically', () => {
  const id1 = generateReceiptId('UNIT-A', 'facebook_marketplace', 'key-abc');
  const id2 = generateReceiptId('UNIT-A', 'facebook_marketplace', 'key-abc');
  assert.strictEqual(id1, id2);
  assert.match(id1, /^[0-9a-f]{12}$/);
});

test('generateReceiptId differs when any input differs', () => {
  const a = generateReceiptId('UNIT-A', 'facebook_marketplace', 'key-1');
  const b = generateReceiptId('UNIT-A', 'facebook_marketplace', 'key-2');
  const c = generateReceiptId('UNIT-B', 'facebook_marketplace', 'key-1');
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(a, c);
});

test('writeProxyReceipt appends a JSONL entry and returns a receiptId', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'receipt-ledger-test-'));
  const ledgerPath = path.join(dir, 'receipts.jsonl');

  try {
    const receiptId = await writeProxyReceipt(
      {
        idempotencyKey: 'idem-key-001',
        unitId: 'UNIT-001',
        platform: 'ebay',
        timestamp: '2026-04-26T20:00:00.000Z',
        fsmResponse: { inventoryId: 'UNIT-001', summary: { published: 1 } },
        source: 'storefront:/api/inventory/unit-001/publish',
      },
      ledgerPath,
    );

    assert.match(receiptId, /^[0-9a-f]{12}$/);
    assert.strictEqual(receiptId, generateReceiptId('UNIT-001', 'ebay', 'idem-key-001'));
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('lookupIdempotencyKey returns null when ledger file does not exist', async () => {
  const result = await lookupIdempotencyKey('no-such-key', '/tmp/nonexistent-receipts.jsonl');
  assert.strictEqual(result, null);
});

test('lookupIdempotencyKey returns the matching entry after write', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'receipt-ledger-test-'));
  const ledgerPath = path.join(dir, 'receipts.jsonl');

  try {
    const fsmPayload = { inventoryId: 'UNIT-002', summary: { queued: 1 } };

    await writeProxyReceipt(
      {
        idempotencyKey: 'idem-key-002',
        unitId: 'UNIT-002',
        platform: 'craigslist',
        timestamp: '2026-04-26T20:01:00.000Z',
        fsmResponse: fsmPayload,
        source: 'storefront:/api/marketing/publish',
      },
      ledgerPath,
    );

    const found = await lookupIdempotencyKey('idem-key-002', ledgerPath);
    assert.ok(found);
    assert.strictEqual(found.idempotencyKey, 'idem-key-002');
    assert.strictEqual(found.unitId, 'UNIT-002');
    assert.strictEqual(found.platform, 'craigslist');
    assert.deepStrictEqual(found.fsmResponse, fsmPayload);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('lookupIdempotencyKey returns null for an unknown key when file has entries', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'receipt-ledger-test-'));
  const ledgerPath = path.join(dir, 'receipts.jsonl');

  try {
    await writeProxyReceipt(
      {
        idempotencyKey: 'idem-key-003',
        unitId: 'UNIT-003',
        platform: 'offer_up',
        timestamp: '2026-04-26T20:02:00.000Z',
        fsmResponse: {},
        source: 'storefront:/api/marketing/publish',
      },
      ledgerPath,
    );

    const result = await lookupIdempotencyKey('idem-key-does-not-exist', ledgerPath);
    assert.strictEqual(result, null);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('lookupIdempotencyKey returns the most recent entry for a repeated key', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'receipt-ledger-test-'));
  const ledgerPath = path.join(dir, 'receipts.jsonl');

  try {
    await writeProxyReceipt(
      {
        idempotencyKey: 'idem-key-004',
        unitId: 'UNIT-004',
        platform: 'website',
        timestamp: '2026-04-26T20:03:00.000Z',
        fsmResponse: { attempt: 1 },
        source: 'storefront:/api/inventory/unit-004/publish',
      },
      ledgerPath,
    );
    await writeProxyReceipt(
      {
        idempotencyKey: 'idem-key-004',
        unitId: 'UNIT-004',
        platform: 'website',
        timestamp: '2026-04-26T20:04:00.000Z',
        fsmResponse: { attempt: 2 },
        source: 'storefront:/api/inventory/unit-004/publish',
      },
      ledgerPath,
    );

    const found = await lookupIdempotencyKey('idem-key-004', ledgerPath);
    assert.ok(found);
    assert.deepStrictEqual(found.fsmResponse, { attempt: 2 });
  } finally {
    await rm(dir, { recursive: true });
  }
});
