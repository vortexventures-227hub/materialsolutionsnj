import { assemblePublishPayload } from './publishAssembly';
import { formatAssembledPlatformPayload } from './formatters';
import { buildCanonical } from './canonicalFactory';
import type { ForkliftUnit } from './schemaTransformers';
import { normalizeStandaloneUnit } from './schemaTransformers';
import type { CanonicalMarketingObject } from './types/CanonicalMarketingObject';

type WebsiteChannelCopy = {
  platform: 'website';
  title: string;
  description: string;
  price: number | null;
  primary_image_url: string;
  image_urls: string[];
  category_mapping: null;
  platform_specific_fields: Record<string, unknown>;
  posting_instructions: null;
  char_limit_warnings: string[];
};

type PlatformChannelCopy<T extends string> = ReturnType<typeof formatAssembledPlatformPayload> & { platform: T };

export interface MarketingAssets {
  seo_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: 'summary_large_image';
  canonical_slug: string;
  canonical_url: string;
  long_description: string;
  structured_feature_list: string[];
  schema_payload: {
    '@context': 'https://schema.org';
    '@graph': object[];
  };
  faq_array: CanonicalMarketingObject['faq_entries'];
  channel_copy_variants: {
    website: WebsiteChannelCopy;
    facebook_marketplace: PlatformChannelCopy<'facebook_marketplace'>;
    ebay: PlatformChannelCopy<'ebay'>;
    craigslist: PlatformChannelCopy<'craigslist'>;
    offer_up: PlatformChannelCopy<'offer_up'>;
    machinery_trader: PlatformChannelCopy<'machinery_trader'>;
    iron_planet: PlatformChannelCopy<'iron_planet'>;
    linkedin: PlatformChannelCopy<'linkedin'>;
  };
  alt_text_array: Array<{ url: string; alt: string }>;
}

function trimAtSentence(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const sliced = value.slice(0, maxLength);
  const boundary = Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('! '), sliced.lastIndexOf('? '));
  return `${(boundary > 40 ? sliced.slice(0, boundary + 1) : sliced).trimEnd()}`;
}

function buildWebsiteChannelCopy(canonical: CanonicalMarketingObject): WebsiteChannelCopy {
  return {
    platform: 'website',
    title: canonical.seo_title,
    description: canonical.long_description,
    price: canonical.price_usd,
    primary_image_url: canonical.og_image_url,
    image_urls: canonical.images.map((image) => image.url),
    category_mapping: null,
    platform_specific_fields: {
      publish_eligibility: canonical.publish_eligibility,
      hold_flag: canonical.hold_flag,
      lot_only_flag: canonical.lot_only_flag,
    },
    posting_instructions: null,
    char_limit_warnings: [],
  };
}

export function canonicalToForkliftUnit(canonical: CanonicalMarketingObject): ForkliftUnit {
  return normalizeStandaloneUnit({
    unit_id: canonical.unit_id,
    make: canonical.make,
    model: canonical.model,
    year: canonical.year,
    unit_type: canonical.unit_type,
    location: canonical.location,
    serial: canonical.serial,
    capacity_lbs: canonical.capacity_lbs,
    mast_collapsed_inches: canonical.mast_collapsed_inches,
    mast_extended_inches: canonical.mast_extended_inches,
    features: canonical.features,
    battery: canonical.battery,
    battery_voltage: canonical.battery_voltage,
    hours_approx: canonical.hours_approx,
    condition: canonical.condition,
    asking_price_usd: canonical.price_usd,
    media_paths: canonical.media_paths,
    delivery_available: canonical.delivery_available,
    status: canonical.status,
    hold_reason: canonical.hold_reason,
  });
}

export function generateMarketingAssets(canonical: CanonicalMarketingObject): MarketingAssets {
  const unit = canonicalToForkliftUnit(canonical);

  // Platform channels — assembled against their respective publish targets
  const fbPayload = assemblePublishPayload(unit, 'facebook_marketplace');
  const craigslistPayload = assemblePublishPayload(unit, 'craigslist');
  const ebayPayload = assemblePublishPayload(unit, 'ebay');
  const linkedinPayload = assemblePublishPayload(unit, 'linkedin');

  return {
    seo_title: canonical.seo_title,
    meta_description: trimAtSentence(canonical.meta_description, 160),
    og_title: canonical.marketing_headline,
    og_description: trimAtSentence(canonical.marketing_summary, 160),
    og_image: canonical.og_image_url,
    twitter_card: 'summary_large_image',
    canonical_slug: canonical.canonical_slug,
    canonical_url: canonical.canonical_url,
    long_description: canonical.long_description,
    structured_feature_list: canonical.structured_feature_list,
    schema_payload: {
      '@context': 'https://schema.org',
      '@graph': [
        fbPayload.schema.product ?? {},
        fbPayload.schema.vehicle ?? {},
        fbPayload.schema.faqPage ?? {},
        fbPayload.schema.breadcrumb ?? {},
      ].filter((entry) => Object.keys(entry).length > 0),
    },
    faq_array: canonical.faq_entries,
    channel_copy_variants: {
      website: buildWebsiteChannelCopy(canonical),
      facebook_marketplace: {
        platform: 'facebook_marketplace',
        ...formatAssembledPlatformPayload('facebook_marketplace', fbPayload),
      },
      ebay: {
        platform: 'ebay',
        ...formatAssembledPlatformPayload('ebay', ebayPayload),
      },
      craigslist: {
        platform: 'craigslist',
        ...formatAssembledPlatformPayload('craigslist', craigslistPayload),
      },
      offer_up: {
        platform: 'offer_up',
        ...formatAssembledPlatformPayload('offer_up', craigslistPayload),
      },
      machinery_trader: {
        platform: 'machinery_trader',
        ...formatAssembledPlatformPayload('machinery_trader', ebayPayload),
      },
      iron_planet: {
        platform: 'iron_planet',
        ...formatAssembledPlatformPayload('iron_planet', ebayPayload),
      },
      linkedin: {
        platform: 'linkedin',
        ...formatAssembledPlatformPayload('linkedin', linkedinPayload),
      },
    },
    alt_text_array: canonical.images,
  };
}

export function generateMarketingAssetsFromInventory(inventoryRow: ForkliftUnit, overlay = {}) {
  return generateMarketingAssets(buildCanonical(inventoryRow, overlay));
}
