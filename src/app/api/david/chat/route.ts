import { NextResponse } from 'next/server';

import { createDavidChatHandler } from './handler';

// Authoritative mounted streaming route: the live buyer widget posts here.
// /api/david/message remains the canonical non-streaming JSON fallback and the
// legacy alias target, but the mounted storefront contract now belongs to
// /api/david/chat.
export const POST = createDavidChatHandler();

export function GET() {
  return NextResponse.json({
    route: '/api/david/chat',
    status: 'authoritative_mounted_streaming_route',
    mounted_widget_route: '/api/david/chat',
    canonical_json_fallback_route: '/api/david/message',
    guidance:
      'Use /api/david/chat for the mounted buyer streaming chat surface. Use /api/david/message for the canonical non-streaming JSON fallback and legacy integrations.',
  });
}
