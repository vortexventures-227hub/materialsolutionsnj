import { NextResponse } from 'next/server';

import { POST as postDavidMessage } from '@/app/api/david/message/route';

export const dynamic = 'force-dynamic';

// Legacy alias: keep /api/david fenced to the canonical non-streaming runtime so
// older widgets cannot silently drift away from /api/david/message behavior.
export const POST = postDavidMessage;

export function GET() {
  return NextResponse.json({
    route: '/api/david',
    status: 'legacy_alias',
    canonical_message_route: '/api/david/message',
    streaming_route: '/api/david/chat',
    health_route: '/api/david/health',
  });
}
