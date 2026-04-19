import { NextResponse } from 'next/server';

import { createDavidChatHandler } from './handler';

// Non-authoritative streaming route: keep this endpoint only for the mounted
// buyer chat stream. Canonical David message handling, lead semantics, and
// durable operator behavior belong to /api/david/message.
export const POST = createDavidChatHandler();

export function GET() {
  return NextResponse.json({
    route: '/api/david/chat',
    status: 'non-authoritative_streaming_route',
    canonical_message_route: '/api/david/message',
    guidance:
      'Use /api/david/message for canonical David message handling; /api/david/chat is limited to the mounted streaming chat surface.',
  });
}
