/**
 * David Memory Brief Builder
 *
 * Assembles the ## DAVID MEMORY CONTEXT block injected into the system prompt.
 * Enforces max char cap, inventory truth guard, and PII redaction.
 */

import type {
  DavidIdentity,
  DavidMemoryBrief,
  DavidMemoryConfig,
} from './types';

const DEFAULT_MAX_CHARS = 2200;

const INVENTORY_TRUTH_GUARD_BLOCK = `
⚠️ IMPORTANT — INVENTORY TRUTH RULE:
Equipment listed in "Prior equipment interest" below was mentioned by the customer in a previous session.
It is NOT proof of current availability, current pricing, or current specs.
You MUST verify all availability, pricing, and specs from the current inventory backend
before making any claim to the customer.
`.trim();

/**
 * Build the ## DAVID MEMORY CONTEXT markdown block for injection into the system prompt.
 * Returns null when identity is anonymous/weak — no cross-customer data must leak.
 */
export function buildMemoryBriefBlock(
  brief: DavidMemoryBrief | null,
  config: DavidMemoryConfig
): string | null {
  if (!brief) return null;

  const { identity } = brief;

  // Hard stop: never inject memory for anonymous or weak identity
  if (identity.confidence === 'anonymous' || identity.confidence === 'weak') {
    return null;
  }

  const maxChars = config.maxChars ?? DEFAULT_MAX_CHARS;

  const lines: string[] = [];

  lines.push('## DAVID MEMORY CONTEXT');

  // Identity line — PII-redacted fingerprint only
  const fp = identity.piiRedactedFingerprint
    ? ` fp:${identity.piiRedactedFingerprint}`
    : '';
  lines.push(
    `Identity: ${identity.confidence} | ${identity.matchedBy}${fp}`
  );

  // Durable facts
  if (brief.knownDurableFacts.length > 0) {
    lines.push('Known durable facts:');
    for (const fact of brief.knownDurableFacts) {
      lines.push(`- ${fact.key}: ${fact.value}`);
    }
  }

  // Prior equipment interest
  if (brief.priorEquipmentInterest.length > 0) {
    lines.push('Prior equipment interest:');
    for (const interest of brief.priorEquipmentInterest) {
      const parts: string[] = [];
      if (interest.title) parts.push(interest.title);
      if (interest.slug && !interest.title?.includes(interest.slug)) {
        parts.push(`(${interest.slug})`);
      }
      if (interest.note) parts.push(`— ${interest.note}`);
      lines.push(`- ${parts.join(' ')}`);
    }
  }

  // Operator notes — compact
  if (brief.operatorNotes.length > 0) {
    lines.push('Operator notes:');
    for (const note of brief.operatorNotes) {
      lines.push(`- ${note.note}`);
    }
  }

  // Inventory truth guard — always present when memory is injected.
  const guardSuffix = `\n\n${INVENTORY_TRUTH_GUARD_BLOCK}`;
  const content = lines.join('\n');
  const raw = `${content}${guardSuffix}`;

  // Enforce char cap while preserving the inventory truth guard at the end.
  if (raw.length > maxChars) {
    const marker = '\n[...memory truncated...]';
    if (guardSuffix.length + marker.length > maxChars) {
      return truncateToMaxChars(INVENTORY_TRUTH_GUARD_BLOCK, maxChars);
    }
    const contentBudget = Math.max(0, maxChars - guardSuffix.length - marker.length);
    return `${content.slice(0, contentBudget)}${marker}${guardSuffix}`;
  }

  return raw;
}

/** Truncate a string to maxChars, adding a marker if truncated */
export function truncateToMaxChars(text: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  const marker = '\n[...memory truncated...]';
  if (text.length <= maxChars) return text;
  if (maxChars <= marker.length) return text.slice(0, maxChars);
  return text.slice(0, maxChars - marker.length) + marker;
}
