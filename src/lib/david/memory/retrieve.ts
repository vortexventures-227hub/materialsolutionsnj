/**
 * David Memory Retrieve
 *
 * Retrieves persistent memory for a visitor identity.
 * Returns null when identity is anonymous/weak (no cross-customer data leaks).
 */

import type { DavidIdentity, DavidMemoryBackend, DavidMemoryBrief } from './types';

const FLAG_DEFAULTS = {
  enabled: false,
  backend: 'test' as const,
  maxChars: 2200,
  writeEnabled: false,
};

/** Singleton backend (set by initializeMemoryBackend) */
let _backend: DavidMemoryBackend | null = null;
let _config: { enabled: boolean; backend: string; maxChars: number; writeEnabled: boolean } = FLAG_DEFAULTS;

export function initializeMemoryBackend(
  backend: DavidMemoryBackend,
  config: { enabled: boolean; backend: string; maxChars: number; writeEnabled: boolean }
): void {
  _backend = backend;
  _config = config;
}

export function isMemoryEnabled(): boolean {
  return _config.enabled;
}

export function getMemoryBackendName(): string {
  return _config.backend;
}

/**
 * Retrieve memory brief for an identity.
 *
 * Returns null when:
 * - Memory is disabled (DAVID_MEMORY_ENABLED=false, the default)
 * - Identity confidence is anonymous or weak
 * - Backend healthCheck returns false
 * - Backend throws (safe fallback — never propagates error)
 */
export async function retrieveMemoryBrief(
  identity: DavidIdentity
): Promise<DavidMemoryBrief | null> {
  // Feature flag: disabled by default
  if (!_config.enabled) {
    return null;
  }

  // Anonymous/weak: no cross-customer memory
  if (identity.confidence === 'anonymous' || identity.confidence === 'weak') {
    return null;
  }

  if (!_backend) {
    console.warn('[DavidMemory] Backend not initialized, skipping retrieval');
    return null;
  }

  try {
    const healthy = await _backend.healthCheck();
    if (!healthy) {
      console.warn('[DavidMemory] Backend healthCheck failed, skipping retrieval');
      return null;
    }
    return await _backend.retrieve(identity);
  } catch (err) {
    // Safe fallback — never throw
    console.warn('[DavidMemory] Retrieval failed, skipping:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
