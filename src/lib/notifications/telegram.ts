import { Lead } from '../db/supabase';
import { getStatusEmoji, LeadStatus } from '../david/scoring';

export interface NotificationPayload {
  lead: Lead;
  conversationSummary: string;
  inventoryInterests: string[];
}

function cleanEnv(value: string | undefined): string | null {
  if (!value) return null;

  let trimmed = value.trim();
  // Strip surrounding quotes from Vercel env-pull injection
  const unquoted = trimmed.replace(/^['"]+|['"]+$/g, '');
  // Strip embedded \\n escape sequences
  let cleaned = unquoted.replace(/\\n/g, '');
  // Strip trailing literal \n (backslash + literal 'n') injected by env-pull
  while (cleaned.endsWith('\\n')) {
    cleaned = cleaned.slice(0, -2).trimEnd();
  }
  // Secondary guard for a single trailing \n that survives the while loop
  if (cleaned.endsWith('\\n')) {
    cleaned = cleaned.slice(0, -2).trimEnd();
  }

  return cleaned || null;
}

export function formatLeadNotificationMessage(payload: NotificationPayload): string {
  const { lead, conversationSummary, inventoryInterests } = payload;
  const status = lead.status as LeadStatus;
  const statusEmoji = getStatusEmoji(status);
  const statusLabel = status.toUpperCase();

  return [
    `${statusEmoji} ${statusLabel} LEAD - Material Solutions NJ`,
    '',
    'Contact Info',
    `Name: ${lead.name || 'Not provided'}`,
    `Company: ${lead.company || 'Not provided'}`,
    `Phone: ${lead.phone || 'Not provided'}`,
    `Email: ${lead.email || 'Not provided'}`,
    '',
    'Interest',
    inventoryInterests.length > 0 ? inventoryInterests.join('\n') : 'General inquiry',
    `Timeline: ${lead.timeline || 'Not specified'}`,
    `Budget: ${lead.budget_confirmed ? 'Confirmed' : 'Not discussed'}`,
    `Use Case: ${lead.use_case || 'Not specified'}`,
    '',
    'Conversation Summary',
    conversationSummary,
    '',
    `Lead Score: ${lead.score} (${statusLabel})`,
    '',
    `Captured at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EDT`,
  ].join('\n');
}

export async function sendLeadNotification(payload: NotificationPayload): Promise<boolean> {
  const botToken =
    cleanEnv(process.env.DAVID_LEAD_TELEGRAM_BOT_TOKEN) ??
    cleanEnv(process.env.TELEGRAM_BOT_TOKEN);
  const chatId =
    cleanEnv(process.env.DAVID_LEAD_TELEGRAM_CHAT_ID) ??
    cleanEnv(process.env.TELEGRAM_CHAT_ID);

  if (!botToken || !chatId) {
    console.error('David lead Telegram credentials not configured');
    return false;
  }

  const message = formatLeadNotificationMessage(payload);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

export function shouldNotify(score: number, hasContactInfo: boolean): boolean {
  if (score >= 80) return true;
  if (score >= 40 && hasContactInfo) return true;
  return false;
}

export function shouldSuppressLeadNotification(payload: NotificationPayload): {
  suppress: boolean;
  reason?: string;
} {
  const source = payload.lead.source?.trim().toLowerCase() ?? '';
  const ctaOrigin = payload.lead.cta_origin?.trim().toLowerCase() ?? '';
  const email = payload.lead.email?.trim().toLowerCase() ?? '';
  const name = payload.lead.name?.trim().toLowerCase() ?? '';
  const company = payload.lead.company?.trim().toLowerCase() ?? '';
  const subject = payload.lead.subject?.trim().toLowerCase() ?? '';
  const summary = payload.conversationSummary.trim().toLowerCase();

  const singleCharOrPlaceholder = (value: string) =>
    !value || value.length <= 1 || ['x', 'xx', 'test', 'testing', 'asdf', 'qwerty'].includes(value);

  if (source === 'vercel_probe') {
    return { suppress: true, reason: 'suppressed_vercel_probe' };
  }

  if (ctaOrigin === 'audit') {
    return { suppress: true, reason: 'suppressed_audit_cta' };
  }

  if (email.endsWith('@test.com') || email === 'x@x.com' || email === 'test@test.com') {
    return { suppress: true, reason: 'suppressed_test_email' };
  }

  if (name.includes('audit') || subject.includes('audit test')) {
    return { suppress: true, reason: 'suppressed_audit_marker' };
  }

  if (
    singleCharOrPlaceholder(name) &&
    singleCharOrPlaceholder(company) &&
    singleCharOrPlaceholder(subject) &&
    singleCharOrPlaceholder(source)
  ) {
    return { suppress: true, reason: 'suppressed_placeholder_lead' };
  }

  if (summary === 'source: x\nx' || summary === 'x') {
    return { suppress: true, reason: 'suppressed_placeholder_summary' };
  }

  return { suppress: false };
}

// ---------------------------------------------------------------------------
// Inventory failure operator alert
// ---------------------------------------------------------------------------

export interface InventoryFailureAlert {
  failureId: string;
  route: string;
  kind: string;
  reason: string;
  details?: unknown;
}

function formatInventoryFailureMessage(alert: InventoryFailureAlert): string {
  return [
    '\u26a0\ufe0f INVENTORY API FAILURE — Material Solutions NJ',
    '',
    `Failure ID: ${alert.failureId}`,
    `Route: ${alert.route}`,
    `Kind: ${alert.kind}`,
    `Reason: ${alert.reason}`,
    alert.details ? `Details: ${JSON.stringify(alert.details)}` : '',
    '',
    `Occurred at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EDT`,
    '',
    'Action required: check inventory API health and Supabase connectivity.',
    'Artifact: runtime_artifacts/inventory_failures/',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sendInventoryFailureNotification(
  alert: InventoryFailureAlert
): Promise<boolean> {
  const botToken = cleanEnv(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = cleanEnv(process.env.INVENTORY_ALERT_TELEGRAM_CHAT_ID);

  if (!botToken || !chatId) {
    console.error('Inventory alert Telegram target not configured — inventory alert not sent');
    return false;
  }

  const message = formatInventoryFailureMessage(alert);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error (inventory alert):', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error sending inventory failure Telegram notification:', err);
    return false;
  }
}
