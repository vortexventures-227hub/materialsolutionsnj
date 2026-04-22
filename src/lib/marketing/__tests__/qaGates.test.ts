import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../../../../data/forklift-inventory.json';
import { normalizeStandaloneUnit, type StandaloneForkliftJsonUnit } from '../schemaTransformers';
import { generateMarketingAssets } from '../canonical/generateMarketingAssets';
import { loadClaimSafetyRules, runMarketingQaGates } from '../qaGates';

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

test('loadClaimSafetyRules seeds 30 YAML-backed rules for gate 5', () => {
  const rules = loadClaimSafetyRules();

  assert.equal(rules.length, 30);
  assert.ok(rules.every((rule) => rule.id.length > 0));
  assert.ok(rules.some((rule) => rule.flag === 'lot_only_pricing'));
});

test('runMarketingQaGates passes healthy canonical content in the documented gate order', () => {
  const canonical = makeCanonical();
  const report = runMarketingQaGates(canonical, {
    target: 'website',
    existingCanonicalSlugs: new Set(['different-slug']),
    imageMetadataByUrl: Object.fromEntries(
      canonical.images.map((image) => [image.source_path, { width: 1600, height: 1200 }])
    ),
  });

  assert.equal(report.overallStatus, 'pass');
  assert.deepEqual(
    report.results.map((result) => result.key),
    [
      'canonical_completeness',
      'hold_suppression',
      'lot_only_policy',
      'media_completeness',
      'claim_safety_rules',
      'canonical_collision',
      'category_conflict',
      'min_image_dimension',
      'price_sanity',
      'schema_org_validity',
    ]
  );
  assert.equal(report.errorLog.length, 0);
});

test('lot-only policy fails when a lot-only unit is treated like an individual unit listing', () => {
  const canonical = {
    ...makeCanonical(),
    lot_only_flag: true,
    source_kind: 'unit' as const,
    price_posture: 'lot_only' as const,
    asking_price_usd: 29500,
  };

  const report = runMarketingQaGates(canonical, {
    target: 'facebook_marketplace',
    imageMetadataByUrl: Object.fromEntries(
      canonical.images.map((image) => [image.source_path, { width: 1600, height: 1200 }])
    ),
  });

  assert.equal(report.overallStatus, 'fail');
  const gate = report.results.find((result) => result.key === 'lot_only_policy');
  assert.equal(gate?.status, 'fail');
  assert.match(String(gate?.message), /lot-only/i);
  assert.ok(report.errorLog.some((entry) => entry.includes('lot_only_policy')));
});

test('claim safety, collision, and image-dimension gates surface concrete block reasons', () => {
  const canonical = {
    ...makeCanonical(),
    claim_safety_flags: ['hold_reason_present'],
  };
  const report = runMarketingQaGates(canonical, {
    target: 'ebay',
    existingCanonicalSlugs: new Set([canonical.canonical_slug]),
    imageMetadataByUrl: Object.fromEntries(
      canonical.images.map((image) => [image.source_path, { width: 640, height: 640 }])
    ),
  });

  assert.equal(report.overallStatus, 'fail');
  assert.equal(report.results.find((result) => result.key === 'claim_safety_rules')?.status, 'fail');
  assert.equal(report.results.find((result) => result.key === 'canonical_collision')?.status, 'fail');
  assert.equal(report.results.find((result) => result.key === 'min_image_dimension')?.status, 'fail');
  assert.ok(report.errorLog.some((entry) => entry.includes('claim_safety_rules')));
  assert.ok(report.errorLog.some((entry) => entry.includes('canonical_collision')));
  assert.ok(report.errorLog.some((entry) => entry.includes('min_image_dimension')));
});
