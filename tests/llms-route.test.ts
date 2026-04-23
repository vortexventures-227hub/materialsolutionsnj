import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../data/forklift-inventory.json';

test('llms.txt route returns markdown with documentation, inventory, and contact sections', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.match(body, /^# Material Solutions NJ/m);
  assert.match(body, /^## Documentation$/m);
  assert.match(body, /^## Inventory$/m);
  assert.match(body, /^## Contact$/m);
});

test('llms.txt route enumerates live inventory summaries from forklift-inventory.json', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  const inventory = inventorySource.inventory;
  const expectedIds = [
    inventory.lots[0]?.lot_id,
    ...inventory.standalone_units.map((unit) => unit.unit_id),
  ].filter(Boolean) as string[];

  for (const id of expectedIds) {
    assert.match(body, new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(body, /Raymond 752R45TT/i);
  assert.match(body, /Baltimore, Maryland/i);
  assert.match(body, /\$29,500/);
});

test('llms.txt route exposes only verified public contact targets from locked inventory data', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.match(body, /info@materialsolutionsnj\.com/i);
  assert.match(body, /^- Phone: \(973\) 625-5000$/m);
  assert.match(body, /Contact page: https:\/\/www\.materialsolutionsnj\.com\/contact/);
  assert.doesNotMatch(body, /\{\{DAVID_PHONE_PENDING_PROVISION\}\}/);
  assert.doesNotMatch(body, /\(973\) 500-1010/);
  assert.doesNotMatch(body, /David \(AI assistant\)/i);
});

test('llms.txt route references the site FAQ surfaces and inventory detail FAQ coverage', async () => {
  const { GET } = await import('../src/app/llms.txt/route.ts');
  const response = await GET();
  const body = await response.text();

  assert.match(body, /^## FAQ Surfaces$/m);
  assert.match(body, /\/faq — buyer FAQ hub/i);
  assert.match(body, /\/services\/osha-training/i);
  assert.match(body, /\/services\/racking/i);
  assert.match(body, /\/services\/wire-guided/i);
  assert.match(body, /Inventory detail pages emit FAQPage schema/i);
});
