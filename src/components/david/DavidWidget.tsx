'use client';

import { CONTACT_DETAILS } from '@/lib/contactDetails';

// Buyer-facing CTAs now open the mounted Zustand chat runtime directly.
import { DavidChatWidget } from './DavidChatWidget';

export { DavidChatWidget };

const phoneContact = CONTACT_DETAILS.find((detail) => detail.icon === 'phone');
const emailContact = CONTACT_DETAILS.find((detail) => detail.icon === 'mail');
const phoneLabel = phoneContact?.primary ?? emailContact?.primary ?? 'david@materialsolutionsnj.com';
const emailLabel = emailContact?.primary ?? 'david@materialsolutionsnj.com';

// Timeout message — does not promise Bill-follow-up (not supported by runtime)
export const SESSION_TIMEOUT_MESSAGE =
  `Session time limit reached. Please email ${emailLabel} or use the contact form if you need direct help.`;

// Equipment Guide — Equipment questions &middot; Team contact help
