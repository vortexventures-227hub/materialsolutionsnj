export const CONTACT_SUBJECT_OPTIONS = [
  'General Inquiry',
  'Sales Question',
  'Service Request',
  'OSHA Training',
  'Rental Quote',
  'Wire-Guided Systems',
  'Warehouse Racking',
  'Financing',
  'Other',
] as const;

export function normalizeRequestedContactSubject(subject: string | null | undefined): string {
  return subject?.trim() || '';
}

export function buildContactSubjectOptions(requestedSubject: string | null | undefined): string[] {
  const normalized = normalizeRequestedContactSubject(requestedSubject);

  if (!normalized || CONTACT_SUBJECT_OPTIONS.includes(normalized as (typeof CONTACT_SUBJECT_OPTIONS)[number])) {
    return [...CONTACT_SUBJECT_OPTIONS];
  }

  return [normalized, ...CONTACT_SUBJECT_OPTIONS];
}