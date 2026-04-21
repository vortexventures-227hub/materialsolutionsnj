import type { Metadata } from 'next';
import type { Product, Vehicle, WithContext } from 'schema-dts';

import inventorySource from '../../data/forklift-inventory.json';

type StandaloneUnit = {
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

function findUnitBySlug(slug: string): StandaloneUnit | null {
  const normalized = normalizeSlug(slug);

  return (
    inventoryData.inventory.standalone_units.find((unit) =>
      getSlugCandidates(unit).has(normalized)
    ) ?? null
  );
}

export function getInventoryDetailSeoPayload(slug: string): InventoryDetailSeoPayload | null {
  const unit = findUnitBySlug(slug);
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
