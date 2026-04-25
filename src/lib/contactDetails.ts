export const CONTACT_DETAILS = [
  {
    icon: 'phone',
    title: 'Email Us',
    primary: 'info@materialsolutionsnj.com',
    secondary: 'Phone not yet provisioned — email for direct help',
    href: 'mailto:info@materialsolutionsnj.com',
  },
  {
    icon: 'mail',
    title: 'Email Us',
    primary: 'info@materialsolutionsnj.com',
    secondary: 'Email us for direct help from the team',
    href: 'mailto:info@materialsolutionsnj.com',
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

// Public-facing phone CTA used in Header and Footer nav — not the David email-first contact entry
export const PUBLIC_PHONE_HREF = 'tel:+18489996854';
export const PUBLIC_PHONE_LABEL = '(848) 999-6854';
