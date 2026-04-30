/**
 * David Memory — Supabase Adapter
 *
 * Stores only redacted identity keys/fingerprints and safe durable memory rows.
 * No raw phone/email/name/company values should be passed to or written by this adapter.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '../../db/supabase';
import type {
  DavidIdentity,
  DavidMemoryBackend,
  DavidMemoryBrief,
  DurableFact,
  PriorEquipmentInterest,
  OperatorNote,
} from './types';

const DAVID_MEMORY_TABLE = 'david_memory';
const INVENTORY_TRUTH_GUARD =
  '⚠️ Verify current availability, pricing, and specs from current inventory backend before quoting.';

type DavidMemoryCategory = 'durable_fact' | 'equipment_interest' | 'operator_note' | 'preference';

type JsonObject = Record<string, unknown>;

type DavidMemoryRow = {
  id?: string;
  identity_key?: string;
  pii_fingerprint?: string | null;
  fact?: string | null;
  category?: DavidMemoryCategory | string | null;
  inventory_ref?: JsonObject | null;
  source?: string | null;
  metadata?: JsonObject | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DavidMemoryInsert = {
  identity_key: string;
  pii_fingerprint?: string | null;
  fact: string;
  category: DavidMemoryCategory;
  inventory_ref?: JsonObject | null;
  source: string;
  metadata: JsonObject;
};

type SupabaseMemoryDeps = {
  getClient?: () => SupabaseClient;
};

function identityKey(identity: DavidIdentity): string {
  return identity.personId
    ? `person:${identity.personId}`
    : `session:${identity.piiRedactedFingerprint ?? 'anon'}`;
}

function baseBrief(identity: DavidIdentity): DavidMemoryBrief {
  return {
    identity: { ...identity },
    knownDurableFacts: [],
    priorEquipmentInterest: [],
    operatorNotes: [],
    inventoryTruthGuard: INVENTORY_TRUTH_GUARD,
  };
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function sanitizeInventoryRef(input: PriorEquipmentInterest | JsonObject | null | undefined): JsonObject | null {
  if (!input) {
    return null;
  }

  const source = input as Record<string, unknown>;
  const sanitized: JsonObject = {};
  const id = stringFrom(source.inventory_id) ?? stringFrom(source.id);
  const slug = stringFrom(source.slug);
  const title = stringFrom(source.title);

  if (id) sanitized.id = id;
  if (slug) sanitized.slug = slug;
  if (title) sanitized.title = title;

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function isDurableFact(fact: DurableFact | PriorEquipmentInterest | OperatorNote): fact is DurableFact {
  return 'key' in fact && 'value' in fact && 'captured_at' in fact;
}

function isEquipmentInterest(
  fact: DurableFact | PriorEquipmentInterest | OperatorNote
): fact is PriorEquipmentInterest {
  return 'mentioned_at' in fact || 'inventory_id' in fact || 'slug' in fact || 'title' in fact;
}

function canPersistIdentity(identity: DavidIdentity): boolean {
  return identity.confidence !== 'anonymous' && identity.confidence !== 'weak';
}

function mapFactToInsert(
  identity: DavidIdentity,
  fact: DurableFact | PriorEquipmentInterest | OperatorNote
): DavidMemoryInsert {
  const base = {
    identity_key: identityKey(identity),
    pii_fingerprint: identity.piiRedactedFingerprint ?? null,
    source: 'chat',
  };

  if (isDurableFact(fact)) {
    return {
      ...base,
      category: 'durable_fact',
      fact: fact.value,
      inventory_ref: null,
      metadata: {
        key: fact.key,
        captured_at: fact.captured_at,
      },
    };
  }

  if (isEquipmentInterest(fact)) {
    const inventoryRef = sanitizeInventoryRef(fact);
    return {
      ...base,
      category: 'equipment_interest',
      fact: fact.note ?? fact.title ?? fact.slug ?? fact.inventory_id ?? 'Prior equipment interest',
      inventory_ref: inventoryRef,
      metadata: {
        mentioned_at: fact.mentioned_at,
        ...(fact.note ? { note: fact.note } : {}),
      },
    };
  }

  return {
    ...base,
    category: 'operator_note',
    fact: fact.note,
    inventory_ref: null,
    metadata: {
      created_at: fact.created_at,
      ...(fact.created_by ? { created_by: fact.created_by } : {}),
    },
  };
}

function mapRowIntoBrief(brief: DavidMemoryBrief, row: DavidMemoryRow): void {
  const factText = stringFrom(row.fact);
  const metadata = row.metadata ?? {};

  if (!factText) {
    return;
  }

  switch (row.category) {
    case 'durable_fact':
    case 'preference': {
      const key = stringFrom(metadata.key) ?? (row.category === 'preference' ? 'preference' : 'fact');
      const capturedAt = stringFrom(metadata.captured_at) ?? row.created_at ?? row.updated_at;
      brief.knownDurableFacts.push({
        key,
        value: factText,
        captured_at: capturedAt ?? new Date(0).toISOString(),
      });
      break;
    }
    case 'equipment_interest': {
      const inventoryRef = sanitizeInventoryRef(row.inventory_ref);
      brief.priorEquipmentInterest.push({
        ...(inventoryRef?.id ? { inventory_id: String(inventoryRef.id) } : {}),
        ...(inventoryRef?.slug ? { slug: String(inventoryRef.slug) } : {}),
        ...(inventoryRef?.title ? { title: String(inventoryRef.title) } : {}),
        mentioned_at: stringFrom(metadata.mentioned_at) ?? row.created_at ?? row.updated_at ?? new Date(0).toISOString(),
        note: stringFrom(metadata.note) ?? factText,
      });
      break;
    }
    case 'operator_note': {
      brief.operatorNotes.push({
        note: factText,
        created_at: stringFrom(metadata.created_at) ?? row.created_at ?? row.updated_at ?? new Date(0).toISOString(),
        ...(stringFrom(metadata.created_by) ? { created_by: stringFrom(metadata.created_by) } : {}),
      });
      break;
    }
    default:
      break;
  }
}

export function createSupabaseMemoryBackend(deps: SupabaseMemoryDeps = {}): DavidMemoryBackend {
  const getClient = deps.getClient ?? getSupabaseAdmin;

  return {
    async retrieve(identity: DavidIdentity): Promise<DavidMemoryBrief | null> {
      try {
        const client = getClient();
        const { data, error } = await client
          .from(DAVID_MEMORY_TABLE)
          .select('fact, category, inventory_ref, source, metadata, created_at, updated_at')
          .eq('identity_key', identityKey(identity))
          .order('updated_at', { ascending: false });

        if (error) {
          return null;
        }

        const brief = baseBrief(identity);
        for (const row of (data ?? []) as DavidMemoryRow[]) {
          mapRowIntoBrief(brief, row);
        }
        return brief;
      } catch {
        return null;
      }
    },

    async persist(
      identity: DavidIdentity,
      fact: DurableFact | PriorEquipmentInterest | OperatorNote
    ): Promise<void> {
      if (!canPersistIdentity(identity)) {
        return;
      }

      try {
        const payload = mapFactToInsert(identity, fact);
        const client = getClient();
        await client.from(DAVID_MEMORY_TABLE).insert(payload);
      } catch {
        // Safe fallback: persistence is best-effort and must not affect chat flow.
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        const client = getClient();
        const { error } = await client.from(DAVID_MEMORY_TABLE).select('id').limit(1);
        return !error;
      } catch {
        return false;
      }
    },
  };
}

export const supabaseMemoryBackend: DavidMemoryBackend = createSupabaseMemoryBackend();
