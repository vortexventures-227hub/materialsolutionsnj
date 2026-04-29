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

  // Operator notes only for exact/strong
  if ('note' in fact && (identity.confidence !== 'exact' && identity.confidence !== 'strong')) {
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
