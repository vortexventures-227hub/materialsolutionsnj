import { NextResponse } from 'next/server';

import { createDavidChatHandler } from './handler';

// Authoritative mounted streaming route: the live buyer widget posts here.
// /api/david/message remains the canonical non-streaming JSON fallback and the
// legacy alias target, but the mounted storefront contract now belongs to
// /api/david/chat.
export const POST = createDavidChatHandler();

// Tool-free contract is authoritative: LLM has no tool schema; backend actions
// (lead capture, inventory lookup, callback) run server-side and are injected as
// structured context — the LLM never executes a tool call.
export function GET() {
  return NextResponse.json({
    route: '/api/david/chat',
    status: 'authoritative_mounted_streaming_route',
    contract_mode: 'tool-less-structured-context-v1',
    tool_execution_enabled: false,
    mounted_widget_route: '/api/david/chat',
    canonical_json_fallback_route: '/api/david/message',
    guidance:
      'Use /api/david/chat for the mounted buyer streaming chat surface. Use /api/david/message for the canonical non-streaming JSON fallback and legacy integrations.',
  });
}
