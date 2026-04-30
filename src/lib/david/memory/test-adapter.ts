/**
 * David Memory Test Adapter
 *
 * In-memory implementation of DavidMemoryBackend for unit and integration tests.
 * Mirrors the shape of the real supabase/zep backends without touching production.
 *
 * PII is never stored in plain text — only fingerprints are kept.
 */

import type {
  DavidIdentity,
  DavidMemoryBackend,
  DavidMemoryBrief,
  DurableFact,
  PriorEquipmentInterest,
  OperatorNote,
} from './types';

// ---------------------------------------------------------------------------
// In-memory store keyed by personId
// ---------------------------------------------------------------------------

interface StoredProfile {
  personId: string;
  durableFacts: DurableFact[];
  priorInterests: PriorEquipmentInterest[];
  operatorNotes: OperatorNote[];
  createdAt: string;
}

const _profiles = new Map<string, StoredProfile>();

// ---------------------------------------------------------------------------
// Counter for anonymous session IDs to simulate cross-session retrieval
// ---------------------------------------------------------------------------

const _sessionProfiles = new Map<string, StoredProfile>();

// ---------------------------------------------------------------------------
// Test adapter
// ---------------------------------------------------------------------------

export interface TestAdapterOptions {
  /** If true, healthCheck returns false to simulate backend unavailability */
  simulateBackendDown?: boolean;
  /** Pre-seed profiles into the in-memory store */
  seedProfiles?: StoredProfile[];
  /** Pre-seed session-based profiles */
  seedSessionProfiles?: StoredProfile[];
}

export function createTestAdapter(options: TestAdapterOptions = {}): DavidMemoryBackend {
  const { simulateBackendDown = false, seedProfiles = [], seedSessionProfiles = [] } = options;

  // Seed provided profiles
  for (const p of seedProfiles) {
    _profiles.set(p.personId, { ...p });
  }
  for (const p of seedSessionProfiles) {
    _sessionProfiles.set(p.personId, { ...p });
  }

  return {
    async retrieve(identity: DavidIdentity): Promise<DavidMemoryBrief | null> {
      if (simulateBackendDown) {
        throw new Error('[TestAdapter] Backend unavailable');
      }

      const { personId, confidence, matchedBy, piiRedactedFingerprint } = identity;

      // Anonymous / weak — return minimal brief, no cross-customer data
      if (confidence === 'anonymous' || confidence === 'weak') {
        return {
          identity: { personId: null, confidence: 'anonymous', matchedBy: 'none' },
          knownDurableFacts: [],
          priorEquipmentInterest: [],
          operatorNotes: [],
          inventoryTruthGuard:
            '⚠️ Verify current availability, pricing, and specs from current inventory backend before quoting.',
        };
      }

      // Retrieve by personId or by session-derived key
      const key = personId ?? identity.piiRedactedFingerprint ?? 'unknown';
      const stored = _profiles.get(key) ?? _sessionProfiles.get(key);

      if (!stored) {
        return {
          identity: { personId, confidence, matchedBy, piiRedactedFingerprint },
          knownDurableFacts: [],
          priorEquipmentInterest: [],
          operatorNotes: [],
          inventoryTruthGuard:
            '⚠️ Verify current availability, pricing, and specs from current inventory backend before quoting.',
        };
      }

      return {
        identity: { personId, confidence, matchedBy, piiRedactedFingerprint },
        knownDurableFacts: [...stored.durableFacts],
        priorEquipmentInterest: [...stored.priorInterests],
        operatorNotes: [...stored.operatorNotes],
        inventoryTruthGuard:
          '⚠️ Verify current availability, pricing, and specs from current inventory backend before quoting.',
      };
    },

    async persist(
      identity: DavidIdentity,
      fact: DurableFact | PriorEquipmentInterest | OperatorNote
    ): Promise<void> {
      if (simulateBackendDown) {
        throw new Error('[TestAdapter] Backend unavailable');
      }

      const key = identity.personId ?? identity.piiRedactedFingerprint ?? `anon:${identity.matchedBy}`;
      let profile = _profiles.get(key) ?? _sessionProfiles.get(key);

      if (!profile) {
        profile = {
          personId: key,
          durableFacts: [],
          priorInterests: [],
          operatorNotes: [],
          createdAt: new Date().toISOString(),
        };
        if (identity.personId) {
          _profiles.set(key, profile);
        } else {
          _sessionProfiles.set(key, profile);
        }
      }

      if ('key' in fact) {
        // DurableFact
        profile.durableFacts.push({ ...fact } as DurableFact);
      } else if ('inventory_id' in fact || 'slug' in fact || 'title' in fact) {
        // PriorEquipmentInterest
        profile.priorInterests.push({ ...fact } as PriorEquipmentInterest);
      } else if ('note' in fact) {
        // OperatorNote — only for exact/strong identity
        if (identity.confidence === 'exact' || identity.confidence === 'strong') {
          profile.operatorNotes.push({ ...fact } as OperatorNote);
        }
      }
    },

    async healthCheck(): Promise<boolean> {
      return !simulateBackendDown;
    },
  };
}

/** Reset all in-memory profiles — call in afterEach */
export function resetTestAdapter(): void {
  _profiles.clear();
  _sessionProfiles.clear();
}

/** Build a standard Fixture A profile for testing */
export function makeFixtureAProfile(personId: string) {
  const now = new Date().toISOString();
  return {
    personId,
    durableFacts: [
      { key: 'equipment_preference', value: 'narrow-aisle reach truck', captured_at: now },
      { key: 'lift_height_min', value: '200+ inch lift height', captured_at: now },
      { key: 'budget_topic', value: 'asked whether delivery/charger is included', captured_at: now },
    ] as DurableFact[],
    priorInterests: [
      {
        inventory_id: 'RT-752R45TT-2018',
        slug: 'RT-752R45TT-2018',
        title: 'Raymond reach truck 2018',
        mentioned_at: now,
        note: 'previously asked about this unit',
      },
    ] as PriorEquipmentInterest[],
    operatorNotes: [
      {
        note: 'buyer is serious; Chris wants callback if they mention RT-752 again',
        created_at: now,
        created_by: 'operator',
      },
    ] as OperatorNote[],
    createdAt: now,
  };
}
