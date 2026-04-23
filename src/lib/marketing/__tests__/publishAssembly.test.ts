import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../../../../data/forklift-inventory.json';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
} from '../schemaTransformers';
import { assemblePublishPayload, type PublishTarget } from '../publishAssembly';

type InventorySource = {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

const TARGETS: PublishTarget[] = [
  'facebook_marketplace',
  'craigslist',
  'ebay',
  'website',
  'email_campaign',
];

const TITLE_LIMITS: Record<PublishTarget, number | null> = {
  facebook_marketplace: 100,
  craigslist: 70,
  ebay: 80,
  linkedin: 200,
  website: null,
  email_campaign: null,
};

const IMAGE_LIMITS: Record<PublishTarget, number> = {
  facebook_marketplace: 10,
  craigslist: 12,
  ebay: 24,
  linkedin: 8,
  website: 8,
  email_campaign: 4,
};

const inventoryData = inventorySource as InventorySource;
const mdLot = inventoryData.inventory.lots[0];
const mdUnit1 = normalizeLotUnitMember(mdLot, mdLot.units[0]);
const reachTruck = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-752R45TT-2018'
  ) as StandaloneForkliftJsonUnit
);
const bendi = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'BENDI-B40-LANDOLL'
  ) as StandaloneForkliftJsonUnit
);

const samples = [
  {
    name: 'order-picker-lot-member',
    unit: mdUnit1,
    expectedLocation: { city: 'Baltimore', state: 'MD' },
  },
  {
    name: 'reach-truck',
    unit: reachTruck,
    expectedLocation: { city: 'Baltimore', state: 'MD' },
  },
  {
    name: 'bendi',
    unit: bendi,
    expectedLocation: { city: 'Hamilton', state: 'NJ' },
  },
];

for (const target of TARGETS) {
  for (const sample of samples) {
    test(`${target} assembles deterministic publish payload for ${sample.name}`, () => {
      const payload = assemblePublishPayload(sample.unit, target);

      assert.equal(payload.target, target);
      assert.equal(payload.unit_id, sample.unit.unit_id);
      assert.ok(payload.title.length > 0);
      assert.ok(payload.description.length > 0);
      assert.ok(Array.isArray(payload.images));
      assert.ok(Array.isArray(payload.warnings));
      assert.equal(typeof payload.platformSpecificFields, 'object');
      assert.equal(typeof payload.schema, 'object');
      assert.equal(typeof payload.metaTags, 'object');
      assert.equal(payload.location.city, sample.expectedLocation.city);
      assert.equal(payload.location.state, sample.expectedLocation.state);

      const titleLimit = TITLE_LIMITS[target];
      if (titleLimit != null) {
        assert.ok(payload.title.length <= titleLimit);
      }

      assert.ok(payload.images.length <= IMAGE_LIMITS[target]);

      const expectedCanonical =
        target === 'website'
          ? `/inventory/${sample.unit.canonical_slug}`
          : `https://www.materialsolutionsnj.com/inventory/${sample.unit.canonical_slug}`;

      assert.equal(payload.canonical_url, expectedCanonical);

      if (sample.unit.sold_as_lot_only) {
        assert.equal(payload.price, null);
        assert.match(payload.title.toLowerCase(), /lot/);
        assert.match(payload.description.toLowerCase(), /lot/);
        assert.doesNotMatch(payload.description, /\$2,500/);
      } else if (sample.unit.asking_price_usd != null) {
        assert.equal(payload.price, sample.unit.asking_price_usd);
      }

      if (target === 'email_campaign') {
        assert.equal(typeof payload.platformSpecificFields.preheader, 'string');
        assert.ok(String(payload.platformSpecificFields.preheader).length > 0);
      }

      if (target === 'website') {
        const websiteOg = payload.metaTags.og as { url?: string };
        assert.equal(websiteOg.url, `/inventory/${sample.unit.canonical_slug}`);
      }
    });
  }
}
