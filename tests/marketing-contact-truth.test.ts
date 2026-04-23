import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../data/forklift-inventory.json';
import { findInventoryUnitBySlug } from '../src/lib/inventorySeo';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets';

test('locked inventory contact truth keeps the phone placeholder instead of a fake public number', () => {
  assert.equal(
    inventorySource.inventory.contacts_2026_04_21.phone_public,
    '{{DAVID_PHONE_PENDING_PROVISION}}'
  );

  const unit = findInventoryUnitBySlug('rt-752r45tt-2018');
  assert.ok(unit, 'expected locked inventory unit to exist');

  const canonical = generateMarketingAssets(unit);
  assert.equal(canonical.contact_email_public, 'info@materialsolutionsnj.com');
  assert.equal(canonical.contact_phone_public, '{{DAVID_PHONE_PENDING_PROVISION}}');
});

test('llms.txt route omits a Phone line while the public phone remains pending provision', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /^## Contact$/m);
  assert.match(body, /info@materialsolutionsnj\.com/i);
  assert.match(body, /Contact page: https:\/\/www\.materialsolutionsnj\.com\/contact/);
  assert.doesNotMatch(body, /^- Phone:/m);
  assert.doesNotMatch(body, /\(973\) 500-1010/);
});
