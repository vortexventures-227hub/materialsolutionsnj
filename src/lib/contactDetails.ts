export const CONTACT_DETAILS = [
  {
    icon: 'phone',
    title: 'Email Us',
    primary: 'david@materialsolutionsnj.com',
    secondary: 'Phone not yet provisioned — email for direct help',
    href: 'mailto:david@materialsolutionsnj.com',
  },
  {
    icon: 'mail',
    title: 'Email Us',
    primary: 'david@materialsolutionsnj.com',
    secondary: 'Email us for direct help from the team',
    href: 'mailto:david@materialsolutionsnj.com',
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

// Public-facing CTA used in Header/Footer while the David phone line is not serviceable.
// Chris confirmed (848) 999-6854 returns not-in-service; do not publish it until carrier routing is proven.
// Temp swap to david@ pending info@ alias provisioning at Namecheap PE — see notify_chris 20260426 packet.
export const PUBLIC_PHONE_HREF = 'mailto:david@materialsolutionsnj.com';
export const PUBLIC_PHONE_LABEL = 'david@materialsolutionsnj.com';
