import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const footerSource = readFileSync(
  new URL('../src/components/layout/Footer.tsx', import.meta.url),
  'utf8'
);
const chatWidgetSource = readFileSync(
  new URL('../src/components/david/ChatWidget.tsx', import.meta.url),
  'utf8'
);
const davidRouteSource = readFileSync(
  new URL('../src/app/api/david/route.ts', import.meta.url),
  'utf8'
);

test('footer legal links point to live privacy and terms pages', () => {
  assert.match(footerSource, /href="\/privacy"/);
  assert.match(footerSource, /href="\/terms"/);
  assert.equal(existsSync(new URL('../src/app/privacy/page.tsx', import.meta.url)), true);
  assert.equal(existsSync(new URL('../src/app/terms/page.tsx', import.meta.url)), true);
});

test('legacy ChatWidget uses the canonical non-streaming David message route', () => {
  assert.doesNotMatch(chatWidgetSource, /fetch\('\/api\/david'\)/);
  assert.match(chatWidgetSource, /fetch\('\/api\/david\/message'/);
  assert.match(chatWidgetSource, /sessionId:\s*visitorId/);
});

test('legacy /api/david route is fenced to the canonical /api/david/message handler', () => {
  assert.match(davidRouteSource, /POST as postDavidMessage/);
  assert.match(davidRouteSource, /export const POST = postDavidMessage/);
  assert.match(davidRouteSource, /canonical_message_route:\s*'\/api\/david\/message'/);
  assert.match(davidRouteSource, /streaming_route:\s*'\/api\/david\/chat'/);
});

test('/api/david GET declares itself legacy_alias and names the authoritative streaming route', () => {
  assert.match(davidRouteSource, /status:\s*'legacy_alias'/);
  assert.match(davidRouteSource, /streaming_route:\s*'\/api\/david\/chat'/);
  // the /api/david descriptor uses canonical_message_route (its own alias field),
  // distinct from /api/david/chat's canonical_json_fallback_route
  assert.match(davidRouteSource, /canonical_message_route:\s*'\/api\/david\/message'/);
});
