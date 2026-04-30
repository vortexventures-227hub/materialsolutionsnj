import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseMemoryBackend } from '../src/lib/david/memory/supabase-adapter';
import type { DavidIdentity, PriorEquipmentInterest } from '../src/lib/david/memory/types';

const identity: DavidIdentity = {
  personId: 'lead_123',
  confidence: 'exact',
  matchedBy: 'lead_id',
  piiRedactedFingerprint: 'abc123def456',
};

function makeClient(result: { data?: unknown; error?: unknown }) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder = {
    select(...args: unknown[]) {
      calls.push({ method: 'select', args });
      return builder;
    },
    eq(...args: unknown[]) {
      calls.push({ method: 'eq', args });
      return builder;
    },
    order(...args: unknown[]) {
      calls.push({ method: 'order', args });
      return result;
    },
    limit(...args: unknown[]) {
      calls.push({ method: 'limit', args });
      return result;
    },
    insert(...args: unknown[]) {
      calls.push({ method: 'insert', args });
      return result;
    },
  };
  const client = {
    from(table: string) {
      calls.push({ method: 'from', args: [table] });
      return builder;
    },
  } as unknown as SupabaseClient;

  return { client, calls };
}

test('Supabase adapter retrieve filters by identity, orders by updated_at, and maps rows to DavidMemoryBrief', async () => {
  const { client, calls } = makeClient({
    data: [
      {
        fact: 'needs 200+ inch lift height',
        category: 'durable_fact',
        inventory_ref: null,
        metadata: { key: 'lift_height_min', captured_at: '2026-04-29T10:00:00.000Z' },
        created_at: '2026-04-29T10:00:00.000Z',
        updated_at: '2026-04-29T10:01:00.000Z',
      },
      {
        fact: 'previously asked about this truck',
        category: 'equipment_interest',
        inventory_ref: {
          id: 'RT-752R45TT-2018',
          slug: 'rt-752r45tt-2018',
          title: 'Raymond reach truck 2018',
          price: 12345,
          hours: 999,
        },
        metadata: { mentioned_at: '2026-04-29T10:02:00.000Z', note: 'asked if charger included' },
        created_at: '2026-04-29T10:02:00.000Z',
        updated_at: '2026-04-29T10:03:00.000Z',
      },
      {
        fact: 'call before noon',
        category: 'operator_note',
        inventory_ref: null,
        metadata: { created_at: '2026-04-29T10:04:00.000Z', created_by: 'operator' },
        created_at: '2026-04-29T10:04:00.000Z',
        updated_at: '2026-04-29T10:05:00.000Z',
      },
    ],
  });

  const backend = createSupabaseMemoryBackend({ getClient: () => client });
  const brief = await backend.retrieve(identity);

  assert.ok(brief);
  assert.deepEqual(brief.identity, identity);
  assert.deepEqual(brief.knownDurableFacts, [
    {
      key: 'lift_height_min',
      value: 'needs 200+ inch lift height',
      captured_at: '2026-04-29T10:00:00.000Z',
    },
  ]);
  assert.deepEqual(brief.priorEquipmentInterest, [
    {
      inventory_id: 'RT-752R45TT-2018',
      slug: 'rt-752r45tt-2018',
      title: 'Raymond reach truck 2018',
      mentioned_at: '2026-04-29T10:02:00.000Z',
      note: 'asked if charger included',
    },
  ]);
  assert.deepEqual(brief.operatorNotes, [
    {
      note: 'call before noon',
      created_at: '2026-04-29T10:04:00.000Z',
      created_by: 'operator',
    },
  ]);

  assert.deepEqual(calls.find((call) => call.method === 'from')?.args, ['david_memory']);
  assert.deepEqual(calls.find((call) => call.method === 'eq')?.args, ['identity_key', 'person:lead_123']);
  assert.deepEqual(calls.find((call) => call.method === 'order')?.args, [
    'updated_at',
    { ascending: false },
  ]);
});

test('Supabase adapter persist maps equipment interest to safe payload without raw PII or unsafe inventory fields', async () => {
  const { client, calls } = makeClient({ data: null, error: null });
  const backend = createSupabaseMemoryBackend({ getClient: () => client });
  const sessionIdentity: DavidIdentity = {
    personId: null,
    confidence: 'strong',
    matchedBy: 'session',
    piiRedactedFingerprint: 'sha12only000',
  };
  const interest = {
    inventory_id: 'unit-1',
    slug: 'unit-1-slug',
    title: 'Safe title only',
    mentioned_at: '2026-04-29T11:00:00.000Z',
    note: 'asked about delivery',
    price: '$99,999',
    serial_number: 'SHOULD_NOT_STORE',
  } as PriorEquipmentInterest & { price: string; serial_number: string };

  await backend.persist(sessionIdentity, interest);

  const payload = calls.find((call) => call.method === 'insert')?.args[0] as Record<string, unknown>;
  assert.equal(payload.identity_key, 'session:sha12only000');
  assert.equal(payload.pii_fingerprint, 'sha12only000');
  assert.equal(payload.category, 'equipment_interest');
  assert.equal(payload.fact, 'asked about delivery');
  assert.deepEqual(payload.inventory_ref, {
    id: 'unit-1',
    slug: 'unit-1-slug',
    title: 'Safe title only',
  });
  assert.deepEqual(payload.metadata, {
    mentioned_at: '2026-04-29T11:00:00.000Z',
    note: 'asked about delivery',
  });
  assert.equal(JSON.stringify(payload).includes('SHOULD_NOT_STORE'), false);
  assert.equal(JSON.stringify(payload).includes('$99,999'), false);
});

test('Supabase adapter persist maps durable facts and operator notes to expected columns', async () => {
  const { client, calls } = makeClient({ data: null, error: null });
  const backend = createSupabaseMemoryBackend({ getClient: () => client });

  await backend.persist(identity, {
    key: 'equipment_preference',
    value: 'prefers electric forklifts',
    captured_at: '2026-04-29T12:00:00.000Z',
  });
  await backend.persist(identity, {
    note: 'VIP account',
    created_at: '2026-04-29T12:01:00.000Z',
    created_by: 'operator',
  });

  const inserts = calls.filter((call) => call.method === 'insert').map((call) => call.args[0] as Record<string, unknown>);
  assert.equal(inserts[0].identity_key, 'person:lead_123');
  assert.equal(inserts[0].category, 'durable_fact');
  assert.equal(inserts[0].fact, 'prefers electric forklifts');
  assert.deepEqual(inserts[0].metadata, {
    key: 'equipment_preference',
    captured_at: '2026-04-29T12:00:00.000Z',
  });
  assert.equal(inserts[1].category, 'operator_note');
  assert.equal(inserts[1].fact, 'VIP account');
  assert.deepEqual(inserts[1].metadata, {
    created_at: '2026-04-29T12:01:00.000Z',
    created_by: 'operator',
  });
});

test('Supabase adapter retrieve and persist fall back without throwing on Supabase errors', async () => {
  const errored = makeClient({ data: null, error: new Error('database unavailable') });
  const backend = createSupabaseMemoryBackend({ getClient: () => errored.client });

  assert.equal(await backend.retrieve(identity), null);
  await assert.doesNotReject(() =>
    backend.persist(identity, {
      key: 'foo',
      value: 'bar',
      captured_at: '2026-04-29T12:02:00.000Z',
    })
  );

  const throwingBackend = createSupabaseMemoryBackend({
    getClient: () => {
      throw new Error('missing env');
    },
  });
  assert.equal(await throwingBackend.retrieve(identity), null);
  await assert.doesNotReject(() =>
    throwingBackend.persist(identity, {
      note: 'do not throw',
      created_at: '2026-04-29T12:03:00.000Z',
    })
  );
});

test('Supabase adapter healthCheck verifies table reachability with read-only query', async () => {
  const healthy = makeClient({ data: [], error: null });
  const unhealthy = makeClient({ data: null, error: new Error('no table') });

  assert.equal(await createSupabaseMemoryBackend({ getClient: () => healthy.client }).healthCheck(), true);
  assert.equal(await createSupabaseMemoryBackend({ getClient: () => unhealthy.client }).healthCheck(), false);

  assert.deepEqual(healthy.calls.map((call) => call.method), ['from', 'select', 'limit']);
  assert.equal(healthy.calls.some((call) => call.method === 'insert'), false);
});
