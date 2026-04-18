import { Anthropic } from '@anthropic-ai/sdk';
import { DAVID_SYSTEM_PROMPT } from '@/lib/constants';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ListingContext {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
}

export interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  listingContext?: ListingContext;
}

type AnthropicStreamChunk = {
  type: string;
  delta?: {
    type?: string;
    text?: string;
  };
};

export type CreateMessageStreamParams = {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export type DavidChatHandlerDependencies = {
  createMessageStream?: (
    params: CreateMessageStreamParams
  ) => Promise<AsyncIterable<AnthropicStreamChunk>>;
};

function stripUnsupportedCapabilityClaims(prompt: string): string {
  return prompt
    .split('\n')
    .filter((line) => {
      const normalized = line.toLowerCase();
      return ![
        'capture_lead',
        'search_inventory',
        'get_listing_details',
        'schedule_callback',
        'promise a follow-up',
        'i can schedule a callback',
        'use the capture_lead tool',
      ].some((needle) => normalized.includes(needle));
    })
    .join('\n')
    .trim();
}

export function buildDavidChatSystemPrompt(listingContext?: ListingContext): string {
  let systemPrompt = stripUnsupportedCapabilityClaims(DAVID_SYSTEM_PROMPT);

  systemPrompt += `

## RUNTIME TRUTH RULES
- Do not claim to use tools, schedule callbacks, or log a lead automatically in this chat flow.
- Do not promise that Bill or the team will follow up unless the visitor explicitly uses the contact form, calls the phone number, or you truthfully confirm a separate submission path succeeded.
- If a visitor wants human follow-up, ask them to call (973) 500-1010 or use the contact page form with their details.
- Stay transparent about what you can do in this chat: answer questions, help qualify needs, and direct them to the real contact path.`;

  if (listingContext) {
    systemPrompt += `

## CURRENT LISTING CONTEXT
The user is viewing or interested in this equipment:
- **Listing ID**: ${listingContext.id}
- **Title**: ${listingContext.title}
- **Make**: ${listingContext.make}
- **Model**: ${listingContext.model}
- **Year**: ${listingContext.year}

Use this context in your reply when it is relevant, but do not imply you fetched fresh live data beyond what is shown here.`;
  }

  return systemPrompt;
}

const defaultDeps: Required<DavidChatHandlerDependencies> = {
  async createMessageStream(params) {
    return client.messages.stream(params as any) as unknown as AsyncIterable<AnthropicStreamChunk>;
  },
};

export function createDavidChatHandler(
  deps: DavidChatHandlerDependencies = defaultDeps
) {
  const { createMessageStream } = { ...defaultDeps, ...deps };

  return async function davidChatHandler(request: Request) {
    try {
      const body: RequestBody = await request.json();
      const { messages, listingContext } = body;

      if (!messages || messages.length === 0) {
        return new Response('No messages provided', { status: 400 });
      }

      const systemPrompt = buildDavidChatSystemPrompt(listingContext);

      const response = new ReadableStream({
        async start(controller) {
          try {
            const stream = await createMessageStream({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 1024,
              system: systemPrompt,
              messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            });

            for await (const chunk of stream) {
              if (
                chunk.type === 'content_block_delta' &&
                chunk.delta?.type === 'text_delta'
              ) {
                const text = chunk.delta.text;
                if (text) {
                  controller.enqueue(new TextEncoder().encode(text));
                }
              }
            }

            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error occurred';
            controller.error(new Error(`Stream error: ${errorMessage}`));
          }
        },
      });

      return new Response(response, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('David chat error:', error);

      return new Response(
        JSON.stringify({
          error: 'Failed to process message',
          details: errorMessage,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
