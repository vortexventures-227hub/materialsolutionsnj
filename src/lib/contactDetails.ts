export const CONTACT_DETAILS = [
  {
    icon: 'phone',
    title: 'Call Us',
    primary: '{{DAVID_PHONE_PENDING_PROVISION}}',
    secondary: 'Phone not yet provisioned — contact us by email',
    href: 'tel:DAVID_PHONE_PENDING_PROVISION',
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
