import { generateCanonicalMarketingObject } from './canonicalDerivation';
import type { ForkliftUnit } from './schemaTransformers';
import {
  CanonicalMarketingObjectSchema,
  marketingOverlaySchema,
  type CanonicalMarketingObject,
  type MarketingOverlay,
} from './types/CanonicalMarketingObject';

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function inferHoldFlag(unit: ForkliftUnit): boolean {
  return unit.status === 'hold' || unit.status === 'held' || Boolean(unit.hold_reason);
}

function defaultMarketingSummary(unit: ForkliftUnit, longDescription: string): string {
  if (unit.sold_as_lot_only) {
    return 'Lot-only Raymond order picker inventory. Individual-unit pricing is suppressed; use lot framing in downstream marketing.';
  }

  return longDescription;
}

function buildFaqEntries(unit: ForkliftUnit): CanonicalMarketingObject['faq_entries'] {
  return [
    {
      question: 'What is the lift capacity?',
      answer: unit.capacity_lbs != null ? `${unit.capacity_lbs.toLocaleString()} lb capacity.` : 'Capacity should be confirmed before publishing.',
      source_fields: ['capacity_lbs'],
    },
    {
      question: 'Where is this forklift located?',
      answer: `${unit.location}.`,
      source_fields: ['location'],
    },
    {
      question: 'Is delivery available?',
      answer: unit.delivery_available ? 'Delivery is available.' : 'Delivery availability should be confirmed before publishing.',
      source_fields: ['delivery_available'],
    },
    {
      question: 'Is battery and charger information available?',
      answer: unit.battery ? `${unit.battery}.` : 'Battery details are not currently listed.',
      source_fields: ['battery', 'battery_voltage'],
    },
  ];
}

export function buildCanonical(inventoryRow: ForkliftUnit, marketingOverlay: MarketingOverlay = {}): CanonicalMarketingObject {
  const overlay = marketingOverlaySchema.parse(marketingOverlay);
  const derived = generateCanonicalMarketingObject(inventoryRow);
  const holdFlag = inferHoldFlag(inventoryRow);
  const seoTitle = collapseWhitespace(derived.seoTitle).slice(0, 60);
  const canonical = {
    unit_id: derived.unit_id,
    canonical_slug: derived.canonical_slug,
    canonical_url: derived.canonicalUrl,
    source_kind: derived.source_kind,
    make: derived.make,
    model: derived.model,
    year: derived.year,
    unit_type: derived.unit_type,
    location: derived.location,
    serial: derived.serial,
    status: derived.status,
    hold_reason: derived.hold_reason,
    hold_flag: holdFlag,
    publish_eligibility: overlay.publish_eligibility ?? !holdFlag,
    lot_only_flag: derived.sold_as_lot_only,
    price_usd: derived.sold_as_lot_only ? null : derived.asking_price_usd,
    delivery_available: derived.delivery_available,
    capacity_lbs: derived.capacity_lbs,
    mast_collapsed_inches: derived.mast_collapsed_inches,
    mast_extended_inches: derived.mast_extended_inches,
    hours_approx: derived.hours_approx,
    battery: derived.battery,
    battery_voltage: derived.battery_voltage,
    condition: derived.condition,
    features: derived.features,
    media_paths: derived.media_paths,
    primary_image_path: derived.media_paths[0] ?? null,
    marketing_headline: overlay.marketing_headline ?? seoTitle,
    marketing_summary: overlay.marketing_summary ?? defaultMarketingSummary(inventoryRow, derived.longDescription),
    structured_feature_list: derived.structuredFeatureList,
    long_description: derived.longDescription,
    seo_title: seoTitle,
    meta_description: derived.metaDescription,
    og_image_url: derived.ogImageUrl,
    images: derived.images,
    faq_entries: buildFaqEntries(inventoryRow),
  } satisfies CanonicalMarketingObject;

  return CanonicalMarketingObjectSchema.parse(canonical);
}
