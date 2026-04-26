import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'msnj_admin_token';
const TOKEN_PARAM = 'token';
const TOKEN_HEADER = 'x-msnj-admin-token';
const LEGACY_TOKEN_HEADER = 'x-admin-token';

function getAdminTokenFromRequest(request: NextRequest): string | null {
  return (
    request.headers.get(TOKEN_HEADER)?.trim() ||
    request.headers.get(LEGACY_TOKEN_HEADER)?.trim() ||
    request.nextUrl.searchParams.get(TOKEN_PARAM)?.trim() ||
    request.cookies.get(ADMIN_COOKIE_NAME)?.value?.trim() ||
    null
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isPublishPostPath(pathname: string): boolean {
  return pathname === '/api/marketing/publish'
    || (/^\/api\/inventory\/[^/]+\/publish$/.test(pathname));
}

export function isAdminRequest(pathname: string): boolean {
  return isAdminPath(pathname) || isPublishPostPath(pathname);
}

function shouldProtectRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return isAdminPath(pathname) || (request.method === 'POST' && isPublishPostPath(pathname));
}

export function isAdminGateOpen(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASTE_QUEUE_TOKEN?.trim();
  const provided = getAdminTokenFromRequest(request);

  return Boolean(expected && provided && provided === expected);
}

export function middleware(request: NextRequest) {
  if (!shouldProtectRequest(request)) {
    return NextResponse.next();
  }

  if (!isAdminGateOpen(request)) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex,nofollow',
      },
    });
  }

  const response = NextResponse.next();
  const expected = process.env.ADMIN_PASTE_QUEUE_TOKEN?.trim();
  const queryToken = request.nextUrl.searchParams.get(TOKEN_PARAM)?.trim();

  if (expected && queryToken === expected) {
    response.cookies.set(ADMIN_COOKIE_NAME, expected, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: 60 * 60 * 12,
    });
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/marketing/publish', '/api/inventory/:slug/publish'],
};
