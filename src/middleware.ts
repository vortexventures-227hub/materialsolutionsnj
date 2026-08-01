import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'msnj_admin_token';
const TOKEN_PARAM = 'token';
const TOKEN_HEADER = 'x-msnj-admin-token';
export const RETIREMENT_PATH = '/retired';

const RETIREMENT_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Material Solutions NJ</title>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b1016; color: #edf2f7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { width: min(100% - 3rem, 42rem); padding: 3rem; border: 1px solid #2b3642; border-radius: 1rem; background: #121a23; box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, .25); }
      p { max-width: 36rem; color: #c4ced8; font-size: 1.05rem; line-height: 1.65; }
      .eyebrow { margin: 0 0 .9rem; color: #91a4b8; font-size: .78rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(2rem, 6vw, 3.5rem); letter-spacing: -.04em; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Material Solutions NJ</p>
      <h1>This website is no longer active.</h1>
      <p>Material Solutions NJ is no longer accepting inventory, sales, service, training, or contact requests through this website.</p>
      <p>The domain is being retained while its legacy content is transitioned responsibly.</p>
    </main>
  </body>
</html>`;

function retiredResponse(): NextResponse {
  return new NextResponse(RETIREMENT_HTML, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function unavailableResponse(): NextResponse {
  return new NextResponse('This service is no longer available.', {
    status: 410,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function robotsResponse(): NextResponse {
  return new NextResponse('User-agent: *\nAllow: /\n', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function emptySitemapResponse(): NextResponse {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function extractBearerToken(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function getAdminTokenFromRequest(request: NextRequest): string | null {
  return (
    request.nextUrl.searchParams.get(TOKEN_PARAM)?.trim() ||
    request.headers.get(TOKEN_HEADER)?.trim() ||
    extractBearerToken(request.headers.get('authorization')) ||
    request.cookies.get(ADMIN_COOKIE_NAME)?.value?.trim() ||
    null
  );
}

export function isAdminRequest(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isPublishPostRequest(pathname: string, method: string): boolean {
  if (method.toUpperCase() !== 'POST') return false;
  return pathname === '/api/marketing/publish' || /^\/api\/inventory\/[^/]+\/publish$/.test(pathname);
}

export function shouldProtectRequest(request: NextRequest): boolean {
  return isAdminRequest(request.nextUrl.pathname) || isPublishPostRequest(request.nextUrl.pathname, request.method);
}

export function isAdminGateOpen(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASTE_QUEUE_TOKEN?.trim();

  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }

  return getAdminTokenFromRequest(request) === expected;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === RETIREMENT_PATH) return retiredResponse();
  if (pathname === '/robots.txt') return robotsResponse();
  if (pathname === '/sitemap.xml') return emptySitemapResponse();
  if (pathname === '/llms.txt') {
    return new NextResponse('# Material Solutions NJ\n\nThis legacy website is no longer active.\n', {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return unavailableResponse();

  // Temporary redirects retain the legacy URLs until each has a truthful,
  // equivalent Forklift Haven destination. Do not replace these with blanket 301s.
  const destination = request.nextUrl.clone();
  destination.pathname = RETIREMENT_PATH;
  destination.search = '';
  const response = NextResponse.redirect(destination, 307);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
