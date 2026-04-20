import { GoogleGenerativeAI } from '@google/generative-ai';
import { detectSignals, extractContactInfo, ScoreSignal } from './scoring';
import { DAVID_SYSTEM_PROMPT } from './prompts';
import { submitLead, LeadSubmission } from '@/lib/api/leads';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface DavidResponse {
  message: string;
  signals: ScoreSignal[];
  extractedInfo: {
    phone?: string;
    email?: string;
    name?: string;
    company?: string;
  };
  suggestedButtons?: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getDavidResponse(
  messages: ConversationMessage[],
  context: {
    currentPage?: string;
    inventoryViewed?: string[];
    visitorId: string;
    baseUrl?: string;
  }
): Promise<DavidResponse> {
  // Build context injection
  let contextInfo = '';
  if (context.currentPage) {
    contextInfo += `\n[Visitor is currently on: ${context.currentPage}]`;
  }
  if (context.inventoryViewed && context.inventoryViewed.length > 0) {
    contextInfo += `\n[Visitor has viewed these items: ${context.inventoryViewed.join(', ')}]`;
  }

  const systemPrompt = DAVID_SYSTEM_PROMPT + contextInfo;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  });

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });

  // Get the last message to send
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  const assistantMessage = result.response.text();

  // Get the last user message for signal detection
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const detectedSignals = lastUserMessage 
    ? detectSignals(lastUserMessage.content) 
    : [];
  
  const extractedInfo = lastUserMessage 
    ? extractContactInfo(lastUserMessage.content)
    : {};

  // Execute lead capture tool when contact info is available
  if (extractedInfo.email || extractedInfo.phone) {
    const leadSubmission: LeadSubmission = {
      source: 'david_chat',
      visitor_id: context.visitorId,
      page_origin: context.currentPage ?? undefined,
      ...extractedInfo,
    };
    // Fire and forget — don't block the response
    submitLead(leadSubmission, { baseUrl: context.baseUrl }).catch(err => {
      console.error('[David] capture_lead backend-action-error:', err);
    });
  }

  return {
    message: assistantMessage,
    signals: detectedSignals,
    extractedInfo,
  };
}

export function generateGreeting(page: string = 'home'): string {
  const greetings: Record<string, string> = {
    home: "Welcome to Material Solutions. I'm David — been helping folks find the right equipment for nearly 28 years. Looking for a forklift, or interested in our training and services?",
    inventory: "Browsing our inventory? I can help you find exactly what you need. What kind of operation will this equipment be going into?",
    contact: "Looking to get in touch? I can help answer questions and point you to our phone or email for direct help from the team.",
    about: "Want to learn more about us? We've been in this business for nearly 28 years. What questions do you have?",
  };
  return greetings[page] || greetings.home;
}
