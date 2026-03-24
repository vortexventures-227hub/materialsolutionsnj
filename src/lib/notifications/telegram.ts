import { Lead } from '../db/supabase';
import { getStatusEmoji, LeadStatus } from '../david/scoring';

export interface NotificationPayload {
  lead: Lead;
  conversationSummary: string;
  inventoryInterests: string[];
}

export async function sendLeadNotification(payload: NotificationPayload): Promise<boolean> {
  const { lead, conversationSummary, inventoryInterests } = payload;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured');
    return false;
  }

  const status = lead.status as LeadStatus;
  const statusEmoji = getStatusEmoji(status);
  const statusLabel = status.toUpperCase();

  const message = `
${statusEmoji} ${statusLabel} LEAD — Material Solutions NJ

📋 **Contact Info**
Name: ${lead.name || 'Not provided'}
Company: ${lead.company || 'Not provided'}
Phone: ${lead.phone || 'Not provided'}
Email: ${lead.email || 'Not provided'}

🎯 **Interest**
${inventoryInterests.length > 0 ? inventoryInterests.join('\n') : 'General inquiry'}
Timeline: ${lead.timeline || 'Not specified'}
Budget: ${lead.budget_confirmed ? 'Confirmed' : 'Not discussed'}
Use Case: ${lead.use_case || 'Not specified'}

💬 **Conversation Summary**
${conversationSummary}

📊 **Lead Score:** ${lead.score} (${statusLabel})

---
_Captured at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EDT_
`.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
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
