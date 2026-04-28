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
} from '../schemaTransformers';
import {
  formatPlatformPayload,
  type PublishPayload as FormatterPublishPayload,
} from '../formatters';
import type {
  CanonicalConditionGrade,
  CanonicalContent,
  CanonicalFeatureItem,
  CanonicalKeywordTarget,
  CanonicalMediaAsset,
  CanonicalPricePosture,
  CanonicalPlatformOverride,
} from './types';
import { PUBLIC_PHONE_LABEL } from '@/lib/contactDetails';

const SITE_URL = 'https://www.materialsolutionsnj.com';
const PUBLIC_CONTACT_EMAIL = 'info@materialsolutionsnj.com';
const PUBLIC_CONTACT_PHONE = PUBLIC_PHONE_LABEL;
const SOURCE_UPDATED_AT = '2026-04-21T00:00:00.000Z';
const DERIVATION_VERSION = 'herm-v1-lane-h-exec-1';
const PLATFORM_TARGETS = [
  'facebook_marketplace',
  'craigslist',
  'ebay',
  'website',
  'email_campaign',
] as const;
const FORMATTER_TARGETS = [
  'facebook_marketplace',
  'craigslist',
  'ebay',
  'machinery_trader',
  'iron_planet',
  'offer_up',
  'linkedin',
] as const;

const STATE_ABBREVIATIONS: Record<string, string> = {
  maryland: 'MD',
  'new jersey': 'NJ',
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function toSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function shortUnitType(unitType: string): string {
  const normalized = unitType.toLowerCase();
  if (normalized.includes('order picker')) return 'Order Picker';
  if (normalized.includes('reach truck')) return 'Reach Truck';
  if (normalized.includes('swing reach')) return 'Swing Reach';
  if (normalized.includes('articulated') || normalized.includes('bendi')) return 'Articulated Forklift';
  return unitType;
}

function displayName(unit: ForkliftUnit): string {
  return collapseWhitespace([unit.year, unit.make, unit.model, shortUnitType(unit.unit_type)].filter(Boolean).join(' '));
}

function parseLocation(location: string): { city: string | null; state: string | null; label: string } {
  const label = collapseWhitespace(location.replace(/\s*\(.*?\)\s*/g, ''));
  const [cityRaw = '', stateRaw = ''] = label.split(',').map((part) => part.trim());
  const city = cityRaw || null;
  const state = STATE_ABBREVIATIONS[stateRaw.toLowerCase()] ?? (stateRaw ? stateRaw.toUpperCase() : null);
  return { city, state, label };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function inferConditionGrade(unit: ForkliftUnit): CanonicalConditionGrade {
  const condition = (unit.condition ?? '').toLowerCase();
  if (condition.includes('retail ready')) return 'excellent';
  if (condition.includes('running')) return 'good';
  if (condition.includes('wear')) return 'fair';
  if (condition.includes('parts') || condition.includes('non-running')) return 'parts_only';
  return unit.status === 'available' ? 'good' : 'fair';
}

function buildConditionSummary(unit: ForkliftUnit, grade: CanonicalConditionGrade): string {
  if (unit.condition) {
    if (unit.hours_approx && unit.hours_approx < 5000) {
      return collapseWhitespace(`${unit.condition}, lower-hours for age.`);
    }
    return unit.condition;
  }

  return {
    excellent: 'Retail-ready presentation from current inventory notes.',
    good: 'Used running condition from current inventory notes.',
    fair: 'Used condition with ordinary warehouse wear.',
    parts_only: 'Parts or repair candidate; verify operating status before publish.',
  }[grade];
}

function buildWarranty(unit: ForkliftUnit): string | null {
  if (unit.sold_as_lot_only) {
    return 'Lot inventory is represented with the Maryland package warranty notes: 90-day full-unit, 6-month major component, and 12-month battery/charger coverage.';
  }
  return null;
}

function buildFeatureList(unit: ForkliftUnit): CanonicalFeatureItem[] {
  const features = unit.features.map((feature) => ({
    label: titleCase(feature.replace(/[-_]+/g, ' ')),
    value: 'Included',
    highlight: true,
  }));

  if (unit.capacity_lbs) {
    features.unshift({
      label: 'Capacity',
      value: `${unit.capacity_lbs.toLocaleString()} lb`,
      highlight: true,
    });
  }

  if (unit.mast_extended_inches) {
    features.push({
      label: 'Max Lift',
      value: `${unit.mast_extended_inches}\"`,
      highlight: true,
    });
  }

  if (unit.battery) {
    features.push({
      label: 'Power',
      value: unit.battery,
      highlight: false,
    });
  }

  return features;
}

function buildKeywordTargets(unit: ForkliftUnit, conditionSummary: string, location: { city: string | null; state: string | null }): CanonicalKeywordTarget[] {
  const geo = [location.city, location.state].filter(Boolean).join(' ').toLowerCase();
  const type = shortUnitType(unit.unit_type).toLowerCase();
  const model = `${unit.year ?? 'used'} ${unit.make} ${unit.model}`.toLowerCase();

  const entries: CanonicalKeywordTarget[] = [
    { keyword: collapseWhitespace(`used ${unit.make} ${type} ${geo}`), intent: 'seo' },
    { keyword: collapseWhitespace(`${model} for sale`), intent: 'brand' },
    { keyword: collapseWhitespace(`${unit.capacity_lbs ?? ''} lb ${type} ${geo}`), intent: 'geo' },
    { keyword: collapseWhitespace(`${conditionSummary} ${type}`).toLowerCase(), intent: 'marketplace' },
  ];

  return entries.filter(
    (entry, index, arr) => entry.keyword && arr.findIndex((candidate) => candidate.keyword === entry.keyword) === index
  );
}

function buildFaq(unit: ForkliftUnit, location: { city: string | null; state: string | null; label: string }) {
  const name = displayName(unit);
  const faqs = [
    {
      question: `What equipment is ${unit.unit_id}?`,
      answer: `${unit.unit_id} is a ${name}.`,
      grounding: ['unit_id', 'year', 'make', 'model', 'unit_type'],
    },
    {
      question: `Where is ${name} located?`,
      answer: `${name} is located in ${location.label}.`,
      grounding: ['location_label'],
    },
    {
      question: `Is ${name} available now?`,
      answer: unit.status === 'available'
        ? `${name} is currently marked available.`
        : `${name} is not currently marked available${unit.hold_reason ? `: ${unit.hold_reason}.` : '.'}`,
      grounding: ['inventory_status', 'hold_flag'],
    },
  ];

  if (unit.capacity_lbs) {
    faqs.push({
      question: `What is the lifting capacity of ${name}?`,
      answer: `${name} is listed at ${unit.capacity_lbs.toLocaleString()} lb capacity.`,
      grounding: ['capacity_lbs'],
    });
  }

  if (unit.battery) {
    faqs.push({
      question: `What battery or power setup comes with ${name}?`,
      answer: `${name} includes ${unit.battery}.`,
      grounding: ['battery_summary', 'battery_voltage'],
    });
  }

  if (unit.sold_as_lot_only) {
    faqs.push({
      question: `Is ${name} sold individually?`,
      answer: `${name} is marked lot-sale only and should not be advertised with individual pricing.`,
      grounding: ['lot_only_flag', 'price_posture'],
    });
  }

  return faqs.slice(0, 5);
}

function toPublicUrl(path: string): string | null {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const filename = path.split('/').pop();
  return filename ? `${SITE_URL}/inventory-media/${encodeURIComponent(filename)}` : null;
}

function buildImages(unit: ForkliftUnit): CanonicalMediaAsset[] {
  return unit.media_paths
    .filter((source_path) => /\.(jpe?g|png|webp|gif|svg)$/i.test(source_path))
    .map((source_path, index) => ({
      source_path,
      public_url: toPublicUrl(source_path),
      alt: toAltText(source_path, unit),
      role: index === 0 ? 'primary' : unit.sold_as_lot_only ? 'lot' : 'gallery',
      sort_order: index,
    }));
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildLongDescription(unit: ForkliftUnit, location: { city: string | null; state: string | null; label: string }, conditionSummary: string, warrantyTermsShort: string | null): string {
  const detailBits = [
    unit.capacity_lbs ? `${unit.capacity_lbs.toLocaleString()} lb capacity` : null,
    unit.mast_collapsed_inches ? `${unit.mast_collapsed_inches}\" collapsed mast` : null,
    unit.mast_extended_inches ? `${unit.mast_extended_inches}\" max lift` : null,
    unit.battery ? unit.battery : null,
    unit.hours_approx ? `approximately ${unit.hours_approx.toLocaleString()} hours` : null,
    unit.features.length > 0 ? `features include ${unit.features.join(', ')}` : null,
  ].filter(Boolean);

  const pricing = unit.sold_as_lot_only
    ? 'This inventory is designated for lot-sale handling only, so individual-unit pricing should not be published.'
    : unit.asking_price_usd != null
      ? `Current asking price is ${formatCurrency(unit.asking_price_usd)}.`
      : 'Pricing is handled as call-for-price.';

  return collapseWhitespace([
    `${displayName(unit)} is available in ${location.label}.`,
    conditionSummary,
    detailBits.length ? `${detailBits.join(', ')}.` : '',
    pricing,
    warrantyTermsShort ?? '',
  ].join(' '));
}

function buildPriceJustification(unit: ForkliftUnit): string | null {
  if (unit.sold_as_lot_only) {
    return 'Lot-sale-only handling protects package value and keeps the Maryland order-picker group aligned with the seller loading and disassembly scope.';
  }

  if (unit.asking_price_usd && unit.asking_price_usd >= 70000) {
    return 'Asking price reflects current narrow-aisle specialization, mast configuration, and battery package noted in source inventory.';
  }

  return null;
}

function buildTeasers(unit: ForkliftUnit, location: { city: string | null; state: string | null }, conditionSummary: string): Record<string, string> {
  const marketPrice = unit.sold_as_lot_only
    ? 'Lot sale only.'
    : unit.asking_price_usd != null
      ? `Asking ${formatCurrency(unit.asking_price_usd)}.`
      : 'Call for price.';

  return {
    website: truncate(collapseWhitespace(`${displayName(unit)} in ${location.city ?? 'inventory'}, ${location.state ?? ''}. ${conditionSummary} ${marketPrice}`), 160),
    marketplace: collapseWhitespace(`${displayName(unit)} — ${marketPrice} Located in ${location.city ?? 'current inventory'}.`),
    email_campaign: collapseWhitespace(`${displayName(unit)} is live now. ${marketPrice}`),
  };
}

function buildPricePosture(unit: ForkliftUnit): CanonicalPricePosture {
  if (unit.sold_as_lot_only) return 'lot_only';
  if (unit.asking_price_usd != null) return 'fixed';
  return 'call_for_price';
}

function buildFormatterPayload(
  unit: ForkliftUnit,
  canonical: {
    canonical_slug: string;
    canonical_url: string;
    long_description: string;
    feature_list: CanonicalFeatureItem[];
    faq: Array<{ question: string; answer: string }>;
    images: CanonicalMediaAsset[];
  }
): FormatterPublishPayload {
  return {
    unit_id: unit.unit_id,
    canonical_slug: canonical.canonical_slug,
    year: unit.year,
    make: unit.make,
    model: unit.model,
    unit_type: shortUnitType(unit.unit_type),
    condition: unit.condition ?? null,
    location: canonicalUrlSafeLocationLabel(unit.location),
    price_usd: unit.sold_as_lot_only ? null : unit.asking_price_usd,
    sold_as_lot_only: unit.sold_as_lot_only,
    key_specs: canonical.feature_list
      .filter((feature) => feature.highlight)
      .map((feature) => collapseWhitespace([feature.label, feature.value].filter(Boolean).join(': '))),
    feature_bullets: unit.features,
    description: canonical.long_description,
    faq_snippets: canonical.faq.map((entry) => `${entry.question} ${entry.answer}`),
    primary_image_url: canonical.images[0]?.public_url ?? null,
    image_urls: canonical.images.map((image) => image.public_url).filter((url): url is string => Boolean(url)),
    canonical_url: canonical.canonical_url,
    platform_specific_fields: {},
  };
}

function canonicalUrlSafeLocationLabel(location: string): string {
  return collapseWhitespace(location.replace(/\s*\(.*?\)\s*/g, ''));
}

function buildPlatformOverrides(
  unit: ForkliftUnit,
  canonical: {
    canonical_slug: string;
    canonical_url: string;
    long_description: string;
    feature_list: CanonicalFeatureItem[];
    faq: Array<{ question: string; answer: string }>;
    images: CanonicalMediaAsset[];
  }
): CanonicalPlatformOverride[] {
  const formatterPayload = buildFormatterPayload(unit, canonical);

  return FORMATTER_TARGETS.map((channel) => {
    const formatted = formatPlatformPayload(channel, formatterPayload);

    return {
      channel,
      unit_id: unit.unit_id,
      title: formatted.title,
      description: formatted.description,
      price: formatted.price,
      category: formatted.category_mapping,
      canonical_url: canonical.canonical_url,
      image_urls: formatted.image_urls,
      platform_specific_fields: formatted.platform_specific_fields,
    };
  });
}

export function generateMarketingAssets(unit: ForkliftUnit): CanonicalContent {
  const location = parseLocation(unit.location);
  const canonical_slug = unit.canonical_slug || toSlug(unit.unit_id);
  const canonical_url = toCanonicalURL({ ...unit, canonical_slug });
  const seo_title = toSEOTitle(unit);
  const meta_description = toMetaDescription(unit);
  const og = toOGMeta(unit);
  const twitter = toTwitterCard(unit);
  const condition_grade = inferConditionGrade(unit);
  const condition_summary = buildConditionSummary(unit, condition_grade);
  const warranty_terms_short = buildWarranty(unit);
  const images = buildImages(unit);
  const faq = buildFaq(unit, location);
  const feature_list = buildFeatureList(unit);
  const long_description = buildLongDescription(unit, location, condition_summary, warranty_terms_short);
  const title = displayName(unit);
  const subtitle = unit.sold_as_lot_only
    ? collapseWhitespace(`${location.label} · lot-sale only`)
    : collapseWhitespace(`${location.label}${unit.asking_price_usd ? ` · ${formatCurrency(unit.asking_price_usd)}` : ' · call for price'}`);
  const platform_overrides = buildPlatformOverrides(unit, {
    canonical_slug,
    canonical_url,
    long_description,
    feature_list,
    faq,
    images,
  });
  const isIndividualLotMember =
    unit.sold_as_lot_only &&
    unit.source_kind === 'lot_member' &&
    unit.unit_id !== unit.lot_id;

  return {
    unit_id: unit.unit_id,
    source_kind: unit.sold_as_lot_only ? 'lot' : 'unit',
    source_record_id: unit.lot_id ?? unit.unit_id,
    legacy_source_ids: [],
    inventory_status: unit.status ?? 'unknown',
    publish_status: unit.status === 'available' ? 'ready' : 'blocked',
    publish_eligibility: unit.status === 'available' && images.length > 0,
    hold_flag: unit.status !== 'available' || Boolean(unit.hold_reason),
    lot_only_flag: unit.sold_as_lot_only,
    make: unit.make,
    model: unit.model,
    year: unit.year,
    unit_type: unit.unit_type,
    title,
    subtitle,
    long_description,
    teaser_by_channel: buildTeasers(unit, location, condition_summary),
    structured_feature_list: buildFeatureList(unit),
    keyword_targets: buildKeywordTargets(unit, condition_summary, location),
    faq,
    price_justification_prose: buildPriceJustification(unit),
    condition_grade,
    condition_summary,
    warranty_terms_short,
    location_city: location.city,
    location_state: location.state,
    location_label: location.label,
    contact_email_public: PUBLIC_CONTACT_EMAIL,
    contact_phone_public: PUBLIC_CONTACT_PHONE,
    serial: unit.serial,
    capacity_lbs: unit.capacity_lbs,
    mast_collapsed_inches: unit.mast_collapsed_inches,
    mast_extended_inches: unit.mast_extended_inches,
    battery_summary: unit.battery,
    battery_voltage: unit.battery_voltage,
    hours_approx: unit.hours_approx,
    asking_price_usd: unit.sold_as_lot_only ? null : unit.asking_price_usd,
    lot_asking_price_usd: unit.sold_as_lot_only ? null : null,
    price_posture: buildPricePosture(unit),
    canonical_slug,
    canonical_url,
    seo_title,
    meta_description,
    og_title: og.title,
    og_description: og.description,
    og_image_url: images[0]?.public_url ?? `${canonical_url}/opengraph-image`,
    twitter_card: twitter.card,
    images,
    schema_pointers: {
      unit_id: unit.unit_id,
      product: toProductSchema(unit) as unknown as Record<string, unknown>,
      vehicle: toVehicleSchema(unit) as unknown as Record<string, unknown>,
      faqPage: toFAQPageSchema(faq) as unknown as Record<string, unknown>,
      breadcrumb: toBreadcrumbListSchema(unit) as unknown as Record<string, unknown>,
    },
    platform_overrides,
    manual_overrides: {},
    claim_safety_flags: [
      isIndividualLotMember ? 'lot_only_pricing' : null,
      unit.hold_reason ? 'hold_reason_present' : null,
      warranty_terms_short ? 'warranty_copy_requires_operator_confirmation' : null,
    ].filter(Boolean) as string[],
    derivation_version: DERIVATION_VERSION,
    source_updated_at: SOURCE_UPDATED_AT,
    generated_at: new Date(0).toISOString(),
  };
}
