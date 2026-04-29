/**
 * David Memory — Zep Cloud Adapter (stub)
 *
 * Zep Cloud is the originally intended long-term memory backend.
 * The old src/lib/david/memory.ts was a Zep stub returning empty arrays.
 * This module replaces that with a proper DavidMemoryBackend adapter.
 *
 * Required env vars:
 *   ZEP_API_KEY   — Zep Cloud API key
 *
 * STUB BEHAVIOUR: healthCheck returns false so the memory lane stays silent
 * until a real Zep implementation is wired up.
 */

import type {
  DavidIdentity,
  DavidMemoryBackend,
  DavidMemoryBrief,
  DurableFact,
  PriorEquipmentInterest,
  OperatorNote,
} from './types';

export const zepMemoryBackend: DavidMemoryBackend = {
  async retrieve(identity: DavidIdentity): Promise<DavidMemoryBrief | null> {
    // STUB: returns null — safe no-op path.
    // Real implementation:
    //   1. Derive Zep session/user ID from identity.personId or piiRedactedFingerprint
    //   2. Call Zep SDK: client.memory.get(sessionId) or client.thread.get(...)
    //   3. Map Zep memory summaries → DavidMemoryBrief
    //   4. Return null on error (never throw)
    console.debug('[DavidMemory/Zep] retrieve stub — returning null (not implemented)');
    void identity;
    return null;
  },

  async persist(
    identity: DavidIdentity,
    fact: DurableFact | PriorEquipmentInterest | OperatorNote
  ): Promise<void> {
    // STUB: no-op
    // Real implementation:
    //   1. Same ID derivation as retrieve
    //   2. Transform fact to Zep memory format
    //   3. Call Zep SDK: client.memory.add(...) or client.message.add(...)
    //   4. No-op on error (never throw)
    console.debug('[DavidMemory/Zep] persist stub — no-op (not implemented)');
    void identity;
    void fact;
  },

  async healthCheck(): Promise<boolean> {
    // STUB: return false so test driver is used instead.
    // Flip to true + implement retrieve/persist above when Zep credentials are ready.
    return false;
  },
};
