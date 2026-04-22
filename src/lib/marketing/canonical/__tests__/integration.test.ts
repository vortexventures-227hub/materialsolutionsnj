import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../../../../../data/forklift-inventory.json';
import { formatAssembledPlatformPayload } from '../../formatters';
import { assemblePublishPayload } from '../../publishAssembly';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
} from '../../schemaTransformers';
import { generateMarketingAssets } from '../generateMarketingAssets';
import { CanonicalContentSchema } from '../schema';
import { upsertCanonicalContent } from '../persist';
import type { InventoryMarketingRow } from '../persist';

type InventorySource = {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

const inventory = inventorySource as InventorySource;
const mdLot = inventory.inventory.lots[0];
const samples = [
  {
    name: 'order-picker-lot-member',
    unit: normalizeLotUnitMember(mdLot, mdLot.units[0]),
  },
  {
    name: 'reach-truck',
    unit: normalizeStandaloneUnit(
      inventory.inventory.standalone_units.find((unit) => unit.unit_id === 'RT-752R45TT-2018') as StandaloneForkliftJsonUnit
    ),
  },
  {
    name: 'bendi',
    unit: normalizeStandaloneUnit(
      inventory.inventory.standalone_units.find((unit) => unit.unit_id === 'BENDI-B40-LANDOLL') as StandaloneForkliftJsonUnit
    ),
  },
];

function makeFakeRow(row: ReturnType<typeof CanonicalContentSchema.parse>): InventoryMarketingRow {
  return {
    id: `fake-${row.unit_id}`,
    ...row,
    created_at: '2026-04-21T17:30:00.000Z',
    updated_at: '2026-04-21T17:30:00.000Z',
  };
}

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

for (const sample of samples) {
  test(`canonical pipeline covers ${sample.name}`, async (t) => {
    const canonical = generateMarketingAssets(sample.unit);
    const validated = CanonicalContentSchema.parse(canonical);

    assert.equal(validated.unit_id, sample.unit.unit_id);
    assert.ok(validated.images.length > 0);
    assert.ok(validated.platform_overrides.length >= 7);

    if (hasSupabaseEnv) {
      const persisted = await upsertCanonicalContent(validated);
      assert.equal(persisted.unit_id, validated.unit_id);
      assert.ok(persisted.created_at);
      assert.ok(persisted.updated_at);
    } else {
      await t.test('db upsert skipped without supabase env', () => {
        const fakeRow = makeFakeRow(validated);
        assert.equal(fakeRow.unit_id, validated.unit_id);
      });
    }

    const assembled = assemblePublishPayload(sample.unit, 'facebook_marketplace');
    const rendered = formatAssembledPlatformPayload('facebook_marketplace', assembled);

    assert.match(rendered.title, new RegExp(sample.unit.make, 'i'));
    assert.ok(rendered.description.length > 0);
    assert.ok(rendered.image_urls.length > 0);
    assert.equal(rendered.platform_specific_fields.inventory_reference, sample.unit.unit_id);

    const canonicalFacebook = validated.platform_overrides.find((entry) => entry.channel === 'facebook_marketplace');
    assert.ok(canonicalFacebook);
    assert.equal(canonicalFacebook?.unit_id, validated.unit_id);
    assert.equal(canonicalFacebook?.canonical_url, validated.canonical_url);
  });
}
