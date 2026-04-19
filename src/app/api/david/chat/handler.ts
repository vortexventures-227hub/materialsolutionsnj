import { Anthropic } from '@anthropic-ai/sdk';
import { DAVID_SYSTEM_PROMPT } from '@/lib/constants';
import { extractContactInfo } from '@/lib/david/scoring';
import { submitLead, LeadSubmission } from '@/lib/api/leads';

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

interface BackendActionContext {
  inventorySummary?: string | null;
  listingDetailsSummary?: string | null;
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

// NOTE: tool-name patterns removed — those tools are not in the system prompt
// (stripUnsupportedCapabilityClaims removes them), so filtering them was
// pure suppression. Keep broad promise patterns to prevent misleading the visitor.
// Patterns for promises the chat flow cannot keep.
// 'promise a follow-up' / 'i can schedule a callback' — LLM must not commit
// to human callbacks the widget cannot deliver.
// 'use the capture_lead tool' removed — LLM has no tool references in its
// system prompt (stripUnsupportedCapabilityClaims strips them), so it cannot
// generate this text; filtering it was pure suppression.
const MISLEADING_PROMISE_PATTERNS = [
  'promise a follow-up',
  'i can schedule a callback',
];

// Tool-use verb patterns the LLM generates without any backing tool schema.
// The LLM is called with zero `tools` param (createMessageStream passes no tools),
// so it cannot actually execute any backend action. These patterns claim
// tool-like behavior that never occurred — replace with honest fallback.
const TOOL_USE_PATTERNS = [
  'i searched',
  'i look up',
  "i'll search",
  'i search',
  'i looked up',
  "i'm searching",
  'i am searching',
  'i just ran',
  'i ran a search',
  "i'll check",
  'let me search',
  'let me look',
  'let me check',
  'i checked',
  'checking inventory',
  'searching our inventory',
  'looking up the inventory',
  'running a search',
];

// Honest replacements for lines that claim tool-use verbs.
// The backend results (when present) are already injected into the system prompt
// as VERIFIED BACKEND ACTION CONTEXT, so the LLM can reference them honestly
// without claiming fresh tool execution.
const TOOL_USE_REPLACEMENT = 'Based on the information available to me from our current listings, ';

function replaceToolUseClaim(line: string): string {
  const lower = line.toLowerCase();
  if (TOOL_USE_PATTERNS.some((p) => lower.includes(p))) {
    return TOOL_USE_REPLACEMENT + line.charAt(0).toLowerCase() + line.slice(1);
  }
  return line;
}

function stripUnsupportedCapabilityClaims(prompt: string): string {
  return prompt
    .split('\n')
    .filter((line) => {
      const normalized = line.toLowerCase();
      return !MISLEADING_PROMISE_PATTERNS.some((needle) => normalized.includes(needle));
    })
    .join('\n')
    .trim();
}

function filterToolLanguage(text: string): string {
  return text
    .split('\n')
    .map((line) => replaceToolUseClaim(line))
    .filter((line) => {
      const normalized = line.toLowerCase();
      return !MISLEADING_PROMISE_PATTERNS.some((needle) => normalized.includes(needle));
    })
    .join('\n');
}

export function buildDavidChatSystemPrompt(
  listingContext?: ListingContext,
  lastLeadCaptureState?: string | null,
  lastCallbackCaptureState?: string | null,
  backendActionContext?: BackendActionContext
): string {
  let systemPrompt = stripUnsupportedCapabilityClaims(DAVID_SYSTEM_PROMPT);

  systemPrompt += `

## RUNTIME TRUTH RULES
- Do not claim to use tools, schedule callbacks, or log a lead automatically in this chat flow.
- Do not promise that Bill or the team will follow up unless the visitor explicitly uses the contact form, calls the phone number, or you truthfully confirm a separate submission path succeeded.
- If a visitor wants human follow-up, ask them to call (973) 500-1010 or use the contact page form with their details.
- Stay transparent about what you can do in this chat: answer questions, help qualify needs, and direct them to the real contact path.`;

  // Surface lead capture result so the LLM can honestly confirm.
  if (lastLeadCaptureState === 'success') {
    systemPrompt += `
- IMPORTANT: The visitor just submitted their contact info through this chat and it was recorded successfully. You MUST acknowledge this in your reply — confirm their info was received and that Bill or the team will follow up. Do not ask them to submit again.`;
  } else if (lastLeadCaptureState === 'degraded') {
    systemPrompt += `
- NOTE: A lead submission was attempted from this chat but could not be fully persisted. If the visitor provided contact info, suggest they call (973) 500-1010 or use the contact page form to ensure their info is recorded.`;
  }

  // Surface callback request result so the LLM can honestly confirm.
  if (lastCallbackCaptureState === 'success') {
    systemPrompt += `
- IMPORTANT: The visitor just requested a callback through this chat and it was recorded. You MUST acknowledge this in your reply — confirm their callback request was received and that Bill or the team will follow up. Do not ask them to request again.`;
  } else if (lastCallbackCaptureState === 'degraded') {
    systemPrompt += `
- NOTE: A callback request was attempted from this chat but could not be fully persisted. If the visitor requested a callback, suggest they call (973) 500-1010 to ensure the request is recorded.`;
  }

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

  if (backendActionContext?.inventorySummary || backendActionContext?.listingDetailsSummary) {
    systemPrompt += `

## VERIFIED BACKEND ACTION CONTEXT
Only describe these results if they help answer the visitor's latest question. These were fetched during this request, so you may refer to them directly without pretending you used a tool.`;

    if (backendActionContext.inventorySummary) {
      systemPrompt += `
- Inventory lookup result: ${backendActionContext.inventorySummary}`;
    }

    if (backendActionContext.listingDetailsSummary) {
      systemPrompt += `
- Listing detail lookup result: ${backendActionContext.listingDetailsSummary}`;
    }
  }

  return systemPrompt;
}

function summarizeInventoryLookup(inventory: Array<Record<string, any>>): string {
  if (!inventory.length) {
    return 'No currently available inventory items were returned by the backend lookup.';
  }

  const topMatches = inventory.slice(0, 3).map((item) => {
    const title = [item.year, item.brand || item.make, item.model].filter(Boolean).join(' ').trim() || item.title || 'Unlabeled listing';
    const type = item.type ? ` (${item.type})` : '';
    return `${title}${type}`;
  });

  return `The backend returned ${inventory.length} current item(s). Top matches: ${topMatches.join('; ')}.`;
}

function summarizeListingDetails(listing: Record<string, any>): string {
  const title = listing.title || [listing.year, listing.brand || listing.make, listing.model].filter(Boolean).join(' ').trim() || listing.slug || listing.id || 'current listing';
  const parts = [
    listing.price ? `price ${listing.price}` : null,
    listing.hours ? `${listing.hours} hours` : null,
    listing.capacity_lbs ? `capacity ${listing.capacity_lbs} lbs` : null,
    listing.fuel_type ? `fuel ${listing.fuel_type}` : null,
    listing.condition ? `condition ${listing.condition}` : null,
  ].filter(Boolean);

  if (!parts.length) {
    return `${title} was fetched successfully, but the backend did not return extra structured specs beyond the listing identity.`;
  }

  return `${title} was fetched successfully with these verified details: ${parts.join(', ')}.`;
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
      const { messages, sessionId, listingContext } = body;

      if (!messages || messages.length === 0) {
        return new Response('No messages provided', { status: 400 });
      }

      // Extract contact info from the last user message and fire lead capture
      // Await the result so the LLM can see captureState and honestly confirm to the visitor.
      let lastLeadCaptureState: string | null = null;
      let lastCallbackCaptureState: string | null = null;
      const backendActionContext: BackendActionContext = {};
      const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
      if (lastUserMessage) {
        const contactInfo = extractContactInfo(lastUserMessage.content);
        if (contactInfo.email || contactInfo.phone) {
          const leadSubmission: LeadSubmission = {
            visitor_id: sessionId,
            source: 'david_chat',
            cta_origin: 'david_chat',
            listing_id: listingContext?.id ?? undefined,
            listing_slug: undefined,
            listing_title: listingContext?.title ?? undefined,
            ...(contactInfo.name && { name: contactInfo.name }),
            ...(contactInfo.email && { email: contactInfo.email }),
            ...(contactInfo.phone && { phone: contactInfo.phone }),
            ...(contactInfo.company && { company: contactInfo.company }),
          };
          try {
            const leadRes = await submitLead(leadSubmission);
            lastLeadCaptureState = leadRes.captureState;
            if (leadRes.captureState === 'success') {
              console.log('[David] capture_lead: success — lead_id:', leadRes.lead_id);
            } else {
              console.log('[David] capture_lead: degraded (DB may be unconfigured), state:', leadRes.captureState);
            }
          } catch (err) {
            console.error('[David] capture_lead backend-action-error:', err);
          }
        }

        // Backend-side search_inventory: detect equipment intent and query inventory
        const INVENTORY_KEYWORDS = [
          'reach truck', 'reach trucks',
          'order picker', 'order pickers',
          'forklift', 'forklifts',
          'pallet jack', 'pallet jacks',
          'swing reach', 'swing reaches',
          'turret truck', 'turret trucks',
          'sit-down', 'counterbalance',
          'electric forklift', 'used forklift',
          'warehouse truck', 'warehouse equipment',
        ];
        const lowerMsg = lastUserMessage.content.toLowerCase();
        const hasInventoryIntent = INVENTORY_KEYWORDS.some((kw) => lowerMsg.includes(kw));
        if (hasInventoryIntent) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          try {
            const res = await fetch(`${appUrl}/api/inventory?limit=3`);
            const data = await res.json();
            if (data.inventory && data.inventory.length > 0) {
              console.log('[David] search_inventory backend-action: found', data.inventory.length, 'items');
              backendActionContext.inventorySummary = summarizeInventoryLookup(data.inventory);
            } else {
              console.log('[David] search_inventory backend-action: no items found (DB may be unconfigured)');
              backendActionContext.inventorySummary = 'The backend inventory lookup completed but returned no currently available items.';
            }
          } catch (err) {
            console.error('[David] search_inventory backend-action-error:', err);
            backendActionContext.inventorySummary = 'The backend inventory lookup failed, so do not claim any fresh availability results.';
          }
        }

        // Backend-side schedule_callback: detect callback/scheduling intent and fire lead capture
        const CALLBACK_KEYWORDS = [
          'call me back', 'can you call', 'schedule a call',
          'schedule callback', 'set up a call', 'arrange a call',
          'would like a callback', 'want a call back',
          'need a call', 'request a callback', 'please call',
          'book a call', 'schedule a meeting',
        ];
        const hasCallbackIntent = CALLBACK_KEYWORDS.some((kw) => lowerMsg.includes(kw));
        if (hasCallbackIntent) {
          const contactInfo = extractContactInfo(lastUserMessage.content);
          const callbackSubmission: LeadSubmission = {
            visitor_id: sessionId,
            source: 'david_chat',
            cta_origin: 'callback_request',
            listing_id: listingContext?.id ?? undefined,
            listing_title: listingContext?.title ?? undefined,
            message: `Callback requested via chat: ${lastUserMessage.content.substring(0, 200)}`,
            ...(contactInfo.name && { name: contactInfo.name }),
            ...(contactInfo.email && { email: contactInfo.email }),
            ...(contactInfo.phone && { phone: contactInfo.phone }),
            ...(contactInfo.company && { company: contactInfo.company }),
          };
          try {
            const cbRes = await submitLead(callbackSubmission);
            lastCallbackCaptureState = cbRes.captureState;
            if (cbRes.captureState === 'success') {
              console.log('[David] schedule_callback: success — lead_id:', cbRes.lead_id);
            } else {
              console.log('[David] schedule_callback: degraded (DB may be unconfigured), state:', cbRes.captureState);
            }
          } catch (err) {
            console.error('[David] schedule_callback backend-action-error:', err);
          }
        }

        // Backend-side get_listing_details: detect request for current listing's full details
        if (listingContext) {
          const DETAILS_KEYWORDS = [
            'more details', 'more info', 'tell me more about this',
            'what are the specs', 'specifications', 'full details',
            'get details', 'details on this', 'more about this one',
            'listing details', 'tell me about this', 'more about it',
            'what else do you know', 'show me specs', 'equipment details',
          ];
          const hasDetailsIntent = DETAILS_KEYWORDS.some((kw) => lowerMsg.includes(kw));
          if (hasDetailsIntent) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            try {
              const res = await fetch(`${appUrl}/api/inventory/${listingContext.id}`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (data.listing) {
                console.log('[David] get_listing_details backend-action: fetched listing', data.listing.id);
                backendActionContext.listingDetailsSummary = summarizeListingDetails(data.listing);
              } else if (data.error) {
                console.log('[David] get_listing_details backend-action: listing not found or DB unconfigured');
                backendActionContext.listingDetailsSummary = 'The backend listing-detail lookup did not return a current detail record for this listing.';
              }
            } catch (err) {
              console.error('[David] get_listing_details backend-action-error:', err);
              backendActionContext.listingDetailsSummary = 'The backend listing-detail lookup failed, so do not claim any fresh detailed specs from this request.';
            }
          }
        }
      }

      const systemPrompt = buildDavidChatSystemPrompt(
        listingContext,
        lastLeadCaptureState,
        lastCallbackCaptureState,
        backendActionContext
      );

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
                  const filtered = filterToolLanguage(text);
                  if (filtered) {
                    controller.enqueue(new TextEncoder().encode(filtered));
                  }
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
