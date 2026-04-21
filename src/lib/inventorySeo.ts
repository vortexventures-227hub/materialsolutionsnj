import type { Metadata } from 'next';
import type { Product, Vehicle, WithContext } from 'schema-dts';

import inventorySource from '../../data/forklift-inventory.json';
import type { Listing, ListingImage, ListingSpec } from '@/lib/types';

export type StandaloneUnit = {
  unit_id: string;
  make: string;
  model: string;
  year: number;
  unit_type: string;
  location: string;
  serial: string | null;
  capacity_lbs?: number | null;
  mast_collapsed_inches?: number | null;
  mast_extended_inches?: number | null;
  features?: string[] | null;
  battery?: string | null;
  hours_approx?: number | null;
  condition?: string | null;
  asking_price_usd?: number | null;
  media_paths?: string[] | null;
  status?: string | null;
};

type InventorySource = {
  inventory: {
    standalone_units: StandaloneUnit[];
  };
};

type InventoryDetailSeoPayload = {
  unit: StandaloneUnit;
  metadata: Metadata;
  productJsonLd: WithContext<Product>;
  vehicleJsonLd: WithContext<Vehicle>;
};

const inventoryData = inventorySource as InventorySource;

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

function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && /^https?:\/\//.test(configured)) {
    return configured.replace(/\/$/, '');
  }

  return 'https://www.materialsolutionsnj.com';
}

function getCanonicalPath(slug: string): string {
  return `/inventory/${normalizeSlug(slug)}`;
}

function getImageUrl(unit: StandaloneUnit): string {
  const firstMedia = unit.media_paths?.[0];
  if (firstMedia && /^https?:\/\//.test(firstMedia)) {
    return firstMedia;
  }

  return `${getSiteUrl()}/favicon.svg`;
}

function buildDescription(unit: StandaloneUnit): string {
  const parts = [
    `${unit.year} ${unit.make} ${unit.model}`,
    unit.unit_type,
    `located in ${unit.location}`,
    unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lb capacity` : null,
    unit.hours_approx ? `${unit.hours_approx.toLocaleString()} hours` : null,
    unit.asking_price_usd ? `asking ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(unit.asking_price_usd)}` : null,
  ].filter(Boolean);

  return `${parts.join(' • ')}. Current inventory detail from Material Solutions NJ.`;
}

function buildTitle(unit: StandaloneUnit): string {
  return `${unit.year} ${unit.make} ${unit.model} ${unit.unit_type}`;
}

function getSlugCandidates(unit: StandaloneUnit): Set<string> {
  return new Set([
    normalizeSlug(unit.unit_id),
    normalizeSlug(`${unit.make}-${unit.model}-${unit.year}`),
    normalizeSlug(`${unit.year}-${unit.make}-${unit.model}`),
    normalizeSlug(`${unit.make}-${unit.model}`),
  ]);
}

export function findStandaloneUnitBySlug(slug: string): StandaloneUnit | null {
  const normalized = normalizeSlug(slug);

  return (
    inventoryData.inventory.standalone_units.find((unit) =>
      getSlugCandidates(unit).has(normalized)
    ) ?? null
  );
}

export function getInventoryDetailSeoPayload(slug: string): InventoryDetailSeoPayload | null {
  const unit = findStandaloneUnitBySlug(slug);
  if (!unit) return null;

  const siteUrl = getSiteUrl();
  const canonicalPath = getCanonicalPath(slug);
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const title = buildTitle(unit);
  const description = buildDescription(unit);
  const image = getImageUrl(unit);
  const availability =
    unit.status === 'available'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: image,
          alt: `${title} primary image`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };

  const productJsonLd: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description,
    sku: unit.unit_id,
    model: unit.model,
    category: unit.unit_type,
    brand: {
      '@type': 'Brand',
      name: unit.make,
    },
    image: [image],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: String(unit.asking_price_usd ?? 0),
      availability,
      itemCondition: 'https://schema.org/UsedCondition',
      url: canonicalUrl,
    },
  };

  const vehicleJsonLd: WithContext<Vehicle> = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: title,
    description,
    sku: unit.unit_id,
    model: unit.model,
    image: [image],
    vehicleModelDate: String(unit.year),
    brand: {
      '@type': 'Brand',
      name: unit.make,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: String(unit.asking_price_usd ?? 0),
      availability,
      itemCondition: 'https://schema.org/UsedCondition',
      url: canonicalUrl,
    },
  };

  return {
    unit,
    metadata,
    productJsonLd,
    vehicleJsonLd,
  };
}

function toSentenceCaseCondition(value: string | null | undefined): Listing['condition'] {
  if (!value) return 'used';
  return 'used';
}

function buildSpecs(unit: StandaloneUnit): ListingSpec[] {
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

function buildImages(unit: StandaloneUnit): ListingImage[] {
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

export function standaloneUnitToListing(unit: StandaloneUnit, slug: string): Listing {
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
    ai_description: buildDescription(unit),
    ai_analysis: null,
    ai_highlights: unit.features ?? null,
    created_at: now,
    updated_at: now,
    listing_images: buildImages(unit),
    listing_specs: buildSpecs(unit),
  };
}
