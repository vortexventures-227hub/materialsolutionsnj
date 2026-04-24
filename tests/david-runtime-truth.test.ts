import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { CONTACT_DETAILS } from '../src/lib/contactDetails';
import { SESSION_TIMEOUT_MESSAGE } from '../src/components/david/DavidWidget';
import { DAVID_SYSTEM_PROMPT } from '../src/lib/david/prompts';
import { DAVID_SYSTEM_PROMPT as MOUNTED_DAVID_SYSTEM_PROMPT } from '../src/lib/constants';
import { RATE_LIMIT_MESSAGES } from '../src/lib/ratelimit';
import { generateGreeting } from '../src/lib/david/core';

test('DAVID_SYSTEM_PROMPT does not promise unsupported follow-up or owner callbacks', () => {
  assert.doesNotMatch(DAVID_SYSTEM_PROMPT, /owner will follow up/i);
  assert.doesNotMatch(DAVID_SYSTEM_PROMPT, /owner will be in touch/i);
  assert.doesNotMatch(DAVID_SYSTEM_PROMPT, /within\s+30\s+minutes\s+to\s+12\s+hours/i);
  assert.doesNotMatch(DAVID_SYSTEM_PROMPT, /AI sales assistant/i);
});

test('mounted David system prompt avoids fabricated inventory-certainty claims', () => {
  assert.doesNotMatch(MOUNTED_DAVID_SYSTEM_PROMPT, /Current Stock:\s*~75 units available/i);
  assert.doesNotMatch(MOUNTED_DAVID_SYSTEM_PROMPT, /We've got several Raymond reach trucks in stock/i);
  // KB now has real April 2026 inventory data (AVAILABLE lot + HOLD units + FAQ + escalation policy).
  // Placeholder-era disclaimers ("Listings and availability change regularly", "We often carry
  // Raymond reach trucks", "latest availability on specific units") have been replaced by concrete
  // inventory sections and explicit HOLD-unit guidance: "I don't want to guess on something this
  // important." The doesNotMatch guards above remain as the authoritative no-fabrication contract.
});

test('generateGreeting keeps contact-page copy truthful about runtime capabilities', () => {
  const greeting = generateGreeting('contact');

  assert.doesNotMatch(greeting, /call you back/i);
  assert.doesNotMatch(greeting, /connected with the owner right away/i);
  assert.match(greeting, /answer questions/i);
  assert.match(greeting, /(phone|email|contact)/i);
});

test('rate-limit, timeout, and David prompt copy use current public contact truth', () => {
  assert.doesNotMatch(DAVID_SYSTEM_PROMPT, /\(973\) 500-1010/);
  assert.doesNotMatch(DAVID_SYSTEM_PROMPT, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  assert.doesNotMatch(DAVID_SYSTEM_PROMPT, /phone.*still pending provisioning/i);
  assert.match(DAVID_SYSTEM_PROMPT, /\(973\) 625-5000/);
  assert.match(DAVID_SYSTEM_PROMPT, /info@materialsolutionsnj\.com/);
  assert.match(DAVID_SYSTEM_PROMPT, /contact form/i);

  for (const key of [
    'daily_cap',
    'ip_daily_limit',
    'visitor_session_limit',
    'session_timeout',
    'visitor_daily_messages',
    'repeated_messages',
    'gibberish',
    'abuse_long_input',
  ] as const) {
    assert.doesNotMatch(RATE_LIMIT_MESSAGES[key].message, /Bill will follow up/i);
    assert.doesNotMatch(RATE_LIMIT_MESSAGES[key].message, /\(973\) 500-1010/);
    assert.doesNotMatch(RATE_LIMIT_MESSAGES[key].message, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
    assert.match(RATE_LIMIT_MESSAGES[key].message, /(info@materialsolutionsnj\.com|contact form)/i);
  }

  assert.doesNotMatch(SESSION_TIMEOUT_MESSAGE, /Bill will follow up/i);
  assert.doesNotMatch(SESSION_TIMEOUT_MESSAGE, /\(973\) 500-1010/);
  assert.doesNotMatch(SESSION_TIMEOUT_MESSAGE, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  assert.match(SESSION_TIMEOUT_MESSAGE, /info@materialsolutionsnj\.com/i);
  assert.match(SESSION_TIMEOUT_MESSAGE, /contact form/i);
});

test('contact page contact-details cards avoid unsupported AI-labeling and response-time promises', () => {
  const emailCard = CONTACT_DETAILS.find((detail) => detail.title === 'Email Us');
  const hoursCard = CONTACT_DETAILS.find((detail) => detail.title === 'Business Hours');

  assert.ok(emailCard);
  assert.ok(hoursCard);
  assert.doesNotMatch(emailCard.secondary, /within a few hours/i);
  assert.match(emailCard.secondary, /direct help/i);
  assert.doesNotMatch(hoursCard.secondary, /David \(AI\)/i);
  assert.doesNotMatch(hoursCard.secondary, /24\/7/i);
  assert.match(hoursCard.secondary, /Use David chat for equipment questions or contact the team directly/i);
});

test('contact page avoids unsupported owner-review or Bill-availability promises', () => {
  const contactPageSource = readFileSync(
    new URL('../src/app/contact/page.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(contactPageSource, /I personally review every inquiry that comes through/i);
  assert.doesNotMatch(contactPageSource, /Bill:\s*Mon[–-]Fri,\s*8AM[–-]6PM\s*EST/i);
  assert.doesNotMatch(contactPageSource, /David \(AI\) is available 24 hours a day, 7 days a week/i);
  assert.doesNotMatch(contactPageSource, /available 24 hours a day, 7 days a week/i);
  assert.match(contactPageSource, /our team reviews the\s+details/i);
  assert.match(contactPageSource, /Phone support:\s*Mon[–-]Fri,\s*8AM[–-]6PM\s*EST/i);
  assert.match(contactPageSource, /Use David chat for equipment questions or contact the team directly/i);
});

test('about page avoids implying direct owner access from the phone path', () => {
  const aboutPageSource = readFileSync(
    new URL('../src/app/about/page.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(aboutPageSource, /you(?:&apos;|')re getting direct access to one of the most experienced narrow aisle specialists/i);
  assert.match(aboutPageSource, /you(?:&apos;|')ll reach a team that can help you get/i);
  assert.match(aboutPageSource, /right equipment information and next steps/i);
});

test('legacy chat greeting copies no longer promise direct follow-up', () => {
  const mountedWidgetSource = readFileSync(
    new URL('../src/components/david/hooks/useDavidConvo.ts', import.meta.url),
    'utf8'
  );
  const legacyWidgetSource = readFileSync(
    new URL('../src/components/david/ChatWidget.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(mountedWidgetSource, /direct follow-up/i);
  assert.doesNotMatch(mountedWidgetSource, /equipment specialist at Material Solutions/i);
  assert.doesNotMatch(mountedWidgetSource, /I know every unit we've got/i);
  assert.doesNotMatch(legacyWidgetSource, /direct follow-up/i);
  assert.match(mountedWidgetSource, /direct help from the team/i);
  assert.match(mountedWidgetSource, /compare current listings/i);
  assert.match(legacyWidgetSource, /direct help from the team/i);
});

test('homepage David hero opens the mounted chat store instead of dispatching the legacy david:open event', () => {
  const davidHeroSource = readFileSync(
    new URL('../src/components/david/DavidHero.tsx', import.meta.url),
    'utf8'
  );

  assert.match(davidHeroSource, /useChatStore/);
  assert.match(davidHeroSource, /openChat\(\)/);
  assert.doesNotMatch(davidHeroSource, /david:open/);
});

test('legacy global event wiring is removed from the storefront widget source', () => {
  const davidWidgetSource = readFileSync(
    new URL('../src/components/david/DavidWidget.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(davidWidgetSource, /david:open/);
  assert.match(davidWidgetSource, /Buyer-facing CTAs now open the mounted Zustand chat runtime directly/);
});

test('root metadata avoids unsupported AI-powered and listing-verified claims', () => {
  const layoutSource = readFileSync(
    new URL('../src/app/layout.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(layoutSource, /AI-Powered Forklift Sales/);
  assert.doesNotMatch(layoutSource, /AI-powered equipment solutions/i);
  assert.doesNotMatch(layoutSource, /Every forklift AI-analyzed/i);
  assert.doesNotMatch(layoutSource, /every listing verified/i);
  assert.match(layoutSource, /Current inventory, equipment sales, and buyer support for New Jersey warehouses/i);
  assert.match(layoutSource, /Talk to David for equipment questions or contact the team directly/i);
});

test('Meet David homepage copy avoids unsupported omniscience and inventory-review claims', () => {
  const meetDavidSource = readFileSync(
    new URL('../src/components/home/MeetDavid.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(meetDavidSource, /your AI sales specialist/i);
  assert.doesNotMatch(meetDavidSource, /I've reviewed our inventory/i);
  assert.doesNotMatch(meetDavidSource, /David knows every forklift in our inventory inside and out/i);
  assert.doesNotMatch(meetDavidSource, /Material Solutions expertise built into his AI/i);
  assert.doesNotMatch(meetDavidSource, /Every spec, history, and detail about our entire inventory at his fingertips/i);
  assert.doesNotMatch(meetDavidSource, /We have several in stock ranging from \$16,500 to \$19,200/i);
  assert.doesNotMatch(meetDavidSource, /The newest one has only 1,450 hours/i);
  assert.doesNotMatch(meetDavidSource, /Online now/i);
  assert.match(meetDavidSource, /Your Equipment Guide/i);
  assert.match(meetDavidSource, /I can help you browse current listings, compare equipment types, and connect you with our team for pricing or next steps/i);
  assert.match(meetDavidSource, /I can help you compare the current listings and point you to the team for live pricing on the units that fit your operation/i);
  assert.doesNotMatch(meetDavidSource, /Chat available/i);
  assert.match(meetDavidSource, /Chat preview/i);
  assert.match(meetDavidSource, /David helps buyers explore current inventory, ask equipment questions, and reach\s+the team for next steps/i);
});

test('buyer-facing home/about/contact copy avoids unsupported AI-specialist and AI-analysis claims', () => {
  const aboutPageSource = readFileSync(
    new URL('../src/app/about/page.tsx', import.meta.url),
    'utf8'
  );
  const servicesPageSource = readFileSync(
    new URL('../src/app/services/page.tsx', import.meta.url),
    'utf8'
  );
  const howItWorksSource = readFileSync(
    new URL('../src/components/home/HowItWorks.tsx', import.meta.url),
    'utf8'
  );
  const testimonialsSource = readFileSync(
    new URL('../src/components/home/Testimonials.tsx', import.meta.url),
    'utf8'
  );
  const contactPageSource = readFileSync(
    new URL('../src/app/contact/page.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(aboutPageSource, /AI-Powered Customer Experience/i);
  assert.doesNotMatch(aboutPageSource, /AI equipment specialist/i);
  assert.doesNotMatch(aboutPageSource, /~75\s*['"]?,?\s*label:\s*['"]Units in Stock/i);
  assert.doesNotMatch(aboutPageSource, /50-75 reconditioned units in stock at all times/i);
  assert.doesNotMatch(aboutPageSource, /roughly 50-75 reconditioned units/i);
  assert.match(aboutPageSource, /Digital Buyer Support/i);
  assert.match(aboutPageSource, /help buyers browse listings, ask equipment questions, and reach the team faster after hours/i);
  assert.match(aboutPageSource, /value:\s*['"]Live['"],\s*label:\s*['"]Listings Updated['"]/i);
  assert.match(aboutPageSource, /Current listings updated regularly/i);

  assert.doesNotMatch(servicesPageSource, /50-75 reconditioned units in stock/i);
  assert.match(servicesPageSource, /Current listings updated regularly/i);

  assert.doesNotMatch(howItWorksSource, /Talk to an Expert/i);
  assert.doesNotMatch(howItWorksSource, /our AI assistant/i);
  assert.match(howItWorksSource, /Talk to the Team/i);
  assert.match(howItWorksSource, /chat with David any time for equipment questions, current listing guidance, and a direct path to the team/i);

  assert.doesNotMatch(testimonialsSource, /AI analysis was eye-opening/i);
  assert.match(testimonialsSource, /The equipment notes helped us spot the right fit quickly/i);

  assert.doesNotMatch(contactPageSource, /Our AI equipment specialist is available 24\/7/i);
  assert.doesNotMatch(contactPageSource, /Get instant answers about pricing, availability, specs, and more/i);
  assert.doesNotMatch(contactPageSource, /Or chat with David now for instant help/i);
  assert.doesNotMatch(contactPageSource, /Online now/i);
  assert.doesNotMatch(contactPageSource, /available 24\/7/i);
  assert.match(contactPageSource, /Use David chat to browse inventory, ask equipment questions,\s+and reach the right team contact/i);
  assert.match(contactPageSource, /Or chat with David now for equipment questions and team contact help/i);
  assert.match(contactPageSource, /David chat/i);
});

test('fallback listing sample copy avoids AI-analysis and computer-vision claims', () => {
  const inventoryDetailSource = readFileSync(
    new URL('../src/components/inventory/InventoryDetailClient.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(inventoryDetailSource, /Our AI analysis detected/i);
  assert.doesNotMatch(inventoryDetailSource, /computer vision analysis/i);
  assert.match(inventoryDetailSource, /from the current listing data/i);
  assert.match(inventoryDetailSource, /according to the current listing information/i);
});

test('David widget chrome avoids unsupported AI-specialist and instant-reply claims', () => {
  const davidHeroSource = readFileSync(
    new URL('../src/components/david/DavidHero.tsx', import.meta.url),
    'utf8'
  );
  const davidChatWidgetSource = readFileSync(
    new URL('../src/components/david/DavidChatWidget.tsx', import.meta.url),
    'utf8'
  );
  const davidWidgetSource = readFileSync(
    new URL('../src/components/david/DavidWidget.tsx', import.meta.url),
    'utf8'
  );
  const legacyChatWidgetSource = readFileSync(
    new URL('../src/components/david/ChatWidget.tsx', import.meta.url),
    'utf8'
  );
  const davidVideoSource = readFileSync(
    new URL('../src/components/david/DavidVideo.tsx', import.meta.url),
    'utf8'
  );
  const statsBarSource = readFileSync(
    new URL('../src/components/home/StatsBar.tsx', import.meta.url),
    'utf8'
  );
  const phoneContact = CONTACT_DETAILS.find((detail) => detail.icon === 'phone');
  const emailContact = CONTACT_DETAILS.find((detail) => detail.icon === 'mail');

  assert.ok(phoneContact, 'expected shared phone contact details');
  assert.ok(emailContact, 'expected shared email contact details');

  assert.doesNotMatch(davidHeroSource, /AI Equipment Specialist/i);
  assert.match(davidHeroSource, /Equipment Guide/i);

  assert.doesNotMatch(davidChatWidgetSource, /AI Sales Specialist/i);
  assert.doesNotMatch(davidChatWidgetSource, /our team will follow up/i);
  assert.match(davidChatWidgetSource, /Equipment Guide/i);
  assert.match(davidChatWidgetSource, /Use the contact form or call us if you need team follow-up/i);
  assert.match(davidChatWidgetSource, /runtimeMetadata\?\.callbackCaptureState/i);
  assert.match(davidChatWidgetSource, /Session Actions/i);
  assert.match(davidChatWidgetSource, /actionReceipts\.length > 0/i);
  assert.match(davidChatWidgetSource, /operator_alert_dispatched/i);
  assert.match(davidChatWidgetSource, /import \{ CONTACT_DETAILS \} from '@\/lib\/contactDetails';/);
  assert.match(davidChatWidgetSource, /const phoneContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'phone'\)/);
  assert.match(davidChatWidgetSource, /const emailContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'mail'\)/);
  assert.match(davidChatWidgetSource, /const emailLabel = emailContact\?\.primary \?\? 'info@materialsolutionsnj\.com'/);
  assert.match(davidChatWidgetSource, /const isPhoneUnprovisioned = !phoneContact\?\.href\?\.startsWith\('tel:'\)/);
  // Guard comment explaining why href check is used instead of primary
  assert.match(davidChatWidgetSource, /avoid false "Call now" with a mailto link/);
  assert.match(davidChatWidgetSource, /const immediateHelpMessage = isPhoneUnprovisioned/);
  assert.match(davidChatWidgetSource, /Email \$\{emailLabel\} or use the contact form if you need immediate help\./);
  assert.match(davidChatWidgetSource, /Call \$\{phoneContact!\.primary\} or email \$\{emailLabel\} if you need immediate help\./);
  assert.match(davidChatWidgetSource, /const immediateHelpHref = isPhoneUnprovisioned \? `mailto:\${emailLabel}` : \(phoneContact!\.href \?\? `mailto:\${emailLabel}`\)/);
  assert.match(davidChatWidgetSource, /const immediateHelpLabel = isPhoneUnprovisioned \? 'Email now' : 'Call now'/);
  assert.match(davidChatWidgetSource, /Your callback request was received in this chat\. \$\{immediateHelpMessage\}/);
  assert.match(davidChatWidgetSource, /We couldn't confirm your callback request was saved\. Please email \$\{emailLabel\}, or use the contact form so the team gets it directly\./);
  assert.match(davidChatWidgetSource, /href=\{callbackBanner\.tone === 'emerald' \? immediateHelpHref : '\/contact\?source=david-callback-recovery'\}/);
  assert.match(davidChatWidgetSource, /\{callbackBanner\.tone === 'emerald' \? immediateHelpLabel : 'Contact us'\}/);
  assert.doesNotMatch(davidChatWidgetSource, /call \$\{emailLabel\}/i);
  assert.doesNotMatch(davidChatWidgetSource, /tel:\+197\*\*\*\*1010/);

  assert.doesNotMatch(davidWidgetSource, /AI Equipment Specialist/i);
  assert.doesNotMatch(davidWidgetSource, /Replies instantly/i);
  assert.doesNotMatch(davidWidgetSource, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  assert.match(davidWidgetSource, /import \{ CONTACT_DETAILS \} from '@\/lib\/contactDetails';/);
  assert.match(davidWidgetSource, /const phoneContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'phone'\)/);
  assert.match(davidWidgetSource, /const emailContact = CONTACT_DETAILS\.find\(\(detail\) => detail\.icon === 'mail'\)/);
  assert.match(davidWidgetSource, new RegExp(phoneContact.primary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(davidWidgetSource, new RegExp(emailContact.primary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(davidWidgetSource, /Equipment questions &middot; Team contact help/i);
  assert.match(davidWidgetSource, /Equipment Guide/i);

  assert.doesNotMatch(legacyChatWidgetSource, /equipment specialist at Material Solutions/i);
  assert.doesNotMatch(legacyChatWidgetSource, /I know every unit we've got/i);
  assert.doesNotMatch(legacyChatWidgetSource, /Replies instantly/i);
  assert.match(legacyChatWidgetSource, /help with equipment questions and point you to the team/i);
  assert.match(legacyChatWidgetSource, /compare current listings or point you to the team for pricing and next steps/i);
  assert.match(legacyChatWidgetSource, /Equipment questions &middot; Team contact help/i);
  assert.match(legacyChatWidgetSource, /Equipment Guide/i);

  assert.doesNotMatch(davidVideoSource, /Equipment Specialist/i);
  assert.match(davidVideoSource, /Equipment Guide/i);

  assert.doesNotMatch(statsBarSource, /David AI Available/i);
  assert.match(statsBarSource, /David Chat Available/i);
});
