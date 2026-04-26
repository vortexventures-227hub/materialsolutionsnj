import type { BreadcrumbList, FAQPage, Product, Vehicle, WithContext } from 'schema-dts';

const SITE_URL = 'https://www.materialsolutionsnj.com';
const FORKLIFT_ADDITIONAL_TYPE = 'https://www.productontology.org/id/Forklift_truck';

export interface StandaloneForkliftJsonUnit {
  unit_id: string;
  make: string;
  model: string;
  year: number | null;
  unit_type: string;
  location: string;
  serial?: string | null;
  capacity_lbs?: number | null;
  mast_collapsed_inches?: number | null;
  mast_extended_inches?: number | null;
  features?: string[] | null;
  battery?: string | null;
  battery_voltage?: number | null;
  hours_approx?: number | null;
  condition?: string | null;
  asking_price_usd?: number | null;
  media_paths?: string[] | null;
  video_paths?: string[] | null;
  delivery_available?: boolean | null;
  status?: string | null;
  hold_reason?: string | null;
}

export interface LotForkliftJsonUnit {
  unit_index: number;
  make: string;
  model: string;
  serial?: string | null;
  year: number | null;
}

export interface LotForkliftJson {
  lot_id: string;
  status?: string | null;
  hold_reason?: string | null;
  sold_as_lot_only?: boolean | null;
  lot_asking_price_usd?: number | null;
  per_unit_price_usd?: number | null;
  location: string;
  unit_type: string;
  guidance?: string | null;
  mast_collapsed_inches?: number | null;
  mast_extended_inches?: number | null;
  battery_and_charger_included?: boolean | null;
  hours_avg?: number | null;
  condition?: string | null;
  lot_photos?: string[] | null;
  lot_videos?: string[] | null;
  units: LotForkliftJsonUnit[];
}

export interface ForkliftUnit {
  unit_id: string;
  canonical_slug: string;
  make: string;
  model: string;
  year: number | null;
  unit_type: string;
  location: string;
  serial: string | null;
  capacity_lbs: number | null;
  mast_collapsed_inches: number | null;
  mast_extended_inches: number | null;
  features: string[];
  battery: string | null;
  battery_voltage: number | null;
  hours_approx: number | null;
  condition: string | null;
  asking_price_usd: number | null;
  media_paths: string[];
  delivery_available: boolean | null;
  status: string | null;
  hold_reason: string | null;
  sold_as_lot_only: boolean;
  lot_id: string | null;
  source_kind: 'standalone' | 'lot_member';
}

export interface OGMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'product';
}

export interface TwitterCardMeta {
  card: 'summary_large_image';
  title: string;
  description: string;
  image: string;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function getShortLocation(location: string): string {
  return location
    .replace('Baltimore, Maryland', 'Baltimore, MD')
    .replace('Hamilton, New Jersey', 'Hamilton, NJ')
    .replace('Hamilton, NJ (Material Solutions Inc.)', 'Hamilton, NJ');
}

function getCompactUnitType(unitType: string): string {
  const normalized = unitType.toLowerCase();

  if (normalized.includes('order picker')) return 'Order Picker';
  if (normalized.includes('reach truck')) return 'Reach Truck';
  if (normalized.includes('bendi') || normalized.includes('articulated')) return 'Articulated Forklift';
  if (normalized.includes('swing reach')) return 'Swing Reach';

  return unitType;
}

function getDisplayName(unit: ForkliftUnit): string {
  return collapseWhitespace(
    [unit.year, unit.make, unit.model, getCompactUnitType(unit.unit_type)]
      .filter(Boolean)
      .join(' ')
  );
}

function inferPowerType(unit: ForkliftUnit): string {
  const batterySignal = [unit.battery, unit.unit_type].filter(Boolean).join(' ').toLowerCase();

  if (batterySignal.includes('propane')) return 'Propane';
  if (batterySignal.includes('diesel')) return 'Diesel';
  return 'Electric';
}

function getAvailability(unit: ForkliftUnit): string {
  return unit.status === 'available'
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';
}

function getItemCondition(unit: ForkliftUnit): string {
  return unit.condition?.toLowerCase().includes('new')
    ? 'https://schema.org/NewCondition'
    : 'https://schema.org/UsedCondition';
}

function getPrimaryMediaPath(unit: ForkliftUnit): string | null {
  return unit.media_paths[0] ?? null;
}

function getPublicImageUrl(unit: ForkliftUnit): string {
  const primaryMedia = getPrimaryMediaPath(unit);
  if (primaryMedia && /^https?:\/\//.test(primaryMedia)) {
    return primaryMedia;
  }

  return `${SITE_URL}/favicon.svg`;
}

function combineMediaPaths(...groups: Array<string[] | null | undefined>): string[] {
  const seen = new Set<string>();
  const mediaPaths: string[] = [];

  for (const group of groups) {
    for (const mediaPath of group ?? []) {
      const key = mediaPath.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      mediaPaths.push(mediaPath);
    }
  }

  return mediaPaths;
}

function getKeySpecsSummary(unit: ForkliftUnit): string {
  const facts = [
    unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lb capacity` : null,
    unit.hours_approx ? `${unit.hours_approx.toLocaleString()} hours` : null,
    unit.asking_price_usd && !unit.sold_as_lot_only ? formatUsd(unit.asking_price_usd) : null,
    unit.sold_as_lot_only ? 'lot sale only' : null,
  ].filter(Boolean);

  return facts.length > 0 ? facts.join(', ') : 'current forklift inventory';
}

function inferAngleLabel(mediaPath: string): string {
  const lower = mediaPath.toLowerCase();

  if (lower.includes('video_screenshot')) return 'video still';
  if (/(still|photo|lot)[_-]?0?1\b/.test(lower)) return 'front-left view';
  if (/(still|photo|lot)[_-]?0?2\b/.test(lower)) return 'side profile';
  if (/(still|photo|lot)[_-]?0?3\b/.test(lower)) return 'rear-right view';
  if (lower.includes('video')) return 'video preview still';

  return 'equipment photo';
}

function getKnownVehicleDamages(unit: ForkliftUnit): string | undefined {
  const condition = unit.condition?.trim();
  if (!condition) return undefined;

  if (condition.toLowerCase().includes('wear')) return condition;
  return undefined;
}

export function normalizeStandaloneUnit(unit: StandaloneForkliftJsonUnit): ForkliftUnit {
  return {
    unit_id: unit.unit_id,
    canonical_slug: normalizeSlug(unit.unit_id),
    make: unit.make,
    model: unit.model,
    year: unit.year ?? null,
    unit_type: unit.unit_type,
    location: unit.location,
    serial: unit.serial ?? null,
    capacity_lbs: unit.capacity_lbs ?? null,
    mast_collapsed_inches: unit.mast_collapsed_inches ?? null,
    mast_extended_inches: unit.mast_extended_inches ?? null,
    features: unit.features ?? [],
    battery: unit.battery ?? null,
    battery_voltage: unit.battery_voltage ?? null,
    hours_approx: unit.hours_approx ?? null,
    condition: unit.condition ?? null,
    asking_price_usd: unit.asking_price_usd ?? null,
    media_paths: combineMediaPaths(unit.media_paths, unit.video_paths),
    delivery_available: unit.delivery_available ?? null,
    status: unit.status ?? null,
    hold_reason: unit.hold_reason ?? null,
    sold_as_lot_only: false,
    lot_id: null,
    source_kind: 'standalone',
  };
}

export function normalizeLotUnitMember(
  lot: LotForkliftJson,
  member: LotForkliftJsonUnit
): ForkliftUnit {
  return {
    unit_id: `${lot.lot_id}-unit-${member.unit_index}`,
    canonical_slug: normalizeSlug(`${lot.lot_id}-unit-${member.unit_index}`),
    make: member.make,
    model: member.model,
    year: member.year ?? null,
    unit_type: lot.unit_type,
    location: lot.location,
    serial: member.serial ?? null,
    capacity_lbs: null,
    mast_collapsed_inches: lot.mast_collapsed_inches ?? null,
    mast_extended_inches: lot.mast_extended_inches ?? null,
    features: lot.guidance ? [lot.guidance] : [],
    battery: lot.battery_and_charger_included ? 'Battery + Charger Included' : null,
    battery_voltage: null,
    hours_approx: lot.hours_avg ?? null,
    condition: lot.condition ?? null,
    asking_price_usd: lot.sold_as_lot_only ? null : (lot.per_unit_price_usd ?? null),
    media_paths: combineMediaPaths(lot.lot_photos, lot.lot_videos),
    delivery_available: true,
    status: lot.status ?? null,
    hold_reason: lot.hold_reason ?? null,
    sold_as_lot_only: Boolean(lot.sold_as_lot_only),
    lot_id: lot.lot_id,
    source_kind: 'lot_member',
  };
}

export function toCanonicalURL(unit: ForkliftUnit): string {
  return `${SITE_URL}/inventory/${unit.canonical_slug}`;
}

export function toSEOTitle(unit: ForkliftUnit): string {
  const shortLocation = getShortLocation(unit.location);
  const displayName = getDisplayName(unit);
  const candidates = [
    `${displayName} — ${shortLocation}`,
    `${collapseWhitespace([unit.year, unit.make, unit.model, getCompactUnitType(unit.unit_type)].filter(Boolean).join(' '))} — ${shortLocation}`,
    `${collapseWhitespace([unit.year, unit.make, unit.model].filter(Boolean).join(' '))} — ${shortLocation}`,
  ];

  for (const candidate of candidates) {
    if (candidate.length <= 60) {
      return candidate;
    }
  }

  return truncate(candidates[candidates.length - 1], 60);
}

export function toMetaDescription(unit: ForkliftUnit): string {
  const base = `${getDisplayName(unit)} in ${getShortLocation(unit.location)}.`;
  const facts = getKeySpecsSummary(unit);
  const delivery = unit.delivery_available ? ' Delivery available.' : '';
  const lotOnly = unit.sold_as_lot_only ? ' Sold as lot only.' : '';

  return truncate(collapseWhitespace(`${base} ${facts}.${lotOnly}${delivery}`), 160);
}

export function toAltText(mediaPath: string, unit: ForkliftUnit): string {
  const angle = inferAngleLabel(mediaPath);
  return `${getDisplayName(unit)} ${angle}`;
}

export function toOGMeta(unit: ForkliftUnit): OGMeta {
  return {
    title: toSEOTitle(unit),
    description: toMetaDescription(unit),
    image: getPublicImageUrl(unit),
    url: toCanonicalURL(unit),
    type: 'product',
  };
}

export function toTwitterCard(unit: ForkliftUnit): TwitterCardMeta {
  const og = toOGMeta(unit);

  return {
    card: 'summary_large_image',
    title: og.title,
    description: og.description,
    image: og.image,
  };
}

export function toProductSchema(unit: ForkliftUnit): WithContext<Product> {
  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    priceCurrency: 'USD',
    availability: getAvailability(unit),
    itemCondition: getItemCondition(unit),
    url: toCanonicalURL(unit),
  };

  if (!unit.sold_as_lot_only && unit.asking_price_usd != null) {
    offers.price = String(unit.asking_price_usd);
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: getDisplayName(unit),
    description: toMetaDescription(unit),
    sku: unit.unit_id,
    model: unit.model,
    category: unit.unit_type,
    brand: {
      '@type': 'Brand',
      name: unit.make,
    },
    image: [getPublicImageUrl(unit)],
    offers,
  } as unknown as WithContext<Product>;
}

export function toVehicleSchema(unit: ForkliftUnit): WithContext<Vehicle> {
  const powerType = inferPowerType(unit);
  const knownVehicleDamages = getKnownVehicleDamages(unit);

  return {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: getDisplayName(unit),
    description: toMetaDescription(unit),
    sku: unit.unit_id,
    model: unit.model,
    modelDate: unit.year ? String(unit.year) : undefined,
    vehicleModelDate: unit.year ? String(unit.year) : undefined,
    additionalType: FORKLIFT_ADDITIONAL_TYPE,
    vehicleIdentificationNumber: unit.serial ?? undefined,
    vehicleTransmission: powerType,
    fuelType: powerType,
    knownVehicleDamages,
    image: [getPublicImageUrl(unit)],
    brand: {
      '@type': 'Brand',
      name: unit.make,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      ...(unit.sold_as_lot_only || unit.asking_price_usd == null
        ? {}
        : { price: String(unit.asking_price_usd) }),
      availability: getAvailability(unit),
      itemCondition: getItemCondition(unit),
      url: toCanonicalURL(unit),
    },
  } as unknown as WithContext<Vehicle>;
}

function toFAQPageSchemaFromEntries(faqs: FAQEntry[]): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } as unknown as WithContext<FAQPage>;
}

export function toFAQPageSchema(input: ForkliftUnit): WithContext<FAQPage>;
export function toFAQPageSchema(input: FAQEntry[]): WithContext<FAQPage>;
export function toFAQPageSchema(input: ForkliftUnit | FAQEntry[]): WithContext<FAQPage> {
  if (Array.isArray(input)) {
    return toFAQPageSchemaFromEntries(input);
  }

  const unit = input;
  const specsAnswer = collapseWhitespace(
    [
      unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lb capacity.` : null,
      unit.mast_extended_inches ? `${unit.mast_extended_inches}" max lift.` : null,
      unit.hours_approx ? `${unit.hours_approx.toLocaleString()} hours.` : null,
      unit.features.length > 0 ? `Features include ${unit.features.join(', ')}.` : null,
      unit.sold_as_lot_only ? 'This unit is sold only as part of its lot.' : null,
    ]
      .filter(Boolean)
      .join(' ')
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${getDisplayName(unit)} available?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            unit.status === 'available'
              ? `${getDisplayName(unit)} is currently marked available.`
              : `${getDisplayName(unit)} is not currently marked available${unit.hold_reason ? `: ${unit.hold_reason}.` : '.'}`,
        },
      },
      {
        '@type': 'Question',
        name: `Where is ${getDisplayName(unit)} located?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${getDisplayName(unit)} is located in ${unit.location}.${unit.delivery_available ? ' Delivery is available.' : ''}`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the key specs for ${getDisplayName(unit)}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: specsAnswer || `${getDisplayName(unit)} is listed in current inventory.`,
        },
      },
    ],
  } as unknown as WithContext<FAQPage>;
}

export function toBreadcrumbListSchema(unit: ForkliftUnit): WithContext<BreadcrumbList> {
  const categoryLabel = getCompactUnitType(unit.unit_type);
  const categorySlug = normalizeSlug(categoryLabel);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Inventory',
        item: `${SITE_URL}/inventory`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryLabel,
        item: `${SITE_URL}/inventory?category=${categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: getDisplayName(unit),
        item: toCanonicalURL(unit),
      },
    ],
  } as unknown as WithContext<BreadcrumbList>;
}
