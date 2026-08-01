import assert from 'node:assert/strict';
import test from 'node:test';

import { NextRequest } from 'next/server';

import { config, isAdminGateOpen, isAdminRequest, middleware, RETIREMENT_PATH, shouldProtectRequest } from '../src/middleware.ts';

function makeRequest(path: string, method = 'GET'): NextRequest {
  return new NextRequest(new URL(path, 'https://www.materialsolutionsnj.com'), { method });
}

function withEnv<T>(value: string | undefined, run: () => T): T {
  const previous = process.env.ADMIN_PASTE_QUEUE_TOKEN;
  const previousNodeEnv = process.env.NODE_ENV;

  if (value === undefined) delete process.env.ADMIN_PASTE_QUEUE_TOKEN;
  else process.env.ADMIN_PASTE_QUEUE_TOKEN = value;

  process.env.NODE_ENV = 'production';

  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PASTE_QUEUE_TOKEN;
    else process.env.ADMIN_PASTE_QUEUE_TOKEN = previous;

    process.env.NODE_ENV = previousNodeEnv;
  }
}

test('admin request matcher only targets the admin route family', () => {
  assert.equal(isAdminRequest('/admin'), true);
  assert.equal(isAdminRequest('/admin/paste-queue'), true);
  assert.equal(isAdminRequest('/admin/david/pending-responses/abc'), true);
  assert.equal(isAdminRequest('/api/marketing/publish'), false);
  assert.equal(isAdminRequest('/api/inventory/rt-752r45tt-2018/publish'), false);
  assert.equal(isAdminRequest('/inventory'), false);
  assert.equal(isAdminRequest('/administrator'), false);
});

test('middleware protects admin routes and side-effectful publish POST routes only', () => {
  assert.equal(shouldProtectRequest(makeRequest('/admin')), true);
  assert.equal(shouldProtectRequest(makeRequest('/admin/paste-queue')), true);
  assert.equal(shouldProtectRequest(makeRequest('/api/marketing/publish', 'POST')), true);
  assert.equal(shouldProtectRequest(makeRequest('/api/inventory/rt-752r45tt-2018/publish', 'POST')), true);
  assert.equal(shouldProtectRequest(makeRequest('/api/marketing/publish', 'GET')), false);
  assert.equal(shouldProtectRequest(makeRequest('/api/inventory/rt-752r45tt-2018/publish', 'GET')), false);
  assert.equal(shouldProtectRequest(makeRequest('/api/inventory/rt-752r45tt-2018/publish/preview', 'POST')), false);
});

test('middleware applies the retirement surface to every public path', () => {
  assert.deepEqual(config.matcher, ['/((?!_next/static|_next/image).*)']);
});

test('admin gate fails closed in production when the token env is missing', () => {
  withEnv(undefined, () => {
    assert.equal(isAdminGateOpen(makeRequest('/admin/paste-queue?token=anything')), false);
  });
});

test('legacy pages temporarily redirect to the retirement page', () => {
  const response = middleware(makeRequest('/inventory/rt-752r45tt-2018'));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), `https://www.materialsolutionsnj.com${RETIREMENT_PATH}`);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('the retirement page is not indexable and does not render the old application', async () => {
  const response = middleware(makeRequest(RETIREMENT_PATH));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.match(await response.text(), /no longer active/);
});

test('all non-read requests are permanently unavailable', () => {
  const response = middleware(makeRequest('/api/leads', 'POST'));

  assert.equal(response.status, 410);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('robots remains crawlable while sitemap no longer advertises live content', async () => {
  const robots = middleware(makeRequest('/robots.txt'));
  const sitemap = middleware(makeRequest('/sitemap.xml'));

  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Allow: \/$/m);
  assert.equal(sitemap.status, 200);
  assert.equal(sitemap.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.doesNotMatch(await sitemap.text(), /materialsolutionsnj\.com/);
});

test('admin gate accepts a previously issued admin cookie', () => {
  withEnv('secret-token', () => {
    const request = makeRequest('/admin/paste-queue');
    request.cookies.set('msnj_admin_token', 'secret-token');

    assert.equal(isAdminGateOpen(request), true);
  });
});
