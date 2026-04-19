import { Lead } from '../db/supabase';
import { getStatusEmoji, LeadStatus } from '../david/scoring';

export interface NotificationPayload {
  lead: Lead;
  conversationSummary: string;
  inventoryInterests: string[];
}

function cleanEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const unquoted = trimmed.replace(/^['"]+|['"]+$/g, '');
  const unescapedNewlines = unquoted.replace(/\\n/g, '').trim();

  return unescapedNewlines || null;
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
  const botToken = cleanEnv(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = cleanEnv(process.env.TELEGRAM_CHAT_ID);

  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured');
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
  // Notify for hot leads immediately
  if (score >= 80) return true;

  // Notify for warm leads with contact info
  if (score >= 40 && hasContactInfo) return true;

  return false;
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
  const chatId = cleanEnv(process.env.TELEGRAM_CHAT_ID);

  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured — inventory alert not sent');
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
