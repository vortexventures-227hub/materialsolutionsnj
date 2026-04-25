import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets.ts';
import { getPasteQueueUnitById } from '../src/lib/marketing/pasteQueueData.ts';
import { getCanonicalPasteQueuePayloads } from '../src/lib/marketing/pasteQueuePayloads.ts';

test('canonical paste queue payloads use formatter overrides for supported channels', () => {
  const unit = getPasteQueueUnitById('RT-970CSR30T-2016');
  assert.ok(unit, 'expected fixture unit');

  const payloads = getCanonicalPasteQueuePayloads(unit);
  const canonical = generateMarketingAssets(unit);

  for (const channel of ['facebook_marketplace', 'offer_up', 'linkedin'] as const) {
    const override = canonical.platform_overrides.find((entry) => entry.channel === channel);
    assert.ok(override, `expected canonical override for ${channel}`);

    assert.equal(payloads[channel].title, override.title);
    assert.equal(payloads[channel].description, override.description);
    assert.deepEqual(payloads[channel].images.map((image) => image.src), override.image_urls);
    assert.deepEqual(payloads[channel].platformSpecificFields, override.platform_specific_fields);
  }
});

test('client-shared pasteQueueData stays free of canonical generator imports', () => {
  const source = readFileSync(new URL('../src/lib/marketing/pasteQueueData.ts', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /generateMarketingAssets/);
});
