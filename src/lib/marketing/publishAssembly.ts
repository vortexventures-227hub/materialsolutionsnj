import {
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
  type ForkliftUnit,
} from './schemaTransformers';

export type PublishTarget =
  | 'facebook_marketplace'
  | 'craigslist'
  | 'ebay'
  | 'linkedin'
  | 'website'
  | 'email_campaign';

export interface PublishPayload {
  target: PublishTarget;
  unit_id: string;
  title: string;
  description: string;
  images: { src: string; alt: string }[];
  price: number | null;
  location: { city: string; state: string };
  schema: { product?: object; vehicle?: object; faqPage?: object; breadcrumb?: object };
  metaTags: { seo_title: string; meta_description: string; og: object; twitter: object };
  platformSpecificFields: Record<string, unknown>;
  canonical_url: string;
  warnings: string[];
}

type LocationParts = {
  city: string;
  state: string;
};

type TargetSpec = {
  titleMax: number | null;
  imageMax: number;
};

const SITE_URL = 'https://www.materialsolutionsnj.com';

const TARGET_SPECS: Record<PublishTarget, TargetSpec> = {
  facebook_marketplace: {
    titleMax: 100,
    imageMax: 10,
  },
  craigslist: {
    titleMax: 70,
    imageMax: 12,
  },
  ebay: {
    titleMax: 80,
    imageMax: 24,
  },
  linkedin: {
    titleMax: 200,
    imageMax: 8,
  },
  website: {
    titleMax: null,
    imageMax: 8,
  },
  email_campaign: {
    titleMax: null,
    imageMax: 4,
  },
};

const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sentenceCaseUnitType(unitType: string): string {
  const normalized = unitType.toLowerCase();

  if (normalized.includes('order picker')) return 'Order Picker';
  if (normalized.includes('reach truck')) return 'Reach Truck';
  if (normalized.includes('swing reach')) return 'Swing Reach';
  if (normalized.includes('articulated') || normalized.includes('bendi')) return 'Articulated Forklift';

  return unitType;
}

function getDisplayName(unit: ForkliftUnit): string {
  return collapseWhitespace(
    [unit.year, unit.make, unit.model, sentenceCaseUnitType(unit.unit_type)]
      .filter(Boolean)
      .join(' ')
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeState(value: string): string {
  const cleaned = value.replace(/\(.*?\)/g, '').trim();
  const lower = cleaned.toLowerCase();
  if (STATE_ABBREVIATIONS[lower]) {
    return STATE_ABBREVIATIONS[lower];
  }

  return cleaned.toUpperCase();
}

function parseLocation(location: string): LocationParts {
  const cleaned = collapseWhitespace(location.replace(/\s*\(.*?\)\s*/g, ''));
  const [cityRaw = '', stateRaw = ''] = cleaned.split(',').map((part) => part.trim());

  return {
    city: cityRaw || cleaned,
    state: normalizeState(stateRaw),
  };
}

function buildTitleBase(unit: ForkliftUnit): string {
  const location = parseLocation(unit.location);
  const locationLabel = `${location.city}, ${location.state}`;

  if (unit.sold_as_lot_only) {
    return `${getDisplayName(unit)} Lot Sale Only - ${locationLabel}`;
  }

  return `${getDisplayName(unit)} - ${locationLabel}`;
}

function trimAtWordBoundary(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const slice = value.slice(0, maxLength + 1);
  const boundary = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('-'));
  if (boundary > 0) {
    return slice.slice(0, boundary).trimEnd();
  }

  return value.slice(0, maxLength).trimEnd();
}

function buildTitle(unit: ForkliftUnit, target: PublishTarget, warnings: string[]): string {
  const spec = TARGET_SPECS[target];
  const titleBase = buildTitleBase(unit);

  if (spec.titleMax == null) {
    return titleBase;
  }

  const truncated = trimAtWordBoundary(titleBase, spec.titleMax);
  if (truncated !== titleBase) {
    warnings.push(
      `platform-limit truncation: title truncated to ${spec.titleMax} chars for ${target}`
    );
  }

  return truncated;
}

function buildDescription(unit: ForkliftUnit, target: PublishTarget): string {
  const location = parseLocation(unit.location);
  const specs = [
    unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lb capacity` : null,
    unit.mast_extended_inches ? `${unit.mast_extended_inches}" max lift` : null,
    unit.hours_approx ? `approx. ${unit.hours_approx.toLocaleString()} hours` : null,
    unit.battery ? unit.battery : null,
  ].filter(Boolean);

  const priceSentence = unit.sold_as_lot_only
    ? 'Sold as part of a lot only; individual-unit pricing is not advertised.'
    : unit.asking_price_usd != null
      ? `Asking ${formatPrice(unit.asking_price_usd)}.`
      : 'Call for pricing.';

  const featureSentence =
    unit.features.length > 0 ? `Features include ${unit.features.join(', ')}.` : '';

  const base = collapseWhitespace(
    `${getDisplayName(unit)} located in ${location.city}, ${location.state}. ${specs.join(', ')}. ${priceSentence} ${featureSentence}`
  );

  if (target === 'email_campaign') {
    return collapseWhitespace(
      `${base} View the current listing and reply to discuss inspection, delivery, or purchase timing.`
    );
  }

  if (target === 'website') {
    return collapseWhitespace(`${base} Inventory details and structured data are attached in this publish payload.`);
  }

  return base;
}

function buildImages(unit: ForkliftUnit, target: PublishTarget, warnings: string[]): {
  src: string;
  alt: string;
}[] {
  const spec = TARGET_SPECS[target];
  const allImages = unit.media_paths.map((mediaPath) => ({
    src: mediaPath,
    alt: toAltText(mediaPath, unit),
  }));

  if (allImages.length > spec.imageMax) {
    warnings.push(
      `image-count cap: reduced image set from ${allImages.length} to ${spec.imageMax} for ${target}`
    );
  }

  return allImages.slice(0, spec.imageMax);
}

function buildCanonicalUrl(unit: ForkliftUnit, target: PublishTarget): string {
  const fullUrl = toCanonicalURL(unit);

  if (target === 'website') {
    return new URL(fullUrl).pathname;
  }

  return fullUrl;
}

function buildMetaTags(unit: ForkliftUnit, target: PublishTarget): PublishPayload['metaTags'] {
  const og = toOGMeta(unit);
  const twitter = toTwitterCard(unit);

  if (target === 'website') {
    const path = new URL(og.url).pathname;
    return {
      seo_title: toSEOTitle(unit),
      meta_description: toMetaDescription(unit),
      og: {
        ...og,
        url: path,
      },
      twitter,
    };
  }

  return {
    seo_title: toSEOTitle(unit),
    meta_description: toMetaDescription(unit),
    og,
    twitter,
  };
}

function buildPlatformSpecificFields(unit: ForkliftUnit, target: PublishTarget): Record<string, unknown> {
  const location = parseLocation(unit.location);
  const commonFields = {
    slug: unit.canonical_slug,
    source_kind: unit.source_kind,
    sold_as_lot_only: unit.sold_as_lot_only,
  };

  switch (target) {
    case 'facebook_marketplace':
      return {
        ...commonFields,
        category: 'VEHICLES > FORKLIFTS',
        contact_method: 'marketplace_inbox',
      };
    case 'craigslist':
      return {
        ...commonFields,
        category: 'heavy equipment > forklifts',
        area: `${location.city}, ${location.state}`,
      };
    case 'ebay':
      return {
        ...commonFields,
        category_id: '26491',
        condition: unit.condition ?? 'Used',
        capacity_lbs: unit.capacity_lbs,
        hours_approx: unit.hours_approx,
      };
    case 'linkedin':
      return {
        ...commonFields,
        post_type: 'organic_social',
        audience: 'professional_network',
        hashtags: ['forklift', 'materialhandling', 'usedequipment', 'warehousing'],
      };
    case 'website':
      return {
        ...commonFields,
        canonical_path: buildCanonicalUrl(unit, target),
        indexable: true,
      };
    case 'email_campaign':
      return {
        ...commonFields,
        preheader: unit.sold_as_lot_only
          ? `${getDisplayName(unit)} is available now as a lot-only opportunity in ${location.city}, ${location.state}.`
          : `${getDisplayName(unit)} is available now in ${location.city}, ${location.state}.`,
        cta_label: 'View equipment details',
      };
  }
}

function collectWarnings(
  unit: ForkliftUnit,
  target: PublishTarget,
  payload: Omit<PublishPayload, 'warnings'>
): string[] {
  const warnings: string[] = [];

  if (!payload.location.city || !payload.location.state) {
    warnings.push('missing required field: location');
  }

  if (payload.images.length === 0) {
    warnings.push('missing required field: images');
  }

  if (!unit.sold_as_lot_only && target !== 'website' && target !== 'email_campaign' && payload.price == null) {
    warnings.push('missing required field: price');
  }

  return warnings;
}

export function assemblePublishPayload(unit: ForkliftUnit, target: PublishTarget): PublishPayload {
  const warnings: string[] = [];
  const title = buildTitle(unit, target, warnings);
  const description = buildDescription(unit, target);
  const images = buildImages(unit, target, warnings);
  const payloadWithoutWarnings: Omit<PublishPayload, 'warnings'> = {
    target,
    unit_id: unit.unit_id,
    title,
    description,
    images,
    price: unit.sold_as_lot_only ? null : unit.asking_price_usd,
    location: parseLocation(unit.location),
    schema: {
      product: toProductSchema(unit),
      vehicle: toVehicleSchema(unit),
      faqPage: toFAQPageSchema(unit),
      breadcrumb: toBreadcrumbListSchema(unit),
    },
    metaTags: buildMetaTags(unit, target),
    platformSpecificFields: buildPlatformSpecificFields(unit, target),
    canonical_url: buildCanonicalUrl(unit, target),
  };

  return {
    ...payloadWithoutWarnings,
    warnings: [...warnings, ...collectWarnings(unit, target, payloadWithoutWarnings)],
  };
}
