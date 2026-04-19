import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { resolveAppOrigin } from '../src/lib/api/leads';

// ---------- Blocker 1: NEXT_PUBLIC_APP_URL misroute ----------

test('resolveAppOrigin extracts origin from a Request on a non-3000 port', () => {
  const req = new Request('http://localhost:4500/api/david/chat', {
    method: 'POST',
  });
  assert.equal(resolveAppOrigin(req), 'http://localhost:4500');
});

test('resolveAppOrigin extracts origin from a production Request', () => {
  const req = new Request('https://materialsolutionsnj.com/api/david/chat', {
    method: 'POST',
  });
  assert.equal(resolveAppOrigin(req), 'https://materialsolutionsnj.com');
});

test('resolveAppOrigin falls back to env var when no request is provided', () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = 'https://staging.example.com';
  try {
    assert.equal(resolveAppOrigin(), 'https://staging.example.com');
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prev;
  }
});

test('resolveAppOrigin falls back to localhost:3000 as last resort', () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  try {
    assert.equal(resolveAppOrigin(), 'http://localhost:3000');
  } finally {
    if (prev !== undefined) process.env.NEXT_PUBLIC_APP_URL = prev;
  }
});

test('chat handler uses resolveAppOrigin for inventory and listing self-calls (no hardcoded localhost:3000)', () => {
  const handlerSource = readFileSync(
    new URL('../src/app/api/david/chat/handler.ts', import.meta.url),
    'utf8'
  );

  const hardcodedPattern = /process\.env\.NEXT_PUBLIC_APP_URL\s*\|\|\s*['"]http:\/\/localhost:3000['"]/;
  assert.doesNotMatch(
    handlerSource,
    hardcodedPattern,
    'chat handler must not hardcode localhost:3000 fallback for self-calls'
  );

  assert.match(handlerSource, /resolveAppOrigin/);
});

test('submitLead accepts a baseUrl option (no hardcoded self-call path)', () => {
  const leadsSource = readFileSync(
    new URL('../src/lib/api/leads.ts', import.meta.url),
    'utf8'
  );

  assert.match(leadsSource, /baseUrl/);
  assert.match(leadsSource, /options\?\.baseUrl/);
});

test('/api/david/message threads request origin into getDavidResponse lead capture path', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/david/message/route.ts', import.meta.url),
    'utf8'
  );
  const coreSource = readFileSync(
    new URL('../src/lib/david/core.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /const appUrl = resolveAppOrigin\(request\)/);
  assert.match(routeSource, /baseUrl:\s*appUrl/);
  assert.match(coreSource, /baseUrl\?:\s*string/);
  assert.match(coreSource, /submitLead\(leadSubmission,\s*\{\s*baseUrl:\s*context\.baseUrl\s*\}\)/);
});

// ---------- Blocker 2: /api/david/message masks lead persistence failure ----------

test('/api/david/message response schema includes leadPersisted field', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/david/message/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /leadPersisted/);
  assert.match(routeSource, /leadPersisted\s*=\s*false/);
  assert.match(routeSource, /let\s+leadPersisted\s*=\s*true/);
});

test('/api/david/message does not mask contact-info persistence failure behind 200 success', () => {
  const routeSource = readFileSync(
    new URL('../src/app/api/david/message/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(routeSource, /if \(!leadPersisted && hasContactInfo\)/);
  assert.match(routeSource, /Lead capture persistence failed/);
  assert.match(routeSource, /status:\s*503/);
});

// ---------- Blocker 3: /api/david/health provider-readiness truth ----------

test('health route verifies Anthropic auth with a real API call, not just existence', () => {
  const healthSource = readFileSync(
    new URL('../src/app/api/david/health/route.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(
    healthSource,
    /^.*!!process\.env\.ANTHROPIC_API_KEY.*$/m,
    'health route must not rely solely on key existence'
  );

  assert.match(healthSource, /api\.anthropic\.com/);
  assert.match(healthSource, /x-api-key/);
  assert.match(healthSource, /verifyAnthropicAuth/);
  assert.match(healthSource, /401/);
  assert.match(healthSource, /403/);
});

test('health route also verifies Gemini auth and documents the split David contract', () => {
  const healthSource = readFileSync(
    new URL('../src/app/api/david/health/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(healthSource, /verifyGeminiAuth/);
  assert.match(healthSource, /generativelanguage\.googleapis\.com/);
  assert.match(healthSource, /GEMINI_API_KEY failed authentication/);
  assert.match(healthSource, /Mounted \/api\/david\/chat depends on Anthropic/);
  assert.match(healthSource, /Fallback \/api\/david\/message depends on Gemini/);
  assert.match(healthSource, /anthropic/);
  assert.match(healthSource, /gemini/);
  assert.match(healthSource, /offline/);
  assert.match(healthSource, /degraded/);
});

// ---------- Blocker 4: dual-surface contract documentation ----------

test('canonical message route documents dual-surface contract identity', () => {
  const messageRouteSource = readFileSync(
    new URL('../src/app/api/david/message/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(messageRouteSource, /CANONICAL David message route/i);
  assert.match(messageRouteSource, /AUTHORITATIVE mounted streaming surface/i);
  assert.match(messageRouteSource, /Do not merge these two routes/i);
});

test('streaming chat route documents authoritative mounted status', () => {
  const chatRouteSource = readFileSync(
    new URL('../src/app/api/david/chat/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(chatRouteSource, /Authoritative mounted streaming route/i);
  assert.match(chatRouteSource, /mounted_widget_route/);
  assert.match(chatRouteSource, /canonical_json_fallback_route/);
});
