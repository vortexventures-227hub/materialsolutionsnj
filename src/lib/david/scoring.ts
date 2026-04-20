// Lead Scoring System - Based on Architecture Document

export interface ScoreSignal {
  type: string;
  points: number;
  description: string;
}

export const SCORE_SIGNALS: Record<string, ScoreSignal> = {
  RETURN_VISIT: { type: 'return_visit', points: 10, description: 'Returns to site' },
  MULTIPLE_INVENTORY: { type: 'multiple_inventory', points: 15, description: 'Views 3+ inventory items' },
  ASKS_PRICING: { type: 'asks_pricing', points: 20, description: 'Asks about pricing' },
  ASKS_FINANCING: { type: 'asks_financing', points: 25, description: 'Asks about financing' },
  PROVIDES_CONTACT: { type: 'provides_contact', points: 30, description: 'Provides contact info' },
  MENTIONS_TIMELINE: { type: 'mentions_timeline', points: 20, description: 'Mentions timeline' },
  LARGE_COMPANY: { type: 'large_company', points: 15, description: 'Company size > 50' },
  FLEET_BUYER: { type: 'fleet_buyer', points: 25, description: 'Asks about multiple units' },
  VIEWS_SERVICES: { type: 'views_services', points: 10, description: 'Views OSHA/services pages' },
  ASKS_WARRANTY: { type: 'asks_warranty', points: 15, description: 'Asks about warranty' },
  ASKS_DELIVERY: { type: 'asks_delivery', points: 15, description: 'Asks about delivery' },
  MENTIONS_URGENCY: { type: 'mentions_urgency', points: 25, description: 'Expresses urgency' },
};

export type LeadStatus = 'hot' | 'warm' | 'cool';

export function calculateLeadStatus(score: number): LeadStatus {
  if (score >= 80) return 'hot';
  if (score >= 40) return 'warm';
  return 'cool';
}

export function getStatusEmoji(status: LeadStatus): string {
  switch (status) {
    case 'hot': return '🔥';
    case 'warm': return '🟡';
    case 'cool': return '🔵';
  }
}

// Signal detection from conversation
export function detectSignals(message: string): ScoreSignal[] {
  const signals: ScoreSignal[] = [];
  const lowerMessage = message.toLowerCase();

  // Pricing signals
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || 
      lowerMessage.includes('how much') || lowerMessage.includes('pricing')) {
    signals.push(SCORE_SIGNALS.ASKS_PRICING);
  }

  // Financing signals
  if (lowerMessage.includes('financing') || lowerMessage.includes('finance') || 
      lowerMessage.includes('payment plan') || lowerMessage.includes('lease')) {
    signals.push(SCORE_SIGNALS.ASKS_FINANCING);
  }

  // Timeline signals
  const timelinePatterns = [
    /this week/i, /this month/i, /asap/i, /urgent/i, /right away/i,
    /soon/i, /immediately/i, /next week/i, /looking to buy/i
  ];
  if (timelinePatterns.some(p => p.test(message))) {
    signals.push(SCORE_SIGNALS.MENTIONS_TIMELINE);
  }

  // Urgency signals
  if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || 
      lowerMessage.includes('broken down') || lowerMessage.includes('need it now')) {
    signals.push(SCORE_SIGNALS.MENTIONS_URGENCY);
  }

  // Fleet buyer signals
  if (lowerMessage.includes('fleet') || lowerMessage.includes('multiple units') ||
      lowerMessage.includes('several') || /\d+\s*(forklifts?|units?|trucks?)/i.test(message)) {
    signals.push(SCORE_SIGNALS.FLEET_BUYER);
  }

  // Warranty signals
  if (lowerMessage.includes('warranty') || lowerMessage.includes('guarantee')) {
    signals.push(SCORE_SIGNALS.ASKS_WARRANTY);
  }

  // Delivery signals
  if (lowerMessage.includes('delivery') || lowerMessage.includes('deliver') ||
      lowerMessage.includes('shipping')) {
    signals.push(SCORE_SIGNALS.ASKS_DELIVERY);
  }

  return signals;
}

// Extract contact info from message
export function extractContactInfo(message: string): {
  phone?: string;
  email?: string;
  name?: string;
  company?: string;
} {
  const info: Record<string, string> = {};

  // Phone patterns
  const phonePattern = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = message.match(phonePattern);
  if (phoneMatch) info.phone = phoneMatch[0];

  // Email pattern
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
  const emailMatch = message.match(emailPattern);
  if (emailMatch) info.email = emailMatch[0];

  // Name patterns — "my name is X", "i'm X", "this is X"
  const namePatterns = [
    /(?:my name is|i'm|i am|this is|hi,? i'm|hello,? i'm|it's|my name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:my name is|i'm|i am|this is|hi,? i'm|hello,? i'm|it's|my name's)\s+([A-Z][a-z]+)/i,
  ];
  for (const pattern of namePatterns) {
    const m = message.match(pattern);
    if (m) { info.name = m[1].trim(); break; }
  }

  // Company patterns — "company is X", "from X", "work at X", "we're X"
  const companyPatterns = [
    /(?:company is|company's|our company|we're from|from)\s+([A-Z][A-Za-z0-9 &]+?)(?:\s+(?:in|for|and|,)|$|\.|\?|!)/,
    /(?:work at|working at|employed at|at)\s+([A-Z][A-Za-z0-9 &]+?)(?:\s+(?:in|for|and|,)|$|\.|\?|!)/,
  ];
  for (const pattern of companyPatterns) {
    const m = message.match(pattern);
    if (m) { info.company = m[1].trim(); break; }
  }

  return info;
}
