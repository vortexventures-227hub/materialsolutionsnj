import { loadDavidKnowledgeBase } from './knowledge-base';

export interface DavidFollowUpCustomer {
  name?: string;
  email: string;
  company?: string;
  phone?: string;
}

export interface DavidFollowUpEmailInput {
  customer: DavidFollowUpCustomer;
  callSummary: string;
  interestedInventoryIds?: string[];
  nextSteps?: string[];
}

export interface DavidComposedFollowUpEmail {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  text: string;
}

function formatInventoryLine(id: string): string {
  const item = loadDavidKnowledgeBase().inventory.find((entry) => entry.id === id);
  if (!item) return `${id} — details not found in David's current static KB`;
  return `${item.id} — ${item.title} — ${item.price}`;
}

function formatBullets(values: string[] | undefined, fallback: string): string {
  const safeValues = values?.map((value) => value.trim()).filter(Boolean) ?? [];
  if (!safeValues.length) return `- ${fallback}`;
  return safeValues.map((value) => `- ${value}`).join('\n');
}

export function composeDavidFollowUpEmail(input: DavidFollowUpEmailInput): DavidComposedFollowUpEmail {
  const kb = loadDavidKnowledgeBase();
  const customerName = input.customer.name?.trim() || 'there';
  const customerCompany = input.customer.company?.trim();
  const inventoryLines = input.interestedInventoryIds?.map(formatInventoryLine).filter(Boolean) ?? [];

  const text = [
    `Hi ${customerName},`,
    '',
    'Thanks for speaking with David at Material Solutions NJ. Here is the call-scoped follow-up summary:',
    '',
    input.callSummary.trim(),
    '',
    customerCompany ? `Customer/company: ${customerName} — ${customerCompany}` : `Customer: ${customerName}`,
    input.customer.phone ? `Phone: ${input.customer.phone}` : null,
    '',
    'Interested equipment:',
    formatBullets(inventoryLines, 'No specific unit was named during the call.'),
    '',
    'Recommended next steps:',
    formatBullets(input.nextSteps, 'Chris or Bill should review the call summary and confirm the right equipment/options.'),
    '',
    `For immediate help, reply to this email or call ${kb.company.phone}.`,
    '',
    '— David, Material Solutions NJ',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return {
    from: kb.company.publicEmail === 'info@materialsolutionsnj.com'
      ? 'david@materialsolutionsnj.com'
      : kb.company.publicEmail,
    to: [input.customer.email],
    cc: [kb.people.chris.email, kb.people.bill.email],
    subject: `Material Solutions NJ follow-up${input.customer.name ? ` for ${input.customer.name}` : ''}`,
    text,
  };
}
