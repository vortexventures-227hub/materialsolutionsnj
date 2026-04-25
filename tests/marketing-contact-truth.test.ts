import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../data/forklift-inventory.json';
import { findInventoryUnitBySlug } from '../src/lib/inventorySeo';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets';
import { PUBLIC_PHONE_HREF, PUBLIC_PHONE_LABEL } from '../src/lib/contactDetails';

test('locked inventory contact truth uses the live public phone across inventory source, canonical assets, and CTA constants', () => {
  assert.equal(inventorySource.inventory.contacts_2026_04_21.phone_public, '(848) 999-6854');
  assert.equal(PUBLIC_PHONE_LABEL, '(848) 999-6854');
  assert.equal(PUBLIC_PHONE_HREF, 'tel:+18489996854');

  const unit = findInventoryUnitBySlug('rt-752r45tt-2018');
  assert.ok(unit, 'expected locked inventory unit to exist');

  const canonical = generateMarketingAssets(unit);
  assert.equal(canonical.contact_email_public, 'info@materialsolutionsnj.com');
  assert.equal(canonical.contact_phone_public, '(848) 999-6854');
});

test('llms.txt route publishes the live public phone alongside the public email contact path', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /^## Contact$/m);
  assert.match(body, /info@materialsolutionsnj\.com/i);
  assert.match(body, /^- Phone: \(848\) 999-6854$/m);
  assert.match(body, /Contact page: https:\/\/www\.materialsolutionsnj\.com\/contact/);
  assert.doesNotMatch(body, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  assert.doesNotMatch(body, /\(973\) 500-1010/);
});
