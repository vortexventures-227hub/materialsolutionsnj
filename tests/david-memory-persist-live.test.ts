import assert from 'node:assert/strict';
import test from 'node:test';

import { initializePersistBackend, persistMemory } from '../src/lib/david/memory/persist';
import type {
  DavidIdentity,
  DavidMemoryBackend,
  DavidMemoryBrief,
  DurableFact,
  OperatorNote,
  PriorEquipmentInterest,
} from '../src/lib/david/memory/types';

function identity(confidence: DavidIdentity['confidence']): DavidIdentity {
  return {
    personId: confidence === 'anonymous' ? null : `person-${confidence}`,
    confidence,
    matchedBy: confidence === 'exact' ? 'phone' : confidence === 'strong' ? 'email' : confidence === 'weak' ? 'session' : 'none',
    piiRedactedFingerprint: `fingerprint-${confidence}`,
  };
}

function durableFact(): DurableFact {
  return {
    key: 'contact_submitted',
    value: 'contact submitted via david_chat',
    captured_at: '2026-04-30T00:00:00.000Z',
  };
}

function equipmentInterest(): PriorEquipmentInterest {
  return {
    inventory_id: 'raymond-752r45tt-2018',
    slug: 'raymond-752r45tt-2018',
    title: '2018 Raymond Reach Truck',
    mentioned_at: '2026-04-30T00:00:00.000Z',
    note: 'inquired about this unit via david_chat',
  };
}

function operatorNote(): OperatorNote {
  return {
    note: 'buyer asked for a call back tomorrow morning',
    created_at: '2026-04-30T00:00:00.000Z',
    created_by: 'david_chat',
  };
}

function recordingBackend(healthy = true): DavidMemoryBackend & { persisted: Array<{ identity: DavidIdentity; fact: DurableFact | PriorEquipmentInterest | OperatorNote }> } {
  return {
    persisted: [],
    async retrieve(_identity: DavidIdentity): Promise<DavidMemoryBrief | null> {
      return null;
    },
    async persist(identityArg, fact): Promise<void> {
      this.persisted.push({ identity: identityArg, fact });
    },
    async healthCheck(): Promise<boolean> {
      return healthy;
    },
  };
}

test('persistMemory is a no-op when writeEnabled is false', async () => {
  const backend = recordingBackend();
  initializePersistBackend(backend, false);

  await persistMemory(identity('exact'), durableFact());

  assert.equal(backend.persisted.length, 0);
});

test('persistMemory rejects weak and anonymous durable facts before backend persist', async () => {
  const backend = recordingBackend();
  initializePersistBackend(backend, true);

  await persistMemory(identity('weak'), durableFact());
  await persistMemory(identity('anonymous'), durableFact());

  assert.equal(backend.persisted.length, 0);
});

test('persistMemory rejects weak and anonymous equipment interests before backend persist', async () => {
  const backend = recordingBackend();
  initializePersistBackend(backend, true);

  await persistMemory(identity('weak'), equipmentInterest());
  await persistMemory(identity('anonymous'), equipmentInterest());

  assert.equal(backend.persisted.length, 0);
});

test('persistMemory rejects weak and anonymous operator notes before backend persist', async () => {
  const backend = recordingBackend();
  initializePersistBackend(backend, true);

  await persistMemory(identity('weak'), operatorNote());
  await persistMemory(identity('anonymous'), operatorNote());

  assert.equal(backend.persisted.length, 0);
});

test('persistMemory allows exact and strong identities when write is enabled and backend is healthy', async () => {
  const backend = recordingBackend();
  initializePersistBackend(backend, true);

  await persistMemory(identity('exact'), durableFact());
  await persistMemory(identity('strong'), equipmentInterest());
  await persistMemory(identity('exact'), operatorNote());

  assert.equal(backend.persisted.length, 3);
  assert.deepEqual(backend.persisted.map((entry) => entry.identity.confidence), ['exact', 'strong', 'exact']);
});

test('persistMemory does not throw or write when backend healthCheck fails', async () => {
  const backend = recordingBackend(false);
  initializePersistBackend(backend, true);

  await assert.doesNotReject(() => persistMemory(identity('exact'), durableFact()));

  assert.equal(backend.persisted.length, 0);
});
