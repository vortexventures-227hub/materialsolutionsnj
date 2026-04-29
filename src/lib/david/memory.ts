import { getDavidMemoryConfig } from './memory/types';
import { initializeMemoryBackend } from './memory/retrieve';
import { initializePersistBackend } from './memory/persist';
import { createTestAdapter } from './memory/test-adapter';
import { supabaseMemoryBackend } from './memory/supabase-adapter';
import { zepMemoryBackend } from './memory/zep-adapter';

/**
 * David Memory — Public Facade
 *
 * Replaces the old Zep Cloud stub with the new identity-first memory scaffold.
 *
 * Feature flags (all default to safe/off):
 *   DAVID_MEMORY_ENABLED=true          — enables retrieval + injection (default: false)
 *   DAVID_MEMORY_WRITE_ENABLED=true    — enables writes to memory store (default: false)
 *   DAVID_MEMORY_BACKEND=test|supabase|zep  — which backend driver (default: test)
 *   DAVID_MEMORY_MAX_CHARS=2200        — server-side prompt cap (default: 2200)
 *
 * Hard stops:
 * - No PII stored raw — only SHA256-first-12 fingerprints
 * - Anonymous/weak identity → no memory injection, no writes
 * - Inventory refs are id/slug/title only — no price/availability/specs
 * - Lead routing unchanged when memory is disabled or unavailable
 * - Safe fallback on any error (never throws)
 */

export type {
  DavidIdentity,
  IdentityConfidence,
  IdentityMatchedBy,
  DurableFact,
  PriorEquipmentInterest,
  OperatorNote,
  DavidMemoryBrief,
  DavidMemoryConfig,
  DavidMemoryBackend,
} from './memory/types';

export { getDavidMemoryConfig } from './memory/types';

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------
export {
  resolveIdentity,
  buildPiiFingerprint,
  redactPii,
  shortHash,
  normalizePhone,
} from './memory/identity';
export type { ContactSignals } from './memory/identity';

// ---------------------------------------------------------------------------
// Retrieve
// ---------------------------------------------------------------------------
export {
  retrieveMemoryBrief,
  initializeMemoryBackend,
  isMemoryEnabled,
  getMemoryBackendName,
} from './memory/retrieve';

// ---------------------------------------------------------------------------
// Persist
// ---------------------------------------------------------------------------
export { persistMemory, initializePersistBackend } from './memory/persist';

// ---------------------------------------------------------------------------
// Brief
// ---------------------------------------------------------------------------
export { buildMemoryBriefBlock, truncateToMaxChars } from './memory/brief';

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------
export { createTestAdapter, resetTestAdapter, makeFixtureAProfile } from './memory/test-adapter';
export type { TestAdapterOptions } from './memory/test-adapter';

// ---------------------------------------------------------------------------
// Runtime initialization
// ---------------------------------------------------------------------------
let configuredMemoryBackendSignature: string | null = null;

function selectConfiguredMemoryBackend(backendName: ReturnType<typeof getDavidMemoryConfig>['backend']) {
  if (backendName === 'supabase') return supabaseMemoryBackend;
  if (backendName === 'zep') return zepMemoryBackend;
  return createTestAdapter();
}

export function configureDavidMemoryBackendFromEnv(): void {
  const config = getDavidMemoryConfig();
  const signature = `${config.enabled}:${config.backend}:${config.maxChars}:${config.writeEnabled}`;
  if (configuredMemoryBackendSignature === signature) return;

  const backend = selectConfiguredMemoryBackend(config.backend);
  initializeMemoryBackend(backend, config);
  initializePersistBackend(backend, config.writeEnabled);
  configuredMemoryBackendSignature = signature;
}

// ---------------------------------------------------------------------------
// Backwards-compat shims — old Zep stub API
// ---------------------------------------------------------------------------

/** @deprecated Use resolveIdentity + retrieveMemoryBrief + buildMemoryBriefBlock instead */
export async function getMemory(_sessionId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  // Old Zep stub returned [] when unconfigured.
  // New scaffold: returns [] when disabled or no identity.
  return [];
}

/** @deprecated Use persistMemory instead */
export async function addMemory(
  _sessionId: string,
  _messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<void> {
  // Old Zep stub was a no-op when unconfigured.
  // New scaffold: guarded by DAVID_MEMORY_WRITE_ENABLED + identity confidence.
  return;
}

/** @deprecated Use retrieveMemoryBrief with DavidIdentity instead */
export async function searchMemory(_sessionId: string, _query: string): Promise<string[]> {
  // Old Zep stub returned [] when unconfigured.
  return [];
}
