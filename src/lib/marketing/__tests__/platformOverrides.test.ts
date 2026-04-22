import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../../../../data/forklift-inventory.json';
import { normalizeStandaloneUnit, type StandaloneForkliftJsonUnit } from '../schemaTransformers';
import { generateMarketingAssets } from '../canonical/generateMarketingAssets';
import { buildPlatformOverrides, resolvePlatformOverride } from '../platformOverrides';
import { getChannelFormatter } from '../formatters';

type InventorySource = {
  inventory: {
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

const inventory = inventorySource as InventorySource;
const reachTruck = normalizeStandaloneUnit(
  inventory.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-752R45TT-2018'
  ) as StandaloneForkliftJsonUnit
);

function makeCanonical() {
  return generateMarketingAssets(reachTruck);
}

test('buildPlatformOverrides covers all publish targets from Exec 2 block 1', () => {
  const canonical = makeCanonical();
  const overrides = buildPlatformOverrides(canonical);

  assert.deepEqual(
    overrides.map((override) => override.channel).sort(),
    ['craigslist', 'ebay', 'email_campaign', 'facebook_marketplace', 'website']
  );
});

test('facebook marketplace override preserves the required forklift category slug', () => {
  const override = resolvePlatformOverride(makeCanonical(), 'facebook_marketplace');

  assert.equal(override.category, 'VEHICLES > FORKLIFTS');
  assert.equal(override.platform_specific_fields.category_slug, 'VEHICLES > FORKLIFTS');
  assert.equal(override.platform_specific_fields.contact_method, 'marketplace_inbox');
});

test('craigslist override strips HTML and emits plain text description', () => {
  const canonical = {
    ...makeCanonical(),
    long_description: '<p>Fresh <strong>warehouse-ready</strong> reach truck with <em>fast ship</em>.</p>',
  };
  const override = resolvePlatformOverride(canonical, 'craigslist');

  assert.equal(override.platform_specific_fields.posting_format, 'plain_text');
  assert.doesNotMatch(override.description, /<[^>]+>/);
  assert.match(override.description, /warehouse-ready/i);
});

test('ebay override includes item specifics for the phase-1 channel formatter publish pipeline', () => {
  const canonical = makeCanonical();
  const override = resolvePlatformOverride(canonical, 'ebay');

  assert.equal(override.category, '26491');
  assert.deepEqual(override.platform_specific_fields.item_specifics, {
    Brand: canonical.make,
    Model: canonical.model,
    Type: canonical.unit_type,
    Year: canonical.year,
    Capacity: `${canonical.capacity_lbs} lb`,
    Location: canonical.location_label,
  });
});

test('website override rewrites the canonical URL to the site path for storage-bound publishing', () => {
  const canonical = makeCanonical();
  const override = resolvePlatformOverride(canonical, 'website');

  assert.equal(override.canonical_url, `/inventory/${canonical.canonical_slug}`);
  assert.equal(override.platform_specific_fields.canonical_path, `/inventory/${canonical.canonical_slug}`);
  assert.equal(override.platform_specific_fields.indexable, true);
});

test('email campaign override carries preheader and compliance footer metadata', () => {
  const canonical = makeCanonical();
  const override = resolvePlatformOverride(canonical, 'email_campaign');

  assert.equal(typeof override.platform_specific_fields.preheader, 'string');
  assert.match(String(override.platform_specific_fields.preheader), /available now/i);
  assert.match(String(override.platform_specific_fields.compliance_footer), /Material Solutions NJ/i);
  assert.match(String(override.platform_specific_fields.compliance_footer), /unsubscribe/i);
});

test('channel formatter render path can consume resolved facebook overrides cleanly', () => {
  const canonical = makeCanonical();
  const output = getChannelFormatter('facebook_marketplace').render(canonical);

  assert.equal(output.category_mapping, 'VEHICLES > FORKLIFTS');
  assert.equal(output.platform_specific_fields.category_slug, 'VEHICLES > FORKLIFTS');
  assert.ok(output.image_urls.length > 0);
});
