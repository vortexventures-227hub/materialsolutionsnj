import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ForkliftUnit } from '../src/lib/marketing/schemaTransformers';

function makeUnit(overrides: Partial<ForkliftUnit> = {}): ForkliftUnit {
  return {
    unit_id: 'RT-TEST-001',
    canonical_slug: 'rt-test-001',
    make: 'Raymond',
    model: '7420',
    year: 2019,
    unit_type: 'Reach Truck',
    location: 'Hamilton, NJ',
    serial: 'SERIAL-001',
    capacity_lbs: 4500,
    mast_collapsed_inches: 120,
    mast_extended_inches: 240,
    features: ['Side shift'],
    battery: '36V',
    battery_voltage: 36,
    hours_approx: 1234,
    condition: 'Good',
    asking_price_usd: 25900,
    media_paths: ['uploads/test.jpg'],
    delivery_available: true,
    status: 'available',
    hold_reason: null,
    sold_as_lot_only: false,
    lot_id: null,
    source_kind: 'standalone',
    ...overrides,
  };
}

test('canonical prewarm handler rejects unauthorized requests when CRON_SECRET_TOKEN is configured', async () => {
  const { createCanonicalPrewarmHandler } = await import('../src/app/api/cron/canonical-prewarm/handler.ts');

  const handler = createCanonicalPrewarmHandler({
    cronSecretToken: 'secret-token',
    listUnits: () => [makeUnit()],
    generateCanonicalContent: () => ({ unit_id: 'RT-TEST-001' }),
    upsertCanonicalContent: async () => undefined,
    now: () => new Date('2026-04-22T20:45:00.000Z'),
  });

  const response = await handler(new Request('http://localhost/api/cron/canonical-prewarm', { method: 'POST' }));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('canonical prewarm handler dry-run reports the active units without writing', async () => {
  const { createCanonicalPrewarmHandler } = await import('../src/app/api/cron/canonical-prewarm/handler.ts');

  let upsertCalls = 0;
  const handler = createCanonicalPrewarmHandler({
    cronSecretToken: null,
    listUnits: () => [
      makeUnit({ unit_id: 'ACTIVE-1', canonical_slug: 'active-1' }),
      makeUnit({ unit_id: 'HELD-1', canonical_slug: 'held-1', hold_reason: 'sale pending' }),
      makeUnit({ unit_id: 'LOT-1', canonical_slug: 'lot-1', sold_as_lot_only: true }),
      makeUnit({ unit_id: 'SOLD-1', canonical_slug: 'sold-1', status: 'sold' }),
    ],
    generateCanonicalContent: (unit) => ({ unit_id: unit.unit_id, canonical_slug: unit.canonical_slug }),
    upsertCanonicalContent: async () => {
      upsertCalls += 1;
    },
    now: () => new Date('2026-04-22T20:45:00.000Z'),
  });

  const response = await handler(new Request('http://localhost/api/cron/canonical-prewarm?dry_run=1', { method: 'POST' }));
  const body = (await response.json()) as {
    mode: string;
    units_total: number;
    units_active: number;
    units_warmed: number;
    units_skipped: number;
    skipped: string[];
    errors: Array<{ slug: string; error: string }>;
    cached: boolean;
    timestamp: string;
  };

  assert.equal(response.status, 200);
  assert.equal(body.mode, 'dry_run');
  assert.equal(body.units_total, 4);
  assert.equal(body.units_active, 1);
  assert.equal(body.units_warmed, 1);
  assert.equal(body.units_skipped, 3);
  assert.deepEqual(body.skipped, ['held-1', 'lot-1', 'sold-1']);
  assert.deepEqual(body.errors, []);
  assert.equal(body.cached, false);
  assert.equal(body.timestamp, '2026-04-22T20:45:00.000Z');
  assert.equal(upsertCalls, 0);
});

test('canonical prewarm handler persists active units and surfaces non-fatal upsert errors', async () => {
  const { createCanonicalPrewarmHandler } = await import('../src/app/api/cron/canonical-prewarm/handler.ts');

  const upserted: string[] = [];
  const handler = createCanonicalPrewarmHandler({
    cronSecretToken: 'secret-token',
    listUnits: () => [
      makeUnit({ unit_id: 'ACTIVE-1', canonical_slug: 'active-1' }),
      makeUnit({ unit_id: 'ACTIVE-2', canonical_slug: 'active-2' }),
    ],
    generateCanonicalContent: (unit) => ({ unit_id: unit.unit_id, canonical_slug: unit.canonical_slug }),
    upsertCanonicalContent: async (canonical) => {
      upserted.push(String(canonical.unit_id));
      if (canonical.unit_id === 'ACTIVE-2') {
        throw new Error('table missing');
      }
    },
    now: () => new Date('2026-04-22T20:45:00.000Z'),
  });

  const response = await handler(
    new Request('http://localhost/api/cron/canonical-prewarm', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret-token',
      },
    })
  );
  const body = (await response.json()) as {
    mode: string;
    units_total: number;
    units_active: number;
    units_warmed: number;
    units_skipped: number;
    errors: Array<{ slug: string; error: string }>;
    cached: boolean;
  };

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Cron-Pipeline'), 'canonical-v1:prewarm');
  assert.equal(body.mode, 'prewarm');
  assert.equal(body.units_total, 2);
  assert.equal(body.units_active, 2);
  assert.equal(body.units_warmed, 2);
  assert.equal(body.units_skipped, 0);
  assert.equal(body.cached, true);
  assert.deepEqual(upserted, ['ACTIVE-1', 'ACTIVE-2']);
  assert.deepEqual(body.errors, [{ slug: 'active-2', error: 'table missing' }]);
});

test('vercel config schedules the canonical prewarm cron at 6 AM daily', async () => {
  const repoRoot = path.resolve(import.meta.dirname, '..');
  const vercelConfig = JSON.parse(await readFile(path.join(repoRoot, 'vercel.json'), 'utf8')) as {
    crons?: Array<{ path: string; schedule: string }>;
  };

  assert.deepEqual(vercelConfig.crons, [
    {
      path: '/api/cron/canonical-prewarm',
      schedule: '0 6 * * *',
    },
  ]);
});
