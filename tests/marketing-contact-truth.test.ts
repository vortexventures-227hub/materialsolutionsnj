import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../data/forklift-inventory.json';
import { findInventoryUnitBySlug } from '../src/lib/inventorySeo';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets';
import { PUBLIC_PHONE_HREF, PUBLIC_PHONE_LABEL } from '../src/lib/contactDetails';

test('locked inventory contact truth uses canonical live phone (973) 500-1010', () => {
  // Locked snapshot preserved as-is
  assert.equal(
    inventorySource.inventory.contacts_2026_04_21.phone_public,
    'Phone line not currently available — use info@materialsolutionsnj.com'
  );
  // Public-facing canonical phone truth uses (973) 500-1010 from contactDetails
  assert.equal(PUBLIC_PHONE_LABEL, '(973) 500-1010');
  assert.equal(PUBLIC_PHONE_HREF, 'tel:+19735001010');

  const unit = findInventoryUnitBySlug('rt-752r45tt-2018');
  assert.ok(unit, 'expected locked inventory unit to exist');

  const canonical = generateMarketingAssets(unit);
  assert.equal(canonical.contact_email_public, 'info@materialsolutionsnj.com');
  assert.equal(canonical.contact_phone_public, '(973) 500-1010');
  assert.doesNotMatch(canonical.contact_phone_public, /\{\{.*\}\}/);
});

test('llms.txt route publishes live canonical phone (973) 500-1010', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /^## Contact$/m);
  assert.match(body, /info@materialsolutionsnj\.com/i);
  assert.match(body, /^- Phone: \(973\) 500-1010$/m);
  assert.doesNotMatch(body, /\(848\) 999-6854/);
  assert.match(body, /Contact page: https:\/\/www\.materialsolutionsnj\.com\/contact/);
  assert.doesNotMatch(body, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  assert.doesNotMatch(body, /Phone line not currently available/);
});
