/**
 * David Identity Resolution
 *
 * Determines who the visitor is based on contact info extracted from the
 * current message and/or session. Produces a DavidIdentity with confidence level
 * and a redacted fingerprint for receipts/logs.
 */

import { createHash } from 'node:crypto';
import type {
  DavidIdentity,
  IdentityConfidence,
  IdentityMatchedBy,
} from './types';

/** Raw contact signals from the current conversation turn */
export interface ContactSignals {
  phone?: string;
  email?: string;
  name?: string;
  company?: string;
  sessionId: string;
  leadId?: string;
}

/** Normalize a phone number to E.164-ish key string */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '').replace(/^1(.+)/, '$1');
}

/** SHA-256 first 12 chars of a value */
export function shortHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

/** Build a redacted fingerprint for a contact signal pair */
export function buildPiiFingerprint(
  signals: ContactSignals
): string | undefined {
  const parts: string[] = [];
  if (signals.phone) parts.push(shortHash(normalizePhone(signals.phone)));
  if (signals.email) parts.push(shortHash(signals.email.toLowerCase()));
  if (signals.company) parts.push(shortHash(signals.company.toLowerCase()));
  return parts.length ? parts.join('|') : undefined;
}

/**
 * Resolve the identity of a visitor from contact signals.
 *
 * Confidence tiers:
 * - exact  : phone OR email matched a known record
 * - strong : company_name matched AND (phone OR email present)
 * - weak   : session-only OR company-only with no contact
 * - anonymous: nothing usable
 */
export function resolveIdentity(
  signals: ContactSignals,
  knownRecords?: Array<{
    phone?: string;
    email?: string;
    company?: string;
    personId: string;
  }>
): DavidIdentity {
  if (!knownRecords || knownRecords.length === 0) {
    // No records — session-only visitor
    if (signals.phone || signals.email) {
      return {
        personId: null,
        confidence: 'weak',
        matchedBy: signals.phone ? 'phone' : 'email',
        piiRedactedFingerprint: buildPiiFingerprint(signals),
      };
    }
    return {
      personId: null,
      confidence: 'anonymous',
      matchedBy: 'session',
    };
  }

  const normPhone = signals.phone ? normalizePhone(signals.phone) : null;
  const normEmail = signals.email ? signals.email.toLowerCase() : null;
  const normCompany = signals.company ? signals.company.toLowerCase() : null;

  // Try exact match first
  for (const rec of knownRecords) {
    const recPhone = rec.phone ? normalizePhone(rec.phone) : null;
    const recEmail = rec.email?.toLowerCase() ?? null;

    if (normPhone && recPhone && normPhone === recPhone) {
      return {
        personId: rec.personId,
        confidence: 'exact',
        matchedBy: 'phone',
        piiRedactedFingerprint: buildPiiFingerprint(signals),
      };
    }
    if (normEmail && recEmail && normEmail === recEmail) {
      return {
        personId: rec.personId,
        confidence: 'exact',
        matchedBy: 'email',
        piiRedactedFingerprint: buildPiiFingerprint(signals),
      };
    }
  }

  // Strong match: company name + (phone or email)
  if (normCompany) {
    for (const rec of knownRecords) {
      const recCompany = rec.company?.toLowerCase() ?? null;
      if (recCompany === normCompany && (normPhone || normEmail)) {
        return {
          personId: rec.personId,
          confidence: 'strong',
          matchedBy: 'company_name',
          piiRedactedFingerprint: buildPiiFingerprint(signals),
        };
      }
    }
  }

  // Weak: lead_id match
  if (signals.leadId) {
    return {
      personId: signals.leadId,
      confidence: 'weak',
      matchedBy: 'lead_id',
      piiRedactedFingerprint: buildPiiFingerprint(signals),
    };
  }

  // Fallback: session-only
  return {
    personId: null,
    confidence: 'anonymous',
    matchedBy: 'none',
    piiRedactedFingerprint: buildPiiFingerprint(signals),
  };
}

/** Redact raw PII from an object for safe logging/receipts */
export function redactPii(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['phone', 'email', 'name', 'company'];
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      sensitive.includes(k) && typeof v === 'string'
        ? `[REDACTED:${shortHash(v)}]`
        : v,
    ])
  );
}
