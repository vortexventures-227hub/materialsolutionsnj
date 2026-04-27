import { NextRequest, NextResponse } from 'next/server';

import { isAdminGateOpen } from '@/middleware';

export function requireAdminRouteGate(request: Request): NextResponse | null {
  const gateRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
  });

  if (isAdminGateOpen(gateRequest)) {
    return null;
  }

  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
