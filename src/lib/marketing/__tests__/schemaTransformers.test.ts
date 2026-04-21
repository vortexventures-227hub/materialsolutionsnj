import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../../../../data/forklift-inventory.json';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  toAltText,
  toBreadcrumbListSchema,
  toCanonicalURL,
  toFAQPageSchema,
  toMetaDescription,
  toOGMeta,
  toProductSchema,
  toSEOTitle,
  toTwitterCard,
  toVehicleSchema,
} from '@/lib/marketing/schemaTransformers';

type InventorySource = {
  inventory: {
    lots: Array<{
      lot_id: string;
      units: Array<{
        unit_index: number;
        make: string;
        model: string;
        serial?: string | null;
        year: number | null;
      }>;
      [key: string]: unknown;
    }>;
    standalone_units: Array<Record<string, unknown>>;
  };
};

const inventoryData = inventorySource as InventorySource;
const mdLot = inventoryData.inventory.lots[0];
const mdUnit1 = normalizeLotUnitMember(mdLot, mdLot.units[0]);
const reachTruck = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-752R45TT-2018'
  ) as Parameters<typeof normalizeStandaloneUnit>[0]
);
const bendi = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'BENDI-B40-LANDOLL'
  ) as Parameters<typeof normalizeStandaloneUnit>[0]
);

test('schema transformers keep order-picker lot members deterministic and lot-safe', () => {
  assert.equal(mdUnit1.unit_id, 'MD-LOT-001-unit-1');
  assert.equal(mdUnit1.sold_as_lot_only, true);
  assert.match(toCanonicalURL(mdUnit1), /\/inventory\/md-lot-001-unit-1$/);

  const title = toSEOTitle(mdUnit1);
  const description = toMetaDescription(mdUnit1);
  const product = toProductSchema(mdUnit1);

  assert.ok(title.length <= 60);
  assert.ok(description.length <= 160);
  assert.match(title, /Raymond 5600PC30TT/);
  assert.match(description, /lot sale only/i);
  assert.equal(product.sku, 'MD-LOT-001-unit-1');
  assert.equal(product.offers?.price, undefined);
});

test('schema transformers emit grounded reach-truck Product and Vehicle fragments', () => {
  const product = toProductSchema(reachTruck);
  const vehicle = toVehicleSchema(reachTruck);
  const faq = toFAQPageSchema(reachTruck);
  const breadcrumb = toBreadcrumbListSchema(reachTruck);

  assert.equal(product.name, '2018 Raymond 752R45TT Reach Truck');
  assert.equal(product.offers?.price, '29500');
  assert.equal(vehicle.vehicleIdentificationNumber, '752-18-AD67929');
  assert.equal(vehicle.additionalType, 'https://www.productontology.org/id/Forklift_truck');
  assert.equal(vehicle.modelDate, '2018');
  assert.equal(vehicle.vehicleModelDate, '2018');
  assert.equal(vehicle.vehicleTransmission, 'Electric');
  assert.equal(vehicle.fuelType, 'Electric');
  assert.equal(faq.mainEntity?.length, 3);
  assert.equal(breadcrumb.itemListElement?.length, 4);
});

test('schema transformers keep bendy OG/Twitter/alt output deterministic', () => {
  const og = toOGMeta(bendi);
  const twitter = toTwitterCard(bendi);
  const alt = toAltText(bendi.media_paths[0], bendi);

  assert.ok(og.title.length <= 60);
  assert.ok(og.description.length <= 160);
  assert.equal(og.type, 'product');
  assert.equal(twitter.card, 'summary_large_image');
  assert.match(og.url, /\/inventory\/bendi-b40-landoll$/);
  assert.match(alt, /2019 Bendi B40 Articulated Forklift equipment photo/);
});
