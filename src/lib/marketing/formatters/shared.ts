import type {
  PublishPayload as AssembledPublishPayload,
  PublishTarget,
} from '../publishAssembly';

export type PlatformId =
  | 'facebook_marketplace'
  | 'craigslist'
  | 'ebay'
  | 'machinery_trader'
  | 'iron_planet'
  | 'offer_up'
  | 'linkedin'
  | 'equipment_trader';

export type LegacyPlatformId = Exclude<PublishTarget, 'website' | 'email_campaign'>
  | 'machinerytrader'
  | 'ironplanet'
  | 'offerup';

export interface PublishPayload {
  unit_id: string;
  canonical_slug: string;
  year: number | null;
  make: string;
  model: string;
  unit_type: string;
  condition: string | null;
  location: string;
  price_usd: number | null;
  sold_as_lot_only: boolean;
  key_specs: string[];
  feature_bullets: string[];
  description: string;
  faq_snippets: string[];
  primary_image_url: string | null;
  image_urls: string[];
  canonical_url: string;
  platform_specific_fields: Record<string, unknown>;
}

export interface PlatformOutput {
  title: string;
  description: string;
  price: number | null;
  primary_image_url: string;
  image_urls: string[];
  category_mapping: string | null;
  platform_specific_fields: Record<string, unknown>;
  posting_instructions: string | null;
  char_limit_warnings: string[];
}

export interface PlatformSpec {
  titleMax: number;
  descriptionMax: number;
  imageMax: number;
  categoryMapping: string | null;
  manualPosting: boolean;
  tier: 'auto' | 'template';
}

export const PLATFORM_SPECS: Record<PlatformId, PlatformSpec> = {
  facebook_marketplace: {
    titleMax: 100,
    descriptionMax: 5000,
    imageMax: 10,
    categoryMapping: 'VEHICLES > FORKLIFTS',
    manualPosting: false,
    tier: 'auto',
  },
  craigslist: {
    titleMax: 70,
    descriptionMax: 5000,
    imageMax: 12,
    categoryMapping: 'heavy equipment > forklifts',
    manualPosting: true,
    tier: 'template',
  },
  ebay: {
    titleMax: 80,
    descriptionMax: 500000,
    imageMax: 24,
    categoryMapping: '26491',
    manualPosting: false,
    tier: 'auto',
  },
  machinery_trader: {
    titleMax: 255,
    descriptionMax: 4000,
    imageMax: 24,
    categoryMapping: 'Material Handling > Forklifts',
    manualPosting: true,
    tier: 'template',
  },
  iron_planet: {
    titleMax: 200,
    descriptionMax: 5000,
    imageMax: 24,
    categoryMapping: 'per consignor sheet',
    manualPosting: true,
    tier: 'template',
  },
  offer_up: {
    titleMax: 50,
    descriptionMax: 2048,
    imageMax: 12,
    categoryMapping: 'per-listing',
    manualPosting: true,
    tier: 'template',
  },
  linkedin: {
    titleMax: 3000,
    descriptionMax: 3000,
    imageMax: 9,
    categoryMapping: 'social post',
    manualPosting: false,
    tier: 'auto',
  },
  equipment_trader: {
    titleMax: 255,
    descriptionMax: 4000,
    imageMax: 24,
    categoryMapping: 'Material Handling > Forklifts',
    manualPosting: true,
    tier: 'template',
  },
};

export const LEGACY_PLATFORM_ID_MAP: Record<LegacyPlatformId, PlatformId> = {
  facebook_marketplace: 'facebook_marketplace',
  craigslist: 'craigslist',
  ebay: 'ebay',
  linkedin: 'linkedin',
  machinerytrader: 'machinery_trader',
  ironplanet: 'iron_planet',
  offerup: 'offer_up',
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizePlatformId(platformId: PlatformId | LegacyPlatformId): PlatformId {
  return (LEGACY_PLATFORM_ID_MAP[platformId as LegacyPlatformId] ?? platformId) as PlatformId;
}

export function truncateAtWordBoundary(
  value: string,
  maxLength: number,
  warningLabel: string,
  warnings: string[]
): string {
  const normalized = collapseWhitespace(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const cutoff = Math.max(0, maxLength - 1);
  const sliced = normalized.slice(0, cutoff);
  const boundary = sliced.lastIndexOf(' ');
  const truncated = (boundary >= Math.floor(cutoff * 0.6) ? sliced.slice(0, boundary) : sliced).trimEnd();
  warnings.push(`${warningLabel} truncated to ${maxLength} characters`);
  return `${truncated}…`;
}

export function formatCurrency(value: number | null): string {
  if (value == null) {
    return 'Call for price';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function compactLocation(location: string): string {
  return location
    .replace('Baltimore, Maryland', 'Baltimore, MD')
    .replace('Hamilton, New Jersey', 'Hamilton, NJ')
    .replace('Hamilton, NJ (Material Solutions Inc.)', 'Hamilton, NJ');
}

export function displayName(payload: PublishPayload): string {
  return collapseWhitespace([
    payload.year,
    payload.make,
    payload.model,
    payload.unit_type,
  ].filter(Boolean).join(' '));
}

function fallbackImageUrl(payload: PublishPayload): string {
  const canonicalUrl = new URL(payload.canonical_url, 'https://www.materialsolutionsnj.com');
  return `${canonicalUrl.origin}/inventory/${payload.canonical_slug}/opengraph-image`;
}

export function getImageUrls(payload: PublishPayload, maxImages: number): string[] {
  const source = payload.image_urls.length > 0
    ? payload.image_urls
    : [payload.primary_image_url ?? fallbackImageUrl(payload)];
  return source.slice(0, maxImages).map((image) => image ?? fallbackImageUrl(payload));
}

export function getPrimaryImageUrl(payload: PublishPayload, imageUrls: string[]): string {
  return payload.primary_image_url ?? imageUrls[0] ?? fallbackImageUrl(payload);
}

export function buildFeatureLine(payload: PublishPayload): string {
  const parts = [...payload.key_specs, ...payload.feature_bullets].filter(Boolean);
  return collapseWhitespace(parts.join(' • '));
}

export function buildDescriptionSections(payload: PublishPayload): string[] {
  const specs = buildFeatureLine(payload);
  return [
    payload.description,
    specs ? `Key details: ${specs}.` : '',
    payload.faq_snippets.length > 0 ? `FAQ cues: ${payload.faq_snippets.join(' ')}` : '',
    payload.sold_as_lot_only ? 'Pricing note: sold as part of a lot; confirm exact sale structure before publishing.' : `Price: ${formatCurrency(payload.price_usd)}.`,
    `Location: ${compactLocation(payload.location)}.`,
    `Listing URL: ${payload.canonical_url}`,
  ].filter(Boolean);
}

export function buildManualPostingInstructions(platformLabel: string, payload: PublishPayload): string {
  return [
    `1. Open ${platformLabel} and start a new forklift listing for ${displayName(payload)}.`,
    '2. Paste the formatted title and description exactly as generated here.',
    '3. Upload the image set in the listed order and confirm the lead image is first.',
    `4. Use ${payload.canonical_url} as the internal reference URL or dealer notes link if the platform supports it.`,
    '5. Re-check category, price visibility, and lot-sale caveats before submitting.',
  ].join(' ');
}

export function buildPlatformOutput(
  platformId: PlatformId,
  payload: PublishPayload,
  options: {
    titleSource: string;
    descriptionSource: string;
    platformSpecificFields?: Record<string, unknown>;
    postingInstructions?: string | null;
  }
): PlatformOutput {
  const spec = PLATFORM_SPECS[platformId];
  const warnings: string[] = [];
  const imageUrls = getImageUrls(payload, spec.imageMax);

  return {
    title: truncateAtWordBoundary(options.titleSource, spec.titleMax, `${platformId} title`, warnings),
    description: truncateAtWordBoundary(options.descriptionSource, spec.descriptionMax, `${platformId} description`, warnings),
    price: payload.sold_as_lot_only ? null : payload.price_usd,
    primary_image_url: getPrimaryImageUrl(payload, imageUrls),
    image_urls: imageUrls,
    category_mapping: spec.categoryMapping,
    platform_specific_fields: {
      sold_as_lot_only: payload.sold_as_lot_only,
      ...payload.platform_specific_fields,
      ...options.platformSpecificFields,
    },
    posting_instructions: spec.manualPosting ? (options.postingInstructions ?? buildManualPostingInstructions(platformId, payload)) : null,
    char_limit_warnings: warnings,
  };
}

function locationLabel(input: AssembledPublishPayload): string {
  return [input.location.city, input.location.state].filter(Boolean).join(', ');
}

function inferCanonicalSlug(input: AssembledPublishPayload): string {
  const url = new URL(input.canonical_url, 'https://www.materialsolutionsnj.com');
  return url.pathname.split('/').filter(Boolean).at(-1) ?? input.unit_id.toLowerCase();
}

function inferCondition(input: AssembledPublishPayload): string | null {
  const value = input.platformSpecificFields.condition;
  return typeof value === 'string' ? value : null;
}

function parseAssembledTitle(title: string): {
  year: number | null;
  make: string;
  model: string;
  unitType: string;
} {
  const withoutLocation = title.replace(/\s+-\s+[^-]+$/, '').replace(/\s+Lot Sale Only$/i, '').trim();
  const yearMatch = withoutLocation.match(/^(\d{4})\s+(.*)$/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const remainder = (yearMatch ? yearMatch[2] : withoutLocation).trim();

  const knownUnitTypes = ['Order Picker', 'Reach Truck', 'Swing Reach', 'Articulated Forklift'];
  const unitType = knownUnitTypes.find((candidate) => remainder.endsWith(candidate)) ?? 'Forklift';
  const stem = unitType === 'Forklift'
    ? remainder
    : remainder.slice(0, Math.max(0, remainder.length - unitType.length)).trim();
  const [make = 'Unknown', ...modelParts] = stem.split(/\s+/).filter(Boolean);

  return {
    year,
    make,
    model: modelParts.join(' ') || make,
    unitType,
  };
}

export function toFormatterPayload(input: AssembledPublishPayload): PublishPayload {
  const parsedTitle = parseAssembledTitle(input.title);
  const categoryHints = [
    input.platformSpecificFields.category,
    input.platformSpecificFields.category_id,
    input.platformSpecificFields.contact_method,
  ].filter(Boolean).map(String);

  return {
    unit_id: input.unit_id,
    canonical_slug: inferCanonicalSlug(input),
    year: parsedTitle.year,
    make: parsedTitle.make,
    model: parsedTitle.model,
    unit_type: parsedTitle.unitType,
    condition: inferCondition(input),
    location: locationLabel(input),
    price_usd: input.price,
    sold_as_lot_only: Boolean(input.platformSpecificFields.sold_as_lot_only),
    key_specs: categoryHints,
    feature_bullets: [],
    description: input.description,
    faq_snippets: input.warnings,
    primary_image_url: input.images[0]?.src ?? null,
    image_urls: input.images.map((image) => image.src),
    canonical_url: new URL(input.canonical_url, 'https://www.materialsolutionsnj.com').toString(),
    platform_specific_fields: { ...input.platformSpecificFields },
  };
}
