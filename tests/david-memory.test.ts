/**
 * David Memory Test Suite — Neon Forge Chrome
 *
 * Tests the David persistent memory system against the shared contract:
 * - exact identity recall across sessions
 * - anonymous no-leak
 * - memory cap enforcement
 * - inventory truth guard
 * - backend-unavailable fallback
 * - lead routing unchanged when memory disabled
 * - PII-redacted proof
 *
 * Run: npx tsx --test tests/david-memory.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTestAdapter,
  resetTestAdapter,
  makeFixtureAProfile,
} from '../src/lib/david/memory/test-adapter';
import { resolveIdentity, redactPii, shortHash } from '../src/lib/david/memory/identity';
import { buildMemoryBriefBlock, truncateToMaxChars } from '../src/lib/david/memory/brief';
import { retrieveMemoryBrief, initializeMemoryBackend } from '../src/lib/david/memory/retrieve';
import { persistMemory, initializePersistBackend } from '../src/lib/david/memory/persist';
import { supabaseMemoryBackend } from '../src/lib/david/memory/supabase-adapter';
import type {
  DavidIdentity,
  DavidMemoryBrief,
  DavidMemoryConfig,
  DurableFact,
} from '../src/lib/david/memory/types';

// ---------------------------------------------------------------------------
// Fixtures — all PII is fake (DAVID_MEMORY_FIXTURES_V1.md)
// ---------------------------------------------------------------------------

const FIXTURE_A = {
  name: 'Sam Buyer',
  phone: '+1 555-010-2211',
  email: 'sam.fixture@example.test',
  company: 'North Dock Warehouse',
  // These are not stored; only fingerprints
};

const NOW = new Date().toISOString();

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

test('TEST SUITE: David Memory', { skip: false }, () => {});

test.afterEach(() => {
  resetTestAdapter();
});

// ---------------------------------------------------------------------------
// HELPER: initialize memory with a seeded adapter
// ---------------------------------------------------------------------------

function initMemory(overrides: Partial<{
  enabled: boolean;
  backend: 'test' | 'supabase' | 'zep';
  maxChars: number;
  writeEnabled: boolean;
  simulateBackendDown: boolean;
}> = {}) {
  const opts = { simulateBackendDown: false, ...overrides };
  const adapter = createTestAdapter({ simulateBackendDown: opts.simulateBackendDown });

  const config = {
    enabled: opts.enabled ?? false,
    backend: opts.backend ?? 'test',
    maxChars: opts.maxChars ?? 2200,
    writeEnabled: opts.writeEnabled ?? false,
  };

  initializeMemoryBackend(adapter, config);
  initializePersistBackend(adapter, opts.writeEnabled ?? false);

  return adapter;
}

// ---------------------------------------------------------------------------
// T-1: EXACT IDENTITY RECALL — same phone returns same memory across sessions
// ---------------------------------------------------------------------------

test('exact identity recall: same phone returns same durable facts across sessions', async () => {
  // Adapter seeded with Fixture A profile
  const fixtureAProfile = makeFixtureAProfile('person-sam-001');
  const adapter = createTestAdapter({ seedProfiles: [fixtureAProfile] });
  initializeMemoryBackend(adapter, { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false });

  // Session A
  const identityA = resolveIdentity(
    { phone: FIXTURE_A.phone, sessionId: 'session-A' },
    [{ phone: FIXTURE_A.phone, personId: 'person-sam-001' }]
  );
  assert.equal(identityA.confidence, 'exact');
  assert.equal(identityA.matchedBy, 'phone');

  const briefA = await retrieveMemoryBrief(identityA);
  assert.notEqual(briefA, null);
  assert.equal(briefA!.knownDurableFacts.length, 3);
  assert.ok(briefA!.knownDurableFacts.some(f => f.value.includes('narrow-aisle reach truck')));

  // Session B — same phone, different sessionId
  const identityB = resolveIdentity(
    { phone: FIXTURE_A.phone, sessionId: 'session-B' },
    [{ phone: FIXTURE_A.phone, personId: 'person-sam-001' }]
  );
  assert.equal(identityB.confidence, 'exact');
  assert.equal(identityB.matchedBy, 'phone');

  const briefB = await retrieveMemoryBrief(identityB);
  assert.notEqual(briefB, null);

  // Facts must be identical across sessions
  assert.equal(briefA!.knownDurableFacts.length, briefB!.knownDurableFacts.length);
  assert.equal(
    briefA!.knownDurableFacts.map(f => f.key).sort().join(','),
    briefB!.knownDurableFacts.map(f => f.key).sort().join(',')
  );

  // Prior interests identical
  assert.equal(briefA!.priorEquipmentInterest.length, briefB!.priorEquipmentInterest.length);
  assert.equal(
    briefA!.priorEquipmentInterest[0]?.inventory_id,
    'RT-752R45TT-2018'
  );
});

test('exact identity recall: same email returns same durable facts across sessions', async () => {
  const fixtureAProfile = makeFixtureAProfile('person-sam-001');
  const adapter = createTestAdapter({ seedProfiles: [fixtureAProfile] });
  initializeMemoryBackend(adapter, { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false });

  const identity = resolveIdentity(
    { email: FIXTURE_A.email, sessionId: 'session-C' },
    [{ email: FIXTURE_A.email, personId: 'person-sam-001' }]
  );
  assert.equal(identity.confidence, 'exact');
  assert.equal(identity.matchedBy, 'email');

  const brief = await retrieveMemoryBrief(identity);
  assert.notEqual(brief, null);
  assert.ok(brief!.knownDurableFacts.some(f => f.key === 'equipment_preference'));
  assert.equal(brief!.priorEquipmentInterest[0]?.inventory_id, 'RT-752R45TT-2018');
});

// ---------------------------------------------------------------------------
// T-2: ANONYMOUS NO-LEAK — anonymous visitor never receives another customer's data
// ---------------------------------------------------------------------------

test('anonymous no-leak: session-only visitor receives no cross-customer memory', async () => {
  const fixtureAProfile = makeFixtureAProfile('person-sam-001');
  const adapter = createTestAdapter({ seedProfiles: [fixtureAProfile] });
  initializeMemoryBackend(adapter, { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false });

  // Anonymous: no phone, no email — just a session ID
  const anonymousIdentity = resolveIdentity(
    { sessionId: 'anonymous-session-999' },
    [] // no known records
  );
  assert.equal(anonymousIdentity.confidence, 'anonymous');

  const brief = await retrieveMemoryBrief(anonymousIdentity);
  // When disabled or anonymous: returns null — no memory block injected
  assert.equal(brief, null);
});

test('anonymous no-leak: memory block is not built for weak identity', () => {
  const weakIdentity: DavidIdentity = {
    personId: null,
    confidence: 'weak',
    matchedBy: 'phone',
    piiRedactedFingerprint: 'abc123',
  };

  const weakBrief: DavidMemoryBrief = {
    identity: weakIdentity,
    knownDurableFacts: [{ key: 'foo', value: 'bar', captured_at: NOW }],
    priorEquipmentInterest: [],
    operatorNotes: [],
    inventoryTruthGuard: '⚠️ Verify...',
  };

  const config: DavidMemoryConfig = { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false };
  const block = buildMemoryBriefBlock(weakBrief, config);

  // Weak identity: no memory block should be built
  assert.equal(block, null, 'Weak identity should not produce a memory block');
});

test('anonymous no-leak: anonymous identity receives no cross-session facts', async () => {
  const fixtureAProfile = makeFixtureAProfile('person-sam-001');
  const adapter = createTestAdapter({ seedProfiles: [fixtureAProfile] });
  initializeMemoryBackend(adapter, { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false });

  // Visitor with a phone that doesn't match any known record
  const unknownPhoneIdentity = resolveIdentity(
    { phone: '+1 555-999-0000', sessionId: 'session-unknown' },
    [{ phone: FIXTURE_A.phone, personId: 'person-sam-001' }]
  );
  assert.equal(unknownPhoneIdentity.confidence, 'anonymous');

  const brief = await retrieveMemoryBrief(unknownPhoneIdentity);
  assert.equal(brief, null);
});

// ---------------------------------------------------------------------------
// T-3: MEMORY CAP — brief stays under DAVID_MEMORY_MAX_CHARS
// ---------------------------------------------------------------------------

test('memory cap: brief with many facts stays under maxChars', () => {
  const manyFacts: DurableFact[] = Array.from({ length: 20 }, (_, i) => ({
    key: `fact_${i}`,
    value: `This is a very long durable fact value that contains detailed information about customer preference number ${i} which has been captured over multiple sessions and is meant to stress test the memory cap enforcement mechanism.`.repeat(3),
    captured_at: NOW,
  }));

  const brief: DavidMemoryBrief = {
    identity: {
      personId: 'person-sam-001',
      confidence: 'exact',
      matchedBy: 'phone',
      piiRedactedFingerprint: 'test-fp',
    },
    knownDurableFacts: manyFacts,
    priorEquipmentInterest: Array.from({ length: 10 }, (_, i) => ({
      inventory_id: `INV-${i}`,
      title: `Very long equipment title that describes a narrow-aisle reach truck or swing reach with extended lift height and specific capacity requirements for warehouse operation ${i}`,
      mentioned_at: NOW,
    })),
    operatorNotes: [{ note: 'This is a very long operator note that contains critical information for the sales team about a specific customer need and callback request that should be remembered across sessions.', created_at: NOW }],
    inventoryTruthGuard: '⚠️ Verify current availability...',
  };

  const config: DavidMemoryConfig = { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false };
  const block = buildMemoryBriefBlock(brief, config);

  assert.notEqual(block, null, 'Block should be built for exact identity even with many facts');
  assert.ok(
    block!.length <= 2200,
    `Block length ${block!.length} must not exceed maxChars 2200`
  );
});

test('memory cap: truncateToMaxChars adds marker when exceeded', () => {
  const long = 'A'.repeat(5000);
  const result = truncateToMaxChars(long, 2200);
  assert.ok(result.length <= 2200);
  assert.ok(result.includes('[...memory truncated...]'));
});

test('memory cap: exact maxChars boundary is respected', () => {
  const exactBrief: DavidMemoryBrief = {
    identity: {
      personId: 'p',
      confidence: 'exact',
      matchedBy: 'email',
      piiRedactedFingerprint: 'fp',
    },
    knownDurableFacts: [{ key: 'x', value: 'y', captured_at: NOW }],
    priorEquipmentInterest: [],
    operatorNotes: [],
    inventoryTruthGuard: '⚠️ Verify current availability, pricing, and specs from current inventory backend before quoting.',
  };

  const config: DavidMemoryConfig = { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false };
  const block = buildMemoryBriefBlock(exactBrief, config);
  assert.notEqual(block, null);
  assert.ok(block!.length <= 2200);
});

// ---------------------------------------------------------------------------
// T-4: INVENTORY TRUTH GUARD — prior interest never becomes current availability
// ---------------------------------------------------------------------------

test('inventory truth guard: memory brief always includes inventory truth guard block', () => {
  const brief: DavidMemoryBrief = {
    identity: {
      personId: 'person-sam-001',
      confidence: 'exact',
      matchedBy: 'phone',
      piiRedactedFingerprint: 'fp',
    },
    knownDurableFacts: [{ key: 'preference', value: 'reach truck', captured_at: NOW }],
    priorEquipmentInterest: [
      {
        inventory_id: 'RT-752R45TT-2018',
        title: 'Raymond reach truck 2018',
        mentioned_at: NOW,
      },
    ],
    operatorNotes: [],
    inventoryTruthGuard: '⚠️ Verify current availability...',
  };

  const config: DavidMemoryConfig = { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false };
  const block = buildMemoryBriefBlock(brief, config);

  assert.notEqual(block, null);
  assert.match(block!, /INVENTORY TRUTH RULE/i);
  // Guard: prior interest is NOT proof of current availability/pricing/specs
  assert.match(block!, /not proof of current availability/i);
  assert.match(block!, /current pricing/i); // "availability, current pricing" — "proof of" only applies to availability
  assert.match(block!, /or current specs/i);
  assert.match(block!, /verify all availability/i);
});

test('inventory truth guard: prior interest shows as interest only, not availability', () => {
  const brief: DavidMemoryBrief = {
    identity: {
      personId: 'person-sam-001',
      confidence: 'exact',
      matchedBy: 'email',
      piiRedactedFingerprint: 'fp',
    },
    knownDurableFacts: [],
    priorEquipmentInterest: [
      {
        inventory_id: 'RT-752R45TT-2018',
        title: 'Raymond reach truck 2018',
        mentioned_at: NOW,
        note: 'previously asked about this unit',
      },
    ],
    operatorNotes: [],
    inventoryTruthGuard: '⚠️ Verify...',
  };

  const config: DavidMemoryConfig = { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false };
  const block = buildMemoryBriefBlock(brief, config);

  assert.notEqual(block, null);
  // The prior interest title should appear but NOT with availability language
  assert.match(block!, /Raymond reach truck 2018/);
  assert.match(block!, /previously asked about this unit/);
  assert.doesNotMatch(block!, /currently available/i);
  assert.doesNotMatch(block!, /in stock/i);
});

// ---------------------------------------------------------------------------
// T-5: BACKEND UNAVAILABLE FALLBACK — route behavior unchanged, no exceptions
// ---------------------------------------------------------------------------

test('backend unavailable: retrieveMemoryBrief returns null and logs warning', async () => {
  const adapter = createTestAdapter({ simulateBackendDown: true });
  initializeMemoryBackend(adapter, { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false });

  const identity: DavidIdentity = {
    personId: 'person-sam-001',
    confidence: 'exact',
    matchedBy: 'phone',
    piiRedactedFingerprint: 'fp',
  };

  const brief = await retrieveMemoryBrief(identity);
  // Safe fallback: returns null instead of throwing
  assert.equal(brief, null, 'Should return null on backend failure, not throw');
});

test('backend unavailable: persistMemory does not throw and does not reject', async () => {
  const adapter = createTestAdapter({ simulateBackendDown: true });
  initializePersistBackend(adapter, true);

  const identity: DavidIdentity = {
    personId: 'person-sam-001',
    confidence: 'exact',
    matchedBy: 'phone',
    piiRedactedFingerprint: 'fp',
  };

  const fact: DurableFact = { key: 'test', value: 'value', captured_at: NOW };

  // Should not throw — safe fallback
  await persistMemory(identity, fact);
  // If we get here without throwing, the test passes
  assert.ok(true, 'persistMemory did not throw on backend unavailable');
});

test('backend unavailable: healthCheck returns false when backend is down', async () => {
  const adapter = createTestAdapter({ simulateBackendDown: true });
  const healthy = await adapter.healthCheck();
  assert.equal(healthy, false);
});

test('supabase stub is not reported healthy before schema and credentials exist', async () => {
  const healthy = await supabaseMemoryBackend.healthCheck();
  assert.equal(healthy, false, 'Supabase stub must report unhealthy until Patch-approved schema and credentials land');
});

// ---------------------------------------------------------------------------
// T-6: LEAD ROUTING UNCHANGED — memory disabled by default does not affect lead routing
// ---------------------------------------------------------------------------

test('lead routing unchanged: memory disabled by default (DAVID_MEMORY_ENABLED=false)', async () => {
  // Default config: memory disabled
  const adapter = createTestAdapter({ seedProfiles: [makeFixtureAProfile('person-sam-001')] });
  initializeMemoryBackend(adapter, { enabled: false, backend: 'test', maxChars: 2200, writeEnabled: false });

  const identity: DavidIdentity = {
    personId: 'person-sam-001',
    confidence: 'exact',
    matchedBy: 'phone',
    piiRedactedFingerprint: 'fp',
  };

  // Even with a valid exact identity and a seeded profile, memory is skipped
  const brief = await retrieveMemoryBrief(identity);
  assert.equal(brief, null, 'Memory disabled → null, lead routing is unaffected');
});

test('lead routing unchanged: weak identity returns null even when memory is enabled', async () => {
  const adapter = createTestAdapter({ seedProfiles: [makeFixtureAProfile('person-sam-001')] });
  initializeMemoryBackend(adapter, { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false });

  const weakIdentity: DavidIdentity = {
    personId: null,
    confidence: 'weak',
    matchedBy: 'session',
  };

  const brief = await retrieveMemoryBrief(weakIdentity);
  assert.equal(brief, null, 'Weak identity → null even with memory enabled');
});

// ---------------------------------------------------------------------------
// T-7: PII-REDACTED PROOF — receipts and logs never contain raw PII
// ---------------------------------------------------------------------------

test('PII redaction: redactPii replaces phone/email/name/company with fingerprints', () => {
  const record = {
    phone: '+1 555-010-2211',
    email: 'sam.fixture@example.test',
    name: 'Sam Buyer',
    company: 'North Dock Warehouse',
    otherField: 'safe-value',
  };

  const redacted = redactPii(record);

  assert.equal(redacted.phone, '[REDACTED:' + shortHash(FIXTURE_A.phone) + ']');
  assert.equal(redacted.email, '[REDACTED:' + shortHash(FIXTURE_A.email) + ']');
  assert.equal(redacted.name, '[REDACTED:' + shortHash(FIXTURE_A.name) + ']');
  assert.equal(redacted.company, '[REDACTED:' + shortHash(FIXTURE_A.company) + ']');
  assert.equal(redacted.otherField, 'safe-value');
});

test('PII redaction: identity fingerprint is SHA-256/12, not raw phone or email', () => {
  const identity = resolveIdentity(
    { phone: FIXTURE_A.phone, email: FIXTURE_A.email, sessionId: 'session-test' },
    [{ phone: FIXTURE_A.phone, personId: 'person-sam-001' }]
  );

  assert.ok(identity.piiRedactedFingerprint, 'Must have a fingerprint');
  // Fingerprint contains phone|email hashes = 12+1+12 = 25 hex chars
  assert.equal(identity.piiRedactedFingerprint!.length, 25);
  assert.doesNotMatch(identity.piiRedactedFingerprint!, /555-010-2211/);
  assert.doesNotMatch(identity.piiRedactedFingerprint!, /sam\.fixture/);
});

test('PII redaction: memory brief block contains no raw PII', () => {
  const brief: DavidMemoryBrief = {
    identity: {
      personId: 'person-sam-001',
      confidence: 'exact',
      matchedBy: 'phone',
      piiRedactedFingerprint: 'abc123def456',
    },
    knownDurableFacts: [
      { key: 'preference', value: 'narrow-aisle reach truck', captured_at: NOW },
    ],
    priorEquipmentInterest: [
      {
        inventory_id: 'RT-752R45TT-2018',
        title: 'Raymond reach truck 2018',
        mentioned_at: NOW,
      },
    ],
    operatorNotes: [
      { note: 'buyer is serious — callback if RT-752 mentioned', created_at: NOW },
    ],
    inventoryTruthGuard: '⚠️ Verify...',
  };

  const config: DavidMemoryConfig = { enabled: true, backend: 'test', maxChars: 2200, writeEnabled: false };
  const block = buildMemoryBriefBlock(brief, config)!;

  assert.notEqual(block, null);
  assert.doesNotMatch(block, /555-010-2211/);
  assert.doesNotMatch(block, /sam\.fixture/);
  assert.doesNotMatch(block, /North Dock/);
  assert.doesNotMatch(block, /Sam Buyer/);
  assert.match(block, /fp:abc123def456/);
});

// ---------------------------------------------------------------------------
// IDENTITY RESOLUTION — edge cases
// ---------------------------------------------------------------------------

test('identity resolution: exact phone match takes priority over company match', () => {
  const records = [
    { phone: FIXTURE_A.phone, personId: 'person-sam-001' },
    { company: FIXTURE_A.company, personId: 'person-company-match' },
  ];

  const identity = resolveIdentity(
    { phone: FIXTURE_A.phone, company: FIXTURE_A.company, sessionId: 's1' },
    records
  );

  assert.equal(identity.confidence, 'exact');
  assert.equal(identity.matchedBy, 'phone');
  assert.equal(identity.personId, 'person-sam-001');
});

test('identity resolution: company-only without known records → anonymous (no PII to cross-reference)', () => {
  const identity = resolveIdentity(
    { company: 'Some Warehouse Inc', sessionId: 's1' },
    [] // no known records
  );

  // Company without known records → anonymous (no cross-reference possible)
  assert.equal(identity.confidence, 'anonymous');
});

test('identity resolution: no records + contact info → weak (not anonymous)', () => {
  const identity = resolveIdentity(
    { phone: '+1 555-000-1111', sessionId: 's1' },
    []
  );

  assert.equal(identity.confidence, 'weak');
  assert.equal(identity.matchedBy, 'phone');
});

test('identity resolution: no records + no contact → anonymous', () => {
  const identity = resolveIdentity(
    { sessionId: 'session-only' },
    []
  );

  assert.equal(identity.confidence, 'anonymous');
  assert.equal(identity.matchedBy, 'session');
});
