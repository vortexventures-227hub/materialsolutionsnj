/**
 * David Memory Persist
 *
 * Writes durable facts, equipment interests, and operator notes to the memory backend.
 * Write is only attempted when DAVID_MEMORY_WRITE_ENABLED=true.
 */

import type {
  DavidIdentity,
  DavidMemoryBackend,
  DurableFact,
  PriorEquipmentInterest,
  OperatorNote,
} from './types';

let _backend: DavidMemoryBackend | null = null;
let _writeEnabled = false;

export function initializePersistBackend(
  backend: DavidMemoryBackend,
  writeEnabled: boolean
): void {
  _backend = backend;
  _writeEnabled = writeEnabled;
}

type Persistable = DurableFact | PriorEquipmentInterest | OperatorNote;

/**
 * Persist a fact or interest to the memory backend.
 * Silently skips when:
 * - DAVID_MEMORY_WRITE_ENABLED is not 'true'
 * - Identity confidence is anonymous or weak
 * - Backend is unavailable
 */
export async function persistMemory(
  identity: DavidIdentity,
  fact: Persistable
): Promise<void> {
  // Write guard
  if (!_writeEnabled) {
    return;
  }

  // Durable customer memory writes require exact/strong identity for every fact type.
  // Anonymous/weak visitors may not persist durable facts, equipment interests, or operator notes.
  if (identity.confidence === 'anonymous' || identity.confidence === 'weak') {
    return;
  }

  if (!_backend) {
    console.warn('[DavidMemory] Backend not initialized, skipping persist');
    return;
  }

  try {
    const healthy = await _backend.healthCheck();
    if (!healthy) {
      console.warn('[DavidMemory] Backend unhealthy, skipping persist');
      return;
    }
    await _backend.persist(identity, fact);
  } catch (err) {
    // Safe fallback — never throw
    console.warn('[DavidMemory] Persist failed:', err instanceof Error ? err.message : String(err));
  }
}
