import { Anthropic } from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DAVID_SYSTEM_PROMPT } from '@/lib/constants';
import { extractContactInfo } from '@/lib/david/scoring';
import { submitLead, resolveAppOrigin, LeadSubmission } from '@/lib/api/leads';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getDavidLeadArtifactRoot() {
  const configuredRoot = process.env.LEAD_CAPTURE_ARTIFACT_ROOT
    ?.trim()
    .replace(/(?:\\n|\r|\n)+/g, '')
    .trim();
  return configuredRoot || path.join(process.cwd(), 'runtime_artifacts', 'lead_capture');
}

async function writeDavidLeadArtifact(input: {
  captureId: string;
  kind: 'david_chat_degraded' | 'david_chat_failure';
  reason: string;
  leadSubmission: LeadSubmission;
  leadRes: import('@/lib/api/leads').LeadResponse;
}) {
  const dir = path.join(getDavidLeadArtifactRoot(), 'david_chat_alerts');
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${input.captureId}.json`);
  await writeFile(
    filePath,
    `${JSON.stringify(
      {
        capture_id: input.captureId,
        kind: input.kind,
        operator_alerted: false,
        reason: input.reason,
        payload: input.leadSubmission,
        details: {
          capture_state: input.leadRes.captureState,
          success: input.leadRes.success,
          degraded: input.leadRes.degraded,
          queue_id: input.leadRes.queue_id ?? null,
          queue_record_locator: input.leadRes.queue_record_locator ?? null,
          error: input.leadRes.error ?? null,
          error_code: input.leadRes.error_code ?? null,
          alert_artifact_path: input.leadRes.alert_artifact_path ?? null,
        },
        created_at: new Date().toISOString(),
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  return filePath;
}

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

export interface BackendActionContext {
  inventorySummary?: string | null;
  listingDetailsSummary?: string | null;
}

export interface DavidChatRuntimeMetadata {
  contractMode: 'tool-less-structured-context-v1';
  toolExecutionEnabled: false;
  followUpSchedulingEnabled: false;
  leadCaptureState: string | null;
  callbackCaptureState: string | null;
  backendActionContext: BackendActionContext;
}

export interface BackendActionReceipt {
  action: 'lead_capture' | 'schedule_callback' | 'search_inventory' | 'get_listing_details';
  receipt_id: string;
  executed_at: string;
  outcome: 'success' | 'degraded' | 'failure';
  summary: string;
  operator_alert_dispatched: boolean;
}

export type DavidChatStreamFrame =
  | ({ type: 'context' } & DavidChatRuntimeMetadata)
  | { type: 'text_delta'; text: string }
  | { type: 'action_receipt'; receipts: BackendActionReceipt[] }
  | { type: 'done' };

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
    return TOOL_USE_REPLACEMENT + line.charAt(0).toUpperCase() + line.slice(1);
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

function inventoryTruthUnavailable(inventorySummary?: string | null): boolean {
  if (!inventorySummary) {
    return false;
  }

  return /lookup failed|returned no currently available items/i.test(inventorySummary);
}

function buildInventoryUnavailableReply(): string {
  return "I can't verify live availability in this chat right now, so I don't want to guess about current stock or pricing. We often carry used Raymond, Toyota, and Crown equipment, but for what's available today the safest next step is to use the contact page form or email info@materialsolutionsnj.com so Bill's team can confirm current options.";
}

function encodeStreamFrame(frame: DavidChatStreamFrame): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(frame)}\n`);
}

export function hasRuntimeMetadata(metadata: DavidChatRuntimeMetadata): boolean {
  return Boolean(
    metadata.contractMode ||
    metadata.leadCaptureState ||
    metadata.callbackCaptureState ||
    metadata.backendActionContext.inventorySummary ||
    metadata.backendActionContext.listingDetailsSummary
  );
}

export function buildRuntimeMetadata(
  leadCaptureState: string | null,
  callbackCaptureState: string | null,
  backendActionContext: BackendActionContext
): DavidChatRuntimeMetadata {
  return {
    contractMode: 'tool-less-structured-context-v1',
    toolExecutionEnabled: false,
    followUpSchedulingEnabled: false,
    leadCaptureState,
    callbackCaptureState,
    backendActionContext,
  };
}

export function buildContextFrame(
  leadCaptureState: string | null,
  callbackCaptureState: string | null,
  backendActionContext: BackendActionContext
): DavidChatStreamFrame {
  return {
    type: 'context',
    ...buildRuntimeMetadata(leadCaptureState, callbackCaptureState, backendActionContext),
  };
}

export function buildTextDeltaFrame(text: string): DavidChatStreamFrame {
  return { type: 'text_delta', text };
}

export function buildActionReceiptFrame(receipts: BackendActionReceipt[]): DavidChatStreamFrame {
  return { type: 'action_receipt', receipts };
}

function createActionReceipt(
  action: BackendActionReceipt['action'],
  outcome: BackendActionReceipt['outcome'],
  summary: string,
  operatorAlertDispatched = false
): BackendActionReceipt {
  return {
    action,
    receipt_id: randomUUID(),
    executed_at: new Date().toISOString(),
    outcome,
    summary,
    operator_alert_dispatched: operatorAlertDispatched,
  };
}

export function buildDoneFrame(): DavidChatStreamFrame {
  return { type: 'done' };
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
- If a visitor wants human follow-up, ask them to use the contact page form or email info@materialsolutionsnj.com with their details.
- Stay transparent about what you can do in this chat: answer questions, help qualify needs, and direct them to the real contact path.`;

  // Surface lead capture result so the LLM can honestly confirm.
  if (lastLeadCaptureState === 'success') {
    systemPrompt += `
- IMPORTANT: The visitor just submitted their contact info through this chat and it was recorded successfully. You MUST acknowledge this in your reply — confirm their info was received and that Bill or the team will follow up. Do not ask them to submit again.`;
  } else if (lastLeadCaptureState === 'degraded') {
    systemPrompt += `
- NOTE: A lead submission was attempted from this chat but could not be fully persisted. If the visitor provided contact info, suggest they use the contact page form or email info@materialsolutionsnj.com to ensure their info is recorded.`;
  }

  // Surface callback request result so the LLM can honestly confirm.
  if (lastCallbackCaptureState === 'success') {
    systemPrompt += `
- IMPORTANT: The visitor just requested a callback through this chat and it was recorded. You MUST acknowledge this in your reply — confirm their callback request was received and that Bill or the team will follow up. Do not ask them to request again.`;
  } else if (lastCallbackCaptureState === 'degraded') {
    systemPrompt += `
- NOTE: A callback request was attempted from this chat but could not be fully persisted. If the visitor requested a callback, suggest they use the contact page form or email info@materialsolutionsnj.com to ensure the request is recorded.`;
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

      const appUrl = resolveAppOrigin(request);

      // Extract contact info from the last user message and fire lead capture
      // Await the result so the LLM can see captureState and honestly confirm to the visitor.
      let lastLeadCaptureState: string | null = null;
      let lastCallbackCaptureState: string | null = null;
      let hasInventoryIntent = false;
      const backendActionContext: BackendActionContext = {};
      const actionReceipts: BackendActionReceipt[] = [];
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
            const leadRes = await submitLead(leadSubmission, { baseUrl: appUrl });
            lastLeadCaptureState = leadRes.captureState;
            if (leadRes.captureState === 'success') {
              console.log('[David] capture_lead: success — lead_id:', leadRes.lead_id);
              actionReceipts.push(
                createActionReceipt(
                  'lead_capture',
                  'success',
                  `Lead capture persisted successfully with lead_id ${leadRes.lead_id ?? 'unknown'}.`
                )
              );
            } else {
              // 'degraded' (DB offline, fallback queue used) or 'failure' (API error)
              lastLeadCaptureState = 'failure';
              console.log('[David] capture_lead: degraded/failure, state:', leadRes.captureState);
              if (leadRes.capture_id) {
                await writeDavidLeadArtifact({
                  captureId: leadRes.capture_id,
                  kind: leadRes.captureState === 'degraded' ? 'david_chat_degraded' : 'david_chat_failure',
                  reason: leadRes.captureState === 'degraded'
                    ? `david_chat_lead_degraded_${leadRes.degraded_reason ?? 'unknown'}`
                    : `david_chat_lead_failure_${leadRes.error_code ?? 'unknown'}`,
                  leadSubmission,
                  leadRes,
                }).catch((awErr) => console.error('[David] artifact write failed:', awErr));
              }
              actionReceipts.push(
                createActionReceipt(
                  'lead_capture',
                  leadRes.captureState === 'degraded' ? 'degraded' : 'failure',
                  leadRes.captureState === 'degraded'
                    ? `Lead capture degraded; fallback queue ${leadRes.queue_id ?? 'unknown'} recorded the request.`
                    : `Lead capture failed with ${leadRes.error_code ?? 'unknown_error'}.`,
                  Boolean(leadRes.alert_artifact_path)
                )
              );
            }
          } catch (err) {
            console.error('[David] capture_lead backend-action-error:', err);
            actionReceipts.push(
              createActionReceipt('lead_capture', 'failure', `Lead capture threw a backend-action error: ${err instanceof Error ? err.message : String(err)}`)
            );
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
        hasInventoryIntent = INVENTORY_KEYWORDS.some((kw) => lowerMsg.includes(kw));
        if (hasInventoryIntent) {
          try {
            const res = await fetch(`${appUrl}/api/inventory?limit=3`);
            const data = await res.json();
            if (data.inventory && data.inventory.length > 0) {
              console.log('[David] search_inventory backend-action: found', data.inventory.length, 'items');
              backendActionContext.inventorySummary = summarizeInventoryLookup(data.inventory);
              actionReceipts.push(
                createActionReceipt('search_inventory', 'success', backendActionContext.inventorySummary)
              );
            } else {
              console.log('[David] search_inventory backend-action: no items found (DB may be unconfigured)');
              backendActionContext.inventorySummary = 'The backend inventory lookup completed but returned no currently available items.';
              actionReceipts.push(
                createActionReceipt('search_inventory', 'degraded', backendActionContext.inventorySummary)
              );
            }
          } catch (err) {
            console.error('[David] search_inventory backend-action-error:', err);
            backendActionContext.inventorySummary = 'The backend inventory lookup failed, so do not claim any fresh availability results.';
            actionReceipts.push(
              createActionReceipt('search_inventory', 'failure', backendActionContext.inventorySummary)
            );
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
            const cbRes = await submitLead(callbackSubmission, { baseUrl: appUrl });
            lastCallbackCaptureState = cbRes.captureState;
            if (cbRes.captureState === 'success') {
              console.log('[David] schedule_callback: success — lead_id:', cbRes.lead_id);
              actionReceipts.push(
                createActionReceipt(
                  'schedule_callback',
                  'success',
                  `Callback request persisted successfully with lead_id ${cbRes.lead_id ?? 'unknown'}.`
                )
              );
            } else {
              console.log('[David] schedule_callback: degraded (DB may be unconfigured), state:', cbRes.captureState);
              // NOTE: operator_alert_dispatched is always false here because
              // submitLead() does not fire a Telegram alert — it only returns
              // metadata. Bill receives the callback-request notification only
              // after an operator POSTs to /api/leads/callback to mark the lead
              // as contacted. There is no visitor-side real-time alert for
              // callback requests; this is the confirmed remaining gap.
              actionReceipts.push(
                createActionReceipt(
                  'schedule_callback',
                  cbRes.captureState === 'degraded' ? 'degraded' : 'failure',
                  cbRes.captureState === 'degraded'
                    ? `Callback request degraded; fallback queue ${cbRes.queue_id ?? 'unknown'} recorded the request.`
                    : `Callback request failed with ${cbRes.error_code ?? 'unknown_error'}.`,
                  Boolean(cbRes.alert_artifact_path)
                )
              );
            }
          } catch (err) {
            console.error('[David] schedule_callback backend-action-error:', err);
            actionReceipts.push(
              createActionReceipt('schedule_callback', 'failure', `Callback request threw a backend-action error: ${err instanceof Error ? err.message : String(err)}`)
            );
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
            try {
              const res = await fetch(`${appUrl}/api/inventory/${listingContext.id}`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (data.listing) {
                console.log('[David] get_listing_details backend-action: fetched listing', data.listing.id);
                backendActionContext.listingDetailsSummary = summarizeListingDetails(data.listing);
                actionReceipts.push(
                  createActionReceipt(
                    'get_listing_details',
                    'success',
                    backendActionContext.listingDetailsSummary
                  )
                );
              } else if (data.error) {
                console.log('[David] get_listing_details backend-action: listing not found or DB unconfigured');
                backendActionContext.listingDetailsSummary = 'The backend listing-detail lookup did not return a current detail record for this listing.';
                actionReceipts.push(
                  createActionReceipt(
                    'get_listing_details',
                    'degraded',
                    backendActionContext.listingDetailsSummary
                  )
                );
              }
            } catch (err) {
              console.error('[David] get_listing_details backend-action-error:', err);
              backendActionContext.listingDetailsSummary = 'The backend listing-detail lookup failed, so do not claim any fresh detailed specs from this request.';
              actionReceipts.push(
                createActionReceipt(
                  'get_listing_details',
                  'failure',
                  backendActionContext.listingDetailsSummary
                )
              );
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
      const runtimeMetadata = buildRuntimeMetadata(
        lastLeadCaptureState,
        lastCallbackCaptureState,
        backendActionContext
      );
      const shouldShortCircuitInventoryReply =
        hasInventoryIntent &&
        inventoryTruthUnavailable(runtimeMetadata.backendActionContext.inventorySummary) &&
        !runtimeMetadata.backendActionContext.listingDetailsSummary;

      const response = new ReadableStream({
        async start(controller) {
          try {
            if (hasRuntimeMetadata(runtimeMetadata)) {
              controller.enqueue(
                encodeStreamFrame(
                  buildContextFrame(
                    runtimeMetadata.leadCaptureState,
                    runtimeMetadata.callbackCaptureState,
                    runtimeMetadata.backendActionContext
                  )
                )
              );
            }

            if (shouldShortCircuitInventoryReply) {
              controller.enqueue(
                encodeStreamFrame(buildTextDeltaFrame(buildInventoryUnavailableReply()))
              );
              if (actionReceipts.length > 0) {
                controller.enqueue(
                  encodeStreamFrame(buildActionReceiptFrame(actionReceipts))
                );
              }
              controller.enqueue(encodeStreamFrame(buildDoneFrame()));
              controller.close();
              return;
            }

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
                    controller.enqueue(encodeStreamFrame(buildTextDeltaFrame(filtered)));
                  }
                }
              }
            }

            if (actionReceipts.length > 0) {
              controller.enqueue(encodeStreamFrame(buildActionReceiptFrame(actionReceipts)));
            }
            controller.enqueue(encodeStreamFrame(buildDoneFrame()));
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
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-David-Stream-Protocol': 'ndjson-v1',
          'X-David-Contract-Mode': 'tool-less-structured-context-v1',
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
