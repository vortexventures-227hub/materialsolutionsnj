import Anthropic from '@anthropic-ai/sdk';
import { detectSignals, extractContactInfo, ScoreSignal } from './scoring';
import { DAVID_SYSTEM_PROMPT } from './prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Extract text from response
  let assistantMessage = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      assistantMessage = block.text;
      break;
    }
  }

  // Get the last user message for signal detection
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const detectedSignals = lastUserMessage 
    ? detectSignals(lastUserMessage.content) 
    : [];
  
  const extractedInfo = lastUserMessage 
    ? extractContactInfo(lastUserMessage.content)
    : {};

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
    contact: "Looking to get in touch? I can help answer questions or get you connected with the owner right away.",
    about: "Want to learn more about us? We've been in this business for nearly 28 years. What questions do you have?",
  };
  return greetings[page] || greetings.home;
}
