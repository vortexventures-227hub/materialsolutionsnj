import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../../../../data/forklift-inventory.json';
import { buildGalleryMedia } from '@/lib/marketing/mediaGallery';
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
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
} from '@/lib/marketing/schemaTransformers';

type InventorySource = {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

const inventoryData = inventorySource as InventorySource;
const mdLot = inventoryData.inventory.lots[0];
const mdUnit1 = normalizeLotUnitMember(mdLot, mdLot.units[0]);
const reachTruck = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-752R45TT-2018'
  ) as StandaloneForkliftJsonUnit
);
const swingReach2016 = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-970CSR30T-2016'
  ) as StandaloneForkliftJsonUnit
);
const swingReach2019 = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-970CSR30T-2019'
  ) as StandaloneForkliftJsonUnit
);
const bendi = normalizeStandaloneUnit(
  inventoryData.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'BENDI-B40-LANDOLL'
  ) as StandaloneForkliftJsonUnit
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
  const productOffer = product.offers as { price?: string } | undefined;
  assert.equal(productOffer?.price, undefined);
});

test('schema transformers preserve restored legacy reach-truck stills plus approved video media', () => {
  assert.deepEqual(reachTruck.media_paths, [
    '/inventory-media/Raymond_752R45TT_2018_ReachTruck_photo_01.jpg',
    '/inventory-media/Raymond_752R45TT_2018_ReachTruck_photo_02.jpg',
    '/inventory-media/Raymond_752R45TT_2018_ReachTruck_photo_03.jpg',
    '/inventory-media/Raymond_752R45TT_2018_ReachTruck.mp4',
  ]);

  const gallery = buildGalleryMedia(reachTruck);
  assert.equal(gallery.length, 4);
  assert.deepEqual(gallery.map((item) => item.kind), ['image', 'image', 'image', 'video']);
  assert.equal(gallery[0]?.src, '/inventory-media/Raymond_752R45TT_2018_ReachTruck_photo_01.jpg');
  assert.equal(gallery[3]?.src, '/inventory-media/Raymond_752R45TT_2018_ReachTruck.mp4');
  assert.equal(gallery[3]?.posterSrc, '/inventory-media/Raymond_752R45TT_2018_ReachTruck_photo_01.jpg');
});

test('schema transformers expose restored 970 gallery photos plus demo video for both units', () => {
  for (const unit of [swingReach2016, swingReach2019]) {
    assert.equal(unit.media_paths.filter((mediaPath) => /\.(jpe?g|png|webp)$/i.test(mediaPath)).length, 4);
    assert.ok(unit.media_paths.includes('/inventory-media/SwingReach_2016_and_2019_970CSR30T_pair.jpg'));
    assert.ok(unit.media_paths.includes('/inventory-media/Raymond_970CSR30T_ReachTruck_photo_01.jpg'));
    assert.ok(unit.media_paths.includes('/inventory-media/Raymond_970CSR30T_ReachTruck_photo_02.jpg'));
    assert.ok(unit.media_paths.includes('/inventory-media/Raymond_970CSR30T_ReachTruck_photo_03.jpg'));
    assert.ok(unit.media_paths.includes('/inventory-media/Raymond_970CSR30T_ReachTruck_Demo.mp4'));

    const gallery = buildGalleryMedia(unit);
    assert.equal(gallery.length, 5);
    assert.equal(gallery.filter((item) => item.kind === 'image').length, 4);
    assert.equal(gallery.filter((item) => item.kind === 'video').length, 1);
  }
});

test('schema transformers append lot videos after lot photos and dedupe media paths', () => {
  const firstLotVideo = mdLot.lot_videos?.[0];
  assert.ok(firstLotVideo, 'expected locked lot source to include approved lot video');
  assert.equal(mdUnit1.media_paths.at(-1), firstLotVideo);
  assert.deepEqual(mdUnit1.media_paths.slice(0, mdLot.lot_photos?.length), mdLot.lot_photos);

  const deduped = normalizeStandaloneUnit({
    unit_id: 'TEST-VIDEO-DEDUPE',
    make: 'Raymond',
    model: 'Test',
    year: 2020,
    unit_type: 'Reach Truck',
    location: 'Hamilton, New Jersey',
    media_paths: ['/inventory-media/unit.jpg', '/inventory-media/unit.mp4'],
    video_paths: ['/inventory-media/unit.mp4', '/inventory-media/unit.webm'],
  });

  assert.deepEqual(deduped.media_paths, [
    '/inventory-media/unit.jpg',
    '/inventory-media/unit.mp4',
    '/inventory-media/unit.webm',
  ]);
});
test('schema transformers emit grounded reach-truck Product and Vehicle fragments', () => {
  const product = toProductSchema(reachTruck);
  const vehicle = toVehicleSchema(reachTruck);
  const faq = toFAQPageSchema(reachTruck);
  const breadcrumb = toBreadcrumbListSchema(reachTruck);
  const productOffer = product.offers as { price?: string } | undefined;
  const faqItems = faq.mainEntity as unknown[] | undefined;
  const breadcrumbItems = breadcrumb.itemListElement as unknown[] | undefined;

  assert.equal(product.name, '2018 Raymond 752R45TT Reach Truck');
  assert.equal(productOffer?.price, '29500');
  assert.equal(vehicle.vehicleIdentificationNumber, '752-18-AD67929');
  assert.equal(vehicle.additionalType, 'https://www.productontology.org/id/Forklift_truck');
  assert.equal(vehicle.modelDate, '2018');
  assert.equal(vehicle.vehicleModelDate, '2018');
  assert.equal(vehicle.vehicleTransmission, 'Electric');
  assert.equal(vehicle.fuelType, 'Electric');
  assert.equal(faqItems?.length, 3);
  assert.equal(breadcrumbItems?.length, 4);
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
