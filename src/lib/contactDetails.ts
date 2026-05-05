const FALLBACK_DAVID_EMAIL = 'david@materialsolutionsnj.com';
const DEFAULT_PUBLIC_PHONE_NUMBER = '(973) 500-1010';
const DEFAULT_PUBLIC_PHONE_LABEL = '(973) 500-1010';

type PublicPhoneEnv = {
  NEXT_PUBLIC_DAVID_PHONE_NUMBER?: string;
  NEXT_PUBLIC_DAVID_PHONE_LABEL?: string;
};

export function normalizePublicPhoneHref(phoneNumber: string): string | null {
  const trimmed = phoneNumber.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`;
  if (trimmed.startsWith('+') && digits.length >= 8) return `tel:+${digits}`;

  return null;
}

export function resolvePublicPhoneContact(env: PublicPhoneEnv = process.env as PublicPhoneEnv) {
  const requestedPhoneNumber = env.NEXT_PUBLIC_DAVID_PHONE_NUMBER?.trim() || DEFAULT_PUBLIC_PHONE_NUMBER;
  const requestedPhoneHref = normalizePublicPhoneHref(requestedPhoneNumber);
  const phoneNumber = requestedPhoneHref ? requestedPhoneNumber : DEFAULT_PUBLIC_PHONE_NUMBER;
  const phoneHref = requestedPhoneHref ?? normalizePublicPhoneHref(DEFAULT_PUBLIC_PHONE_NUMBER);

  if (phoneHref) {
    return {
      href: phoneHref,
      label: env.NEXT_PUBLIC_DAVID_PHONE_LABEL?.trim() || DEFAULT_PUBLIC_PHONE_LABEL,
      hasPublicPhone: true,
    };
  }

  return {
    href: `mailto:${FALLBACK_DAVID_EMAIL}`,
    label: FALLBACK_DAVID_EMAIL,
    hasPublicPhone: false,
  };
}

const publicPhoneContact = resolvePublicPhoneContact();

export const CONTACT_DETAILS = [
  {
    icon: 'phone',
    title: publicPhoneContact.hasPublicPhone ? 'Call David' : 'Email Us',
    primary: publicPhoneContact.label,
    secondary: publicPhoneContact.hasPublicPhone
      ? 'Call David for direct inventory and equipment-fit help'
      : 'Use the contact form for direct help from the team',
    href: publicPhoneContact.href,
  },
  {
    icon: 'mail',
    title: 'Email Us',
    primary: FALLBACK_DAVID_EMAIL,
    secondary: 'Email us for direct help from the team',
    href: `mailto:${FALLBACK_DAVID_EMAIL}`,
  },
  {
    icon: 'map-pin',
    title: 'Our Location',
    primary: '28C Industrial Drive',
    secondary: 'Hamilton, New Jersey',
    href: undefined,
  },
  {
    icon: 'clock',
    title: 'Business Hours',
    primary: 'Mon–Fri, 8AM–6PM EST',
    secondary: 'Use David chat for equipment questions or contact the team directly',
    href: undefined,
  },
] as const;

// Public-facing CTA. Chris confirmed this line works on 2026-04-27; keep the
// checked-in default live so a missing or stale build env cannot regress to email.
export const PUBLIC_PHONE_HREF = publicPhoneContact.href;
export const PUBLIC_PHONE_LABEL = publicPhoneContact.label;
export const PUBLIC_PHONE_IS_LIVE = publicPhoneContact.hasPublicPhone;
