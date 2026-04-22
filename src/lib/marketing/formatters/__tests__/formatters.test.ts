import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../../../../../data/forklift-inventory.json' assert { type: 'json' };
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
} from '../../schemaTransformers';
import { assemblePublishPayload } from '../../publishAssembly';
import { formatForPlatform as formatFacebookMarketplace } from '../facebook_marketplace';
import { formatForPlatform as formatCraigslist } from '../craigslist';
import { formatForPlatform as formatEbay } from '../ebay';
import { formatForPlatform as formatMachineryTrader } from '../machinery_trader';
import { formatForPlatform as formatIronPlanet } from '../iron_planet';
import { formatForPlatform as formatOfferUp } from '../offer_up';
import { formatForPlatform as formatLinkedIn } from '../linkedin';
import {
  formatAssembledPlatformPayload,
} from '../index';
import {
  PLATFORM_SPECS,
  toFormatterPayload,
  type PlatformId,
  type PublishPayload,
} from '../shared';

type InventorySource = {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

const inventory = inventorySource as InventorySource;

function fromUnitId(unitId: string) {
  const standalone = inventory.inventory.standalone_units.find((unit) => unit.unit_id === unitId);
  if (standalone) {
    return normalizeStandaloneUnit(standalone);
  }

  const lot = inventory.inventory.lots.find((candidate) =>
    candidate.units.some((member) => `${candidate.lot_id}-unit-${member.unit_index}` === unitId)
  );
  if (!lot) {
    throw new Error(`Unable to locate sample unit ${unitId}`);
  }

  const member = lot.units.find((candidate) => `${lot.lot_id}-unit-${candidate.unit_index}` === unitId);
  if (!member) {
    throw new Error(`Unable to locate lot member ${unitId}`);
  }

  return normalizeLotUnitMember(lot, member);
}

function makePublishPayload(unitId: string): PublishPayload {
  const unit = fromUnitId(unitId);
  const assembled = assemblePublishPayload(unit, 'facebook_marketplace');
  return {
    ...toFormatterPayload(assembled),
    year: unit.year,
    make: unit.make,
    model: unit.model,
    unit_type: unit.unit_type,
    condition: unit.condition,
    location: unit.location,
    sold_as_lot_only: unit.sold_as_lot_only,
    key_specs: [
      unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lb capacity` : null,
      unit.hours_approx ? `${unit.hours_approx.toLocaleString()} hours` : null,
      unit.battery,
    ].filter(Boolean) as string[],
    feature_bullets: unit.features,
    faq_snippets: [
      `Availability: ${unit.status ?? 'unknown'}`,
      unit.delivery_available ? 'Delivery available.' : 'Pickup only.',
    ],
    primary_image_url: unit.media_paths[0] ?? null,
    image_urls: unit.media_paths,
  };
}

const samples = {
  order_picker: makePublishPayload('MD-LOT-001-unit-1'),
  reach_truck: makePublishPayload('RT-752R45TT-2018'),
  bendi: makePublishPayload('BENDI-B40-LANDOLL'),
};

const formatters: Record<PlatformId, (payload: PublishPayload) => ReturnType<typeof formatFacebookMarketplace>> = {
  facebook_marketplace: formatFacebookMarketplace,
  craigslist: formatCraigslist,
  ebay: formatEbay,
  machinery_trader: formatMachineryTrader,
  iron_planet: formatIronPlanet,
  offer_up: formatOfferUp,
  linkedin: formatLinkedIn,
};

test('toFormatterPayload adapts existing publishAssembly output into scaffold input', () => {
  const assembled = assemblePublishPayload(fromUnitId('RT-752R45TT-2018'), 'facebook_marketplace');
  const payload = toFormatterPayload(assembled);

  assert.equal(payload.unit_id, 'RT-752R45TT-2018');
  assert.equal(payload.canonical_slug, 'rt-752r45tt-2018');
  assert.equal(payload.image_urls.length, assembled.images.length);
  assert.equal(payload.primary_image_url, assembled.images[0]?.src ?? null);
});

test('formatAssembledPlatformPayload preserves structured title semantics for assembled publish payloads', () => {
  const assembled = assemblePublishPayload(fromUnitId('RT-752R45TT-2018'), 'facebook_marketplace');
  const output = formatAssembledPlatformPayload('facebook_marketplace', assembled);

  assert.match(output.title, /2018 Raymond 752R45TT Reach Truck/i);
  assert.doesNotMatch(output.title, /VEHICLES > FORKLIFTS/i);
});

for (const [platformId, formatter] of Object.entries(formatters) as Array<
  [PlatformId, (payload: PublishPayload) => ReturnType<typeof formatFacebookMarketplace>]
>) {
  for (const [sampleName, payload] of Object.entries(samples)) {
    test(`${platformId} formats ${sampleName} into a bounded PlatformOutput`, () => {
      const output = formatter(payload);
      const spec = PLATFORM_SPECS[platformId];

      assert.equal(typeof output.title, 'string');
      assert.ok(output.title.length > 0, 'expected non-empty title');
      assert.ok(output.title.length <= spec.titleMax, `expected title <= ${spec.titleMax} for ${platformId}`);

      assert.equal(typeof output.description, 'string');
      assert.ok(output.description.length > 0, 'expected non-empty description');
      assert.ok(output.description.length <= spec.descriptionMax, `expected description <= ${spec.descriptionMax} for ${platformId}`);

      assert.equal(typeof output.primary_image_url, 'string');
      assert.ok(output.primary_image_url.length > 0, 'expected primary image URL');
      assert.ok(output.primary_image_url.includes('/opengraph-image') || !output.primary_image_url.endsWith(payload.canonical_url), 'expected a media URL or OG fallback, not the listing page URL itself');
      assert.ok(Array.isArray(output.image_urls), 'expected image_urls array');
      assert.ok(output.image_urls.length > 0, 'expected at least one image URL');
      assert.ok(output.image_urls.length <= spec.imageMax, `expected <= ${spec.imageMax} image URLs for ${platformId}`);
      assert.equal(typeof output.platform_specific_fields, 'object');
      assert.ok(Array.isArray(output.char_limit_warnings), 'expected truncation warnings array');

      if (spec.manualPosting) {
        assert.equal(typeof output.posting_instructions, 'string');
        assert.ok(output.posting_instructions && output.posting_instructions.length > 20, 'expected manual-post instructions');
      } else {
        assert.equal(output.posting_instructions, null);
      }
    });
  }
}
