import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../data/forklift-inventory.json';
import { findInventoryUnitBySlug } from '../src/lib/inventorySeo';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets';
import { PUBLIC_PHONE_HREF, PUBLIC_PHONE_LABEL } from '../src/lib/contactDetails';

test('locked inventory contact truth uses live public number', () => {
  // Static inventory data snapshot preserved as-is
  assert.equal(
    inventorySource.inventory.contacts_2026_04_21.phone_public,
    '(973) 625-5000'
  );
  // canonical/public phone truth uses canonical (973) 500-1010 from contactDetails.ts
  assert.equal(PUBLIC_PHONE_LABEL, '(973) 500-1010');
  assert.equal(PUBLIC_PHONE_HREF, 'tel:+19735001010');

  const unit = findInventoryUnitBySlug('rt-752r45tt-2018');
  assert.ok(unit, 'expected locked inventory unit to exist');

  const canonical = generateMarketingAssets(unit);
  assert.equal(canonical.contact_email_public, 'info@materialsolutionsnj.com');
  assert.equal(canonical.contact_phone_public, '(973) 500-1010');
  assert.doesNotMatch(canonical.contact_phone_public, /\{\{.*\}\}/);
});

test('llms.txt route emits Phone line with live public number', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /^## Contact$/m);
  assert.match(body, /info@materialsolutionsnj\.com/i);
  assert.match(body, /^- Phone: \(973\) 500-1010$/m);
  assert.doesNotMatch(body, /\{\{.*\}\}/);
});
