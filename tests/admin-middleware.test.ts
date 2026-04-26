import assert from 'node:assert/strict';
import test from 'node:test';

import { NextRequest } from 'next/server';

import { isAdminGateOpen, isAdminRequest, middleware } from '../src/middleware.ts';

function makeRequest(path: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(path, 'https://www.materialsolutionsnj.com'), init);
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

test('admin request matcher protects admin pages and publish POST routes only', () => {
  assert.equal(isAdminRequest('/admin'), true);
  assert.equal(isAdminRequest('/admin/paste-queue'), true);
  assert.equal(isAdminRequest('/admin/david/pending-responses/abc'), true);
  assert.equal(isAdminRequest('/api/marketing/publish'), true);
  assert.equal(isAdminRequest('/api/inventory/rt-752r45tt-2018/publish'), true);
  assert.equal(isAdminRequest('/inventory'), false);
  assert.equal(isAdminRequest('/administrator'), false);
  assert.equal(isAdminRequest('/api/inventory/publish/preview'), false);
});

test('publish POST middleware returns 404 without a valid token', () => {
  withEnv('secret-token', () => {
    const marketingResponse = middleware(makeRequest('/api/marketing/publish?token=wrong', { method: 'POST' }));
    const inventoryResponse = middleware(makeRequest('/api/inventory/rt-752r45tt-2018/publish', { method: 'POST' }));

    assert.equal(marketingResponse.status, 404);
    assert.equal(inventoryResponse.status, 404);
    assert.equal(marketingResponse.headers.get('Cache-Control'), 'no-store');
    assert.equal(marketingResponse.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  });
});

test('publish POST middleware allows valid token and does not protect preview routes', () => {
  withEnv('secret-token', () => {
    const marketingResponse = middleware(makeRequest('/api/marketing/publish?token=secret-token', { method: 'POST' }));
    const inventoryResponse = middleware(makeRequest('/api/inventory/rt-752r45tt-2018/publish?token=secret-token', { method: 'POST' }));
    const previewResponse = middleware(makeRequest('/api/inventory/publish/preview'));

    assert.equal(marketingResponse.status, 200);
    assert.equal(inventoryResponse.status, 200);
    assert.equal(previewResponse.status, 200);
  });
});

test('admin gate fails closed in production when the token env is missing', () => {
  withEnv(undefined, () => {
    assert.equal(isAdminGateOpen(makeRequest('/admin/paste-queue?token=anything')), false);
  });
});

test('admin middleware returns 404 without a valid token', () => {
  withEnv('secret-token', () => {
    const response = middleware(makeRequest('/admin/listing-status?token=wrong'));

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  });
});

test('admin middleware allows a valid query token and stores an admin cookie', () => {
  withEnv('secret-token', () => {
    const response = middleware(makeRequest('/admin/paste-queue?token=secret-token'));

    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie') ?? '', /msnj_admin_token=secret-token/);
    assert.match(response.headers.get('set-cookie') ?? '', /HttpOnly/);
  });
});

test('admin gate accepts a previously issued admin cookie', () => {
  withEnv('secret-token', () => {
    const request = makeRequest('/admin/paste-queue');
    request.cookies.set('msnj_admin_token', 'secret-token');

    assert.equal(isAdminGateOpen(request), true);
  });
});
