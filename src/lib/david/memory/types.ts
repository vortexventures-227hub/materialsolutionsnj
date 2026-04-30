/**
 * David Memory Types — aligned with TEAM_OPERATING_GUIDANCE.md contract
 */

/** How confident we are about who the visitor is */
export type IdentityConfidence = 'exact' | 'strong' | 'weak' | 'anonymous';

/** What signal was used to match the identity */
export type IdentityMatchedBy = 'phone' | 'email' | 'lead_id' | 'company_name' | 'session' | 'none';

/** Caller-provided identity for a David chat visitor */
export interface DavidIdentity {
  personId: string | null;
  confidence: IdentityConfidence;
  matchedBy: IdentityMatchedBy;
  /** SHA-12 of raw PII; used in receipts/logs to avoid storing raw PII */
  piiRedactedFingerprint?: string;
}

/** Durable fact captured about a customer */
export interface DurableFact {
  key: string;
  value: string;
  captured_at: string;
}

/** Prior equipment interest record — inventory ids/slugs/titles only, NOT availability */
export interface PriorEquipmentInterest {
  inventory_id?: string;
  slug?: string;
  title?: string;
  mentioned_at: string;
  note?: string;
}

/** Operator note — for exact/strong identity matches only */
export interface OperatorNote {
  note: string;
  created_at: string;
  created_by?: string;
}

/** What gets injected into the David chat prompt */
export interface DavidMemoryBrief {
  identity: DavidIdentity;
  knownDurableFacts: DurableFact[];
  priorEquipmentInterest: PriorEquipmentInterest[];
  operatorNotes: OperatorNote[];
  /** Always appended to prevent prior interest becoming current truth */
  inventoryTruthGuard: string;
}

/** Feature flag config for David memory */
export interface DavidMemoryConfig {
  enabled: boolean;
  backend: 'test' | 'supabase' | 'zep';
  maxChars: number;
  writeEnabled: boolean;
}

/** Memory backend interface — implemented by test-adapter, supabase, zep */
export interface DavidMemoryBackend {
  /** Retrieve memory for an identified visitor */
  retrieve(identity: DavidIdentity): Promise<DavidMemoryBrief | null>;

  /** Persist a new fact or interest for a visitor */
  persist(
    identity: DavidIdentity,
    fact: DurableFact | PriorEquipmentInterest | OperatorNote
  ): Promise<void>;

  /** Check backend health — used for fallback decisions */
  healthCheck(): Promise<boolean>;
}

/** Parse feature flags from environment */
export function getDavidMemoryConfig(): DavidMemoryConfig {
  const enabled = process.env.DAVID_MEMORY_ENABLED === 'true';
  const backend = (process.env.DAVID_MEMORY_BACKEND as DavidMemoryConfig['backend']) ?? 'test';
  const maxChars = parseInt(process.env.DAVID_MEMORY_MAX_CHARS ?? '2200', 10);
  const writeEnabled = process.env.DAVID_MEMORY_WRITE_ENABLED === 'true';
  return { enabled, backend, maxChars, writeEnabled };
}
