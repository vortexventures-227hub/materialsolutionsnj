import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../data/forklift-inventory.json';
import { findInventoryUnitBySlug } from '../src/lib/inventorySeo';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets';
import {
  normalizePublicPhoneHref,
  PUBLIC_PHONE_HREF,
  PUBLIC_PHONE_LABEL,
  resolvePublicPhoneContact,
} from '../src/lib/contactDetails';

test('locked inventory contact truth does not publish an unserviceable phone line', () => {
  assert.equal(inventorySource.inventory.contacts_2026_04_21.phone_public, 'Phone line not currently available — use info@materialsolutionsnj.com');
  assert.equal(PUBLIC_PHONE_LABEL, 'david@materialsolutionsnj.com');
  assert.equal(PUBLIC_PHONE_HREF, 'mailto:david@materialsolutionsnj.com');

  const unit = findInventoryUnitBySlug('rt-752r45tt-2018');
  assert.ok(unit, 'expected locked inventory unit to exist');

  const canonical = generateMarketingAssets(unit);
  assert.equal(canonical.contact_email_public, 'info@materialsolutionsnj.com');
  assert.equal(canonical.contact_phone_public, 'david@materialsolutionsnj.com');
});

test('public phone contact can only flip live through a valid phone env value', () => {
  assert.equal(normalizePublicPhoneHref('(848) 999-6854'), 'tel:+18489996854');
  assert.equal(normalizePublicPhoneHref('848.999.6854'), 'tel:+18489996854');
  assert.equal(normalizePublicPhoneHref('+1 848 999 6854'), 'tel:+18489996854');
  assert.equal(normalizePublicPhoneHref('not a phone'), null);

  assert.deepEqual(resolvePublicPhoneContact({
    NEXT_PUBLIC_DAVID_PHONE_NUMBER: '(848) 999-6854',
    NEXT_PUBLIC_DAVID_PHONE_LABEL: '(848) 999-6854',
  }), {
    href: 'tel:+18489996854',
    label: '(848) 999-6854',
    hasPublicPhone: true,
  });

  assert.deepEqual(resolvePublicPhoneContact({
    NEXT_PUBLIC_DAVID_PHONE_NUMBER: 'not live',
  }), {
    href: 'mailto:david@materialsolutionsnj.com',
    label: 'david@materialsolutionsnj.com',
    hasPublicPhone: false,
  });
});

test('llms.txt route publishes email fallback instead of the unserviceable public phone', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /^## Contact$/m);
  assert.match(body, /info@materialsolutionsnj\.com/i);
  assert.match(body, /^- Phone: Phone line not currently available — use info@materialsolutionsnj\.com$/m);
  assert.doesNotMatch(body, /\(848\) 999-6854/);
  assert.match(body, /Contact page: https:\/\/www\.materialsolutionsnj\.com\/contact/);
  assert.doesNotMatch(body, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  assert.doesNotMatch(body, /\(973\) 500-1010/);
});
