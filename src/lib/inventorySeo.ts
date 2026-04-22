import type { Metadata } from 'next';
import type { BreadcrumbList, FAQPage, Product, Vehicle, WithContext } from 'schema-dts';

import inventorySource from '../../data/forklift-inventory.json';
import type { Listing, ListingImage, ListingSpec } from '@/lib/types';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  toBreadcrumbListSchema,
  toCanonicalURL,
  toFAQPageSchema,
  toMetaDescription,
  toOGMeta,
  toProductSchema,
  toSEOTitle,
  toTwitterCard,
  toVehicleSchema,
  type ForkliftUnit,
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
} from '@/lib/marketing/schemaTransformers';

type InventorySource = {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

type InventorySeoUnit = ForkliftUnit;

type InventoryDetailSeoPayload = {
  unit: InventorySeoUnit;
  metadata: Metadata;
  productJsonLd: WithContext<Product>;
  vehicleJsonLd: WithContext<Vehicle>;
  faqJsonLd: WithContext<FAQPage>;
  breadcrumbJsonLd: WithContext<BreadcrumbList>;
};

const inventoryData = inventorySource as InventorySource;
export const normalizedInventoryUnits: InventorySeoUnit[] = [
  ...inventoryData.inventory.lots.flatMap((lot) =>
    lot.units.map((member) => normalizeLotUnitMember(lot, member))
  ),
  ...inventoryData.inventory.standalone_units.map((unit) => normalizeStandaloneUnit(unit)),
];

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeInventorySlug(value: string): string {
  return normalizeSlug(value);
}

function buildTitle(unit: InventorySeoUnit): string {
  return [unit.year, unit.make, unit.model, unit.unit_type].filter(Boolean).join(' ');
}

function getImageUrl(unit: InventorySeoUnit): string {
  return toOGMeta(unit).image;
}

function getSlugCandidates(unit: InventorySeoUnit): Set<string> {
  return new Set([
    normalizeSlug(unit.unit_id),
    normalizeSlug(unit.canonical_slug),
    normalizeSlug(`${unit.make}-${unit.model}-${unit.year}`),
    normalizeSlug(`${unit.year}-${unit.make}-${unit.model}`),
    normalizeSlug(`${unit.make}-${unit.model}`),
  ]);
}

export function findInventoryUnitBySlug(slug: string): InventorySeoUnit | null {
  const normalized = normalizeSlug(slug);

  return normalizedInventoryUnits.find((unit) => getSlugCandidates(unit).has(normalized)) ?? null;
}

export function findStandaloneUnitBySlug(slug: string): InventorySeoUnit | null {
  const unit = findInventoryUnitBySlug(slug);
  return unit?.source_kind === 'standalone' ? unit : null;
}

export function resolvePublishInventoryIdBySlug(slug: string): string | null {
  const unit = findInventoryUnitBySlug(slug);
  if (unit) {
    return unit.unit_id;
  }

  const normalized = normalizeSlug(slug);
  const lot = inventoryData.inventory.lots.find((candidate) => normalizeSlug(candidate.lot_id) === normalized);
  return lot?.lot_id ?? null;
}

export function getInventoryDetailSeoPayload(slug: string): InventoryDetailSeoPayload | null {
  const unit = findInventoryUnitBySlug(slug);
  if (!unit) return null;

  const canonicalUrl = toCanonicalURL(unit);
  const canonicalPath = new URL(canonicalUrl).pathname;
  const ogMeta = toOGMeta(unit);
  const twitterCard = toTwitterCard(unit);

  const metadata: Metadata = {
    title: toSEOTitle(unit),
    description: toMetaDescription(unit),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      url: ogMeta.url,
      title: ogMeta.title,
      description: ogMeta.description,
      images: [
        {
          url: ogMeta.image,
          alt: `${buildTitle(unit)} primary image`,
        },
      ],
    },
    twitter: {
      card: twitterCard.card,
      title: twitterCard.title,
      description: twitterCard.description,
      images: [twitterCard.image],
    },
  };

  return {
    unit,
    metadata,
    productJsonLd: toProductSchema(unit),
    vehicleJsonLd: toVehicleSchema(unit),
    faqJsonLd: toFAQPageSchema(unit),
    breadcrumbJsonLd: toBreadcrumbListSchema(unit),
  };
}

function toSentenceCaseCondition(value: string | null | undefined): Listing['condition'] {
  if (!value) return 'used';
  return 'used';
}

function buildSpecs(unit: InventorySeoUnit): ListingSpec[] {
  const specs: Array<{ category: ListingSpec['category']; spec_key: string; spec_value: string | number | null | undefined }> = [
    { category: 'general', spec_key: 'Unit ID', spec_value: unit.unit_id },
    { category: 'general', spec_key: 'Type', spec_value: unit.unit_type },
    { category: 'general', spec_key: 'Location', spec_value: unit.location },
    { category: 'general', spec_key: 'Serial', spec_value: unit.serial },
    { category: 'performance', spec_key: 'Capacity', spec_value: unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lbs` : null },
    { category: 'performance', spec_key: 'Hours', spec_value: unit.hours_approx ? `${unit.hours_approx.toLocaleString()} hrs` : null },
    { category: 'mast', spec_key: 'Mast Lowered', spec_value: unit.mast_collapsed_inches ? `${unit.mast_collapsed_inches}"` : null },
    { category: 'mast', spec_key: 'Mast Raised', spec_value: unit.mast_extended_inches ? `${unit.mast_extended_inches}"` : null },
    { category: 'power', spec_key: 'Battery', spec_value: unit.battery },
  ];

  return specs
    .filter((spec) => spec.spec_value)
    .map((spec, index) => ({
      id: `${normalizeSlug(unit.unit_id)}-spec-${index}`,
      listing_id: unit.unit_id,
      category: spec.category,
      spec_key: spec.spec_key,
      spec_value: String(spec.spec_value),
      sort_order: index,
    }));
}

function buildImages(unit: InventorySeoUnit): ListingImage[] {
  const imageUrl = getImageUrl(unit);
  if (!imageUrl) return [];

  return [
    {
      id: `${normalizeSlug(unit.unit_id)}-image-0`,
      listing_id: unit.unit_id,
      url: imageUrl,
      thumbnail_url: null,
      sort_order: 0,
      is_primary: true,
      ai_labels: null,
      created_at: new Date().toISOString(),
    },
  ];
}

export function inventoryUnitToListing(unit: InventorySeoUnit, slug: string): Listing {
  const title = buildTitle(unit);
  const now = new Date().toISOString();

  return {
    id: unit.unit_id,
    slug: normalizeSlug(slug),
    title,
    make: unit.make,
    model: unit.model,
    year: unit.year,
    price: unit.asking_price_usd ?? null,
    capacity: unit.capacity_lbs ?? null,
    fuel_type: unit.battery ? 'electric' : null,
    mast_type: null,
    max_height: unit.mast_extended_inches ?? null,
    hours: unit.hours_approx ?? null,
    serial_number: unit.serial ?? null,
    condition: toSentenceCaseCondition(unit.condition),
    status: unit.status === 'available' ? 'active' : 'draft',
    featured: false,
    ai_description: toMetaDescription(unit),
    ai_analysis: null,
    ai_highlights: unit.features ?? null,
    created_at: now,
    updated_at: now,
    listing_images: buildImages(unit),
    listing_specs: buildSpecs(unit),
  };
}

export const standaloneUnitToListing = inventoryUnitToListing;
