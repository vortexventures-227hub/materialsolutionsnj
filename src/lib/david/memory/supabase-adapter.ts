/**
 * David Memory — Supabase Adapter (stub)
 *
 * This is the scaffolding for the Supabase-backed memory driver.
 * The actual implementation is deferred until:
 *   1. Chrome lane files tests for the full contract
 *   2. Patch approves the schema
 *   3. DAVID_MEMORY_WRITE_ENABLED=true in the target environment
 *
 * Current behaviour: healthCheck returns false, retrieve/persist are no-ops.
 * This allows the rest of the scaffold to compile and exercise the full code path
 * in test mode while the production adapter is completed separately.
 *
 * Required env vars (for production use):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (reads)
 *   SUPABASE_SERVICE_ROLE_KEY      (writes — server-side only)
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
// Schema hint (for Patch / Chrome lane)
//
// CREATE TABLE david_memory (
//   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   identity_key  TEXT NOT NULL,   -- 'person:{id}' or 'session:{fingerprint}'
//   fact          TEXT NOT NULL,
//   category      TEXT NOT NULL CHECK (category IN (
//                    'durable_fact','equipment_interest','operator_note','preference')),
//   inventory_ref TEXT,            -- id/slug/title reference only — no price/specs
//   source        TEXT DEFAULT 'chat',
//   created_at    TIMESTAMPTZ DEFAULT now(),
//   updated_at    TIMESTAMPTZ DEFAULT now()
// );
//
// CREATE INDEX ON david_memory(identity_key);
// -- RLS: users can only read/write rows where identity_key matches their own
// -- derived from piiRedactedFingerprint or lead_id in the session cookie.
// ---------------------------------------------------------------------------

function identityKey(identity: DavidIdentity): string {
  return identity.personId
    ? `person:${identity.personId}`
    : `session:${identity.piiRedactedFingerprint ?? 'anon'}`;
}

export const supabaseMemoryBackend: DavidMemoryBackend = {
  async retrieve(identity: DavidIdentity): Promise<DavidMemoryBrief | null> {
    // STUB: returns empty brief — not a throwing error path.
    // Real implementation:
    //   1. SELECT fact, category, inventory_ref, source, created_at
    //      FROM david_memory
    //      WHERE identity_key = $1
    //      ORDER BY updated_at DESC
    //   2. Map rows → DavidMemoryBrief shape
    //   3. Return null on error (never throw)
    console.debug('[DavidMemory/Supabase] retrieve stub — returning null (not implemented)');
    return null;
  },

  async persist(
    identity: DavidIdentity,
    fact: DurableFact | PriorEquipmentInterest | OperatorNote
  ): Promise<void> {
    // STUB: no-op
    // Real implementation:
    //   1. Map fact to row columns
    //   2. INSERT INTO david_memory (identity_key, fact, category, inventory_ref, source)
    //   3. No-op on error (never throw)
    console.debug('[DavidMemory/Supabase] persist stub — no-op (not implemented)');
    void identity;
    void fact;
  },

  async healthCheck(): Promise<boolean> {
    // STUB: report unhealthy until Patch-approved schema and credentials land.
    // The real implementation should flip this only when Supabase reads are implemented.
    return false;
  },
};
