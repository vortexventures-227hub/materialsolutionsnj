/**
 * canonicalDerivation.ts
 *
 * Pure, deterministic derivation of a CanonicalMarketingObject from a ForkliftUnit.
 * Zero network, zero LLM — same input always produces the same output.
 *
 * Produces all structured fields required by the formatter layer and OG image
 * pipeline in a single normalized canonical form.
 */

import type { FAQPage, WithContext } from 'schema-dts';

import type { ForkliftUnit } from './schemaTransformers';
import {
  toAltText,
  toCanonicalURL,
  toFAQPageSchema,
  toMetaDescription,
  toOGMeta,
  toProductSchema,
  toSEOTitle,
  toVehicleSchema,
} from './schemaTransformers';
import { formatAllChannels, type ChannelCopy } from './channelFormatters';

// ── Constants ───────────────────────────────────────────────────────────────────

const SITE_URL = 'https://www.materialsolutionsnj.com';

// ── CanonicalMarketingObject type ───────────────────────────────────────────────

/**
 * Normalized canonical form of a forklift unit for all marketing surfaces.
 * Produced by `generateCanonicalMarketingObject()` from a ForkliftUnit.
 * All fields are populated or explicitly null — no partial objects.
 */
export interface CanonicalMarketingObject {
  // ── Core identity (mirrors ForkliftUnit) ─────────────────────────────────
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

  // ── SEO / web surface ────────────────────────────────────────────────────
  canonicalUrl: string;
  ogImageUrl: string;
  seoTitle: string;
  metaDescription: string;

  // ── Full prose description ────────────────────────────────────────────────
  /** Complete unit description suitable for web and email surfaces */
  longDescription: string;

  // ── Channel copy (per-platform) ──────────────────────────────────────────
  channelCopy: ChannelCopy[];

  // ── Structured feature list ──────────────────────────────────────────────
  structuredFeatureList: string[];

  // ── FAQ surface ──────────────────────────────────────────────────────────
  /** FAQPage JSON-LD schema for the unit detail page */
  jsonLdFaqPage: WithContext<FAQPage>;

  // ── Price rationale ──────────────────────────────────────────────────────
  priceJustificationProse: string | null;

  // ── Condition grade ──────────────────────────────────────────────────────
  /**
   * Single-letter condition grade:
   * A — excellent / like new
   * B — good / well-maintained
   * C — fair / functional
   * D — poor / needs work
   * null — unknown
   */
  conditionGrade: 'A' | 'B' | 'C' | 'D' | null;

  // ── Image set ───────────────────────────────────────────────────────────
  images: Array<{ url: string; alt: string }>;

  // ── Snake_case aliases (generateMarketingAssets.ts consumer path) ──────
  // These are the forms that generateMarketingAssets reads.  They are
  // either identical values under a different name or derived from the
  // camelCase fields above.
  canonical_url: string;
  og_image_url: string;
  seo_title: string;
  meta_description: string;
  long_description: string;
  structured_feature_list: string[];
  price_usd: number | null;
  marketing_headline: string;
  marketing_summary: string;
  hold_flag: boolean;
  publish_eligibility: boolean;
  lot_only_flag: boolean;
  faq_entries: Array<{ question: string; answer: string; source_fields: string[] }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type FAQEntry = { question: string; answer: string; source_fields: string[] };

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function inferConditionGrade(condition: string | null): 'A' | 'B' | 'C' | 'D' | null {
  if (!condition) return null;
  const lower = condition.toLowerCase();
  if (/like\s*new|excellent|like\s*new/i.test(lower)) return 'A';
  if (/good|well\s*maintained/i.test(lower)) return 'B';
  if (/fair|average/i.test(lower)) return 'C';
  if (/poor|needs\s*work|as\s*is/i.test(lower)) return 'D';
  return null;
}

function buildPriceJustificationProse(unit: ForkliftUnit): string | null {
  if (unit.sold_as_lot_only) {
    return 'Price reflects lot-level valuation — individual unit pricing is not advertised. Contact the team for lot pricing and terms.';
  }
  if (unit.asking_price_usd == null) {
    return 'Price not advertised; contact the team for current valuation and available financing options.';
  }
  const parts: string[] = [];
  if (unit.hours_approx != null) {
    if (unit.hours_approx < 2000) parts.push('low hours');
    else if (unit.hours_approx > 5000) parts.push('high hours');
  }
  if (unit.condition) {
    const grade = inferConditionGrade(unit.condition);
    if (grade === 'A') parts.push('excellent condition');
    else if (grade === 'B') parts.push('good condition');
  }
  if (parts.length === 0) return null;
  return `Price reflects ${parts.join(' and ')} for a ${unit.year ?? 'unreleased'} ${unit.make} ${unit.model}.`;
}

function buildStructuredFeatureList(unit: ForkliftUnit): string[] {
  const specs: string[] = [];
  if (unit.capacity_lbs) specs.push(`${unit.capacity_lbs.toLocaleString()} lb lift capacity`);
  if (unit.hours_approx) specs.push(`~${unit.hours_approx.toLocaleString()} operating hours`);
  if (unit.mast_extended_inches) specs.push(`${unit.mast_extended_inches}" max lift height`);
  if (unit.mast_collapsed_inches) specs.push(`${unit.mast_collapsed_inches}" collapsed height`);
  if (unit.battery) specs.push(unit.battery);
  if (unit.battery_voltage) specs.push(`${unit.battery_voltage}V battery`);
  if (unit.features.length > 0) specs.push(...unit.features);
  if (unit.delivery_available) specs.push('delivery available');
  return specs;
}

function buildLongDescription(unit: ForkliftUnit): string {
  const location = unit.location.replace(/\s*\(.*?\)\s*/g, '').trim();
  const locationShort = location
    .replace('Baltimore, Maryland', 'Baltimore, MD')
    .replace('Hamilton, New Jersey', 'Hamilton, NJ')
    .replace('Hamilton, NJ (Material Solutions Inc.)', 'Hamilton, NJ');

  const displayName = collapseWhitespace(
    [unit.year, unit.make, unit.model, unit.unit_type].filter(Boolean).join(' ')
  );

  const specs: string[] = [];
  if (unit.capacity_lbs) specs.push(`${unit.capacity_lbs.toLocaleString()} lb capacity`);
  if (unit.hours_approx) specs.push(`approx. ${unit.hours_approx.toLocaleString()} hours`);
  if (unit.mast_extended_inches) specs.push(`${unit.mast_extended_inches}" max lift`);
  if (unit.battery) specs.push(unit.battery);

  const priceSentence = unit.sold_as_lot_only
    ? 'Sold as part of a lot only — individual-unit pricing is not advertised.'
    : unit.asking_price_usd != null
      ? `Asking ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(unit.asking_price_usd)}.`
      : 'Call for pricing.';

  const featureSentence =
    unit.features.length > 0 ? `Features include ${unit.features.join(', ')}.` : '';

  const base = collapseWhitespace(
    `${displayName} located in ${locationShort}. ${specs.join(', ')}. ${priceSentence} ${featureSentence}`
  );

  return collapseWhitespace(
    `${base} Inventory details and structured data are attached in this publish payload. Contact the team to discuss inspection, delivery, or purchase timing.`
  );
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Derive a fully-populated CanonicalMarketingObject from a ForkliftUnit.
 *
 * Deterministic, pure function — same input always produces identical output.
 * No network calls, no LLM invocation.
 */
export function generateCanonicalMarketingObject(unit: ForkliftUnit): CanonicalMarketingObject {
  const og = toOGMeta(unit);

  return {
    // ── ForkliftUnit fields (verbatim) ────────────────────────────────────
    ...unit,

    // ── SEO / web surface ─────────────────────────────────────────────────
    canonicalUrl: toCanonicalURL(unit),
    ogImageUrl: og.image,
    seoTitle: toSEOTitle(unit),
    metaDescription: toMetaDescription(unit),

    // ── Full prose ─────────────────────────────────────────────────────────
    longDescription: buildLongDescription(unit),

    // ── Channel copy ───────────────────────────────────────────────────────
    channelCopy: formatAllChannels(unit),

    // ── Structured features ────────────────────────────────────────────────
    structuredFeatureList: buildStructuredFeatureList(unit),

    // ── FAQ JSON-LD ────────────────────────────────────────────────────────
    jsonLdFaqPage: toFAQPageSchema(unit),

    // ── Price rationale ───────────────────────────────────────────────────
    priceJustificationProse: buildPriceJustificationProse(unit),

    // ── Condition grade ────────────────────────────────────────────────────
    conditionGrade: inferConditionGrade(unit.condition),

    // ── Images ─────────────────────────────────────────────────────────────
    images: unit.media_paths.map((path) => ({
      url: path,
      alt: toAltText(path, unit),
    })),

    // ── Snake_case aliases consumed by generateMarketingAssets.ts ──────────
    // These ensure the canonical object works even when passed directly to
    // generateMarketingAssets without going through canonicalFactory first.
    canonical_slug: unit.canonical_slug,
    canonical_url: toCanonicalURL(unit),
    og_image_url: og.image,
    seo_title: toSEOTitle(unit),
    meta_description: toMetaDescription(unit),
    long_description: buildLongDescription(unit),
    structured_feature_list: buildStructuredFeatureList(unit),
    price_usd: unit.asking_price_usd,
    marketing_headline: toSEOTitle(unit),
    marketing_summary: buildLongDescription(unit).slice(0, 200),
    hold_flag: unit.status === 'hold' || unit.status === 'held' || Boolean(unit.hold_reason),
    lot_only_flag: unit.sold_as_lot_only,
    publish_eligibility: !((unit.status === 'hold' || unit.status === 'held' || Boolean(unit.hold_reason)) || unit.sold_as_lot_only),

    // ── FAQ entries (flat array consumed by generateMarketingAssets) ───────
    // Mirrors buildFaqEntries from canonicalFactory.ts so the canonical object
    // is self-contained and usable without canonicalFactory wrapping.
    faq_entries: [
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
    ] as FAQEntry[],
  };
}
