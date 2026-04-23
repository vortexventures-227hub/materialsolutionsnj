import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const footerSource = readFileSync(
  new URL('../src/components/layout/Footer.tsx', import.meta.url),
  'utf8'
);
const headerSource = readFileSync(
  new URL('../src/components/layout/Header.tsx', import.meta.url),
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
const aboutPageSource = readFileSync(
  new URL('../src/app/about/page.tsx', import.meta.url),
  'utf8'
);
const contactPageSource = readFileSync(
  new URL('../src/app/contact/page.tsx', import.meta.url),
  'utf8'
);
const servicesPageSource = readFileSync(
  new URL('../src/app/services/page.tsx', import.meta.url),
  'utf8'
);
const privacyPageSource = readFileSync(
  new URL('../src/app/privacy/page.tsx', import.meta.url),
  'utf8'
);
const termsPageSource = readFileSync(
  new URL('../src/app/terms/page.tsx', import.meta.url),
  'utf8'
);
const faqPageSource = readFileSync(
  new URL('../src/app/faq/page.tsx', import.meta.url),
  'utf8'
);
const rackingPageSource = readFileSync(
  new URL('../src/app/services/racking/page.tsx', import.meta.url),
  'utf8'
);
const wireGuidedPageSource = readFileSync(
  new URL('../src/app/services/wire-guided/page.tsx', import.meta.url),
  'utf8'
);
const oshaTrainingPageSource = readFileSync(
  new URL('../src/app/services/osha-training/page.tsx', import.meta.url),
  'utf8'
);

test('footer legal links point to live privacy and terms pages', () => {
  assert.match(footerSource, /href="\/privacy"/);
  assert.match(footerSource, /href="\/terms"/);
  assert.equal(existsSync(new URL('../src/app/privacy/page.tsx', import.meta.url)), true);
  assert.equal(existsSync(new URL('../src/app/terms/page.tsx', import.meta.url)), true);
});

test('header and footer contact CTAs resolve from shared contact details instead of hardcoded literals', () => {
  assert.match(headerSource, /import \{ CONTACT_DETAILS \} from '@\/lib\/contactDetails';/);
  assert.match(headerSource, /const phoneContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'phone'\)/);
  assert.match(headerSource, /const phoneLabel = phoneContact\?\.primary/);
  assert.match(headerSource, /const phoneHref = phoneContact\?\.href/);
  assert.doesNotMatch(headerSource, /href="tel:9735001010"/);
  assert.doesNotMatch(headerSource, /Call \(973\) 500-1010/);

  assert.match(footerSource, /import \{ CONTACT_DETAILS \} from '@\/lib\/contactDetails';/);
  assert.match(footerSource, /const phoneContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'phone'\)/);
  assert.match(footerSource, /const emailContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'mail'\)/);
  assert.doesNotMatch(footerSource, /href="tel:9735001010"/);
  assert.doesNotMatch(footerSource, /href="mailto:info@materialsolutionsnj\.com"/);
});

test('about, contact, and services pages route contact CTAs through shared CONTACT_DETAILS instead of hardcoded phone literals', () => {
  assert.match(aboutPageSource, /CONTACT_DETAILS/);
  assert.doesNotMatch(aboutPageSource, /href="tel:9735001010"/);
  assert.doesNotMatch(aboutPageSource, /href="mailto:info@materialsolutionsnj\.com"/);
  assert.doesNotMatch(aboutPageSource, /\(973\) 500-1010/);

  assert.match(contactPageSource, /CONTACT_DETAILS/);
  assert.doesNotMatch(contactPageSource, /href="tel:9735001010"/);
  assert.doesNotMatch(contactPageSource, /href="mailto:info@materialsolutionsnj\.com"/);
  assert.doesNotMatch(contactPageSource, /\(973\) 500-1010/);

  assert.match(servicesPageSource, /CONTACT_DETAILS/);
  assert.doesNotMatch(servicesPageSource, /href="tel:9735001010"/);
  assert.doesNotMatch(servicesPageSource, /\(973\) 500-1010/);
});

test('privacy, terms, and FAQ pages avoid stale phone copy while preserving direct-contact paths', () => {
  for (const pageSource of [privacyPageSource, termsPageSource, faqPageSource]) {
    assert.doesNotMatch(pageSource, /\(973\) 500-1010/);
    assert.doesNotMatch(pageSource, /href="tel:9735001010"/);
    assert.doesNotMatch(pageSource, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  }

  assert.match(privacyPageSource, /info@materialsolutionsnj\.com/);
  assert.match(termsPageSource, /info@materialsolutionsnj\.com/);
  assert.match(faqPageSource, /contact form/i);
  assert.match(faqPageSource, /David/i);
});

test('service detail pages route phone CTAs through shared CONTACT_DETAILS instead of hardcoded literals', () => {
  for (const pageSource of [rackingPageSource, wireGuidedPageSource, oshaTrainingPageSource]) {
    assert.match(pageSource, /CONTACT_DETAILS/);
    assert.match(pageSource, /const phoneContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'phone'\)/);
    assert.match(pageSource, /const phoneLabel = phoneContact\?\.primary/);
    assert.match(pageSource, /const phoneHref = phoneContact\?\.href/);
    assert.doesNotMatch(pageSource, /href="tel:9735001010"/);
    assert.doesNotMatch(pageSource, /\(973\) 500-1010/);
  }
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
