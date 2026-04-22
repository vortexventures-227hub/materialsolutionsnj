import { findInventoryUnitBySlug, normalizeInventorySlug } from '@/lib/inventorySeo';

import { generateMarketingAssets } from './canonical/generateMarketingAssets';
import type { ForkliftUnit } from './schemaTransformers';

export const SUPPORTED_BATCH_MARKETING_CHANNELS = [
  'website',
  'facebook_marketplace',
  'craigslist',
  'offer_up',
  'ebay',
  'machinery_trader',
  'iron_planet',
  'linkedin',
] as const;

export type BatchMarketingChannel = (typeof SUPPORTED_BATCH_MARKETING_CHANNELS)[number];

export type BatchMarketingAssetImage = {
  url: string;
  alt: string;
};

export type BatchMarketingChannelCopy = {
  channel: BatchMarketingChannel;
  title: string;
  description: string;
};

export type BatchMarketingAssetResult = {
  slug: string;
  unit_id: string;
  publish_eligibility: boolean;
  hold_flag: boolean;
  lot_only_flag: boolean;
  images: BatchMarketingAssetImage[];
  channel_copy_variants: BatchMarketingChannelCopy[];
};

export type BatchMarketingAssetResponse = {
  slugs_requested: string[];
  platforms_included: BatchMarketingChannel[];
  results: BatchMarketingAssetResult[];
};

export type MarketingSummary = {
  eligible: number;
  on_hold: number;
  lot_only: number;
  total: number;
};

function parseCsvParam(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseRequestedBatchMarketingChannels(value: string | null): BatchMarketingChannel[] {
  const requested = parseCsvParam(value);

  if (requested.length === 0) {
    return [...SUPPORTED_BATCH_MARKETING_CHANNELS];
  }

  const supported = new Set<string>(SUPPORTED_BATCH_MARKETING_CHANNELS);
  const seen = new Set<string>();

  return requested.filter((entry): entry is BatchMarketingChannel => {
    if (!supported.has(entry) || seen.has(entry)) {
      return false;
    }

    seen.add(entry);
    return true;
  });
}

function buildBatchMarketingAssetResult(
  unit: ForkliftUnit,
  requestedPlatforms: BatchMarketingChannel[]
): BatchMarketingAssetResult | null {
  const canonical = generateMarketingAssets(unit);
  if (!canonical.publish_eligibility) {
    return null;
  }

  const requestedPlatformSet = new Set<string>(requestedPlatforms);

  return {
    slug: normalizeInventorySlug(unit.canonical_slug || unit.unit_id),
    unit_id: canonical.unit_id,
    publish_eligibility: canonical.publish_eligibility,
    hold_flag: canonical.hold_flag,
    lot_only_flag: canonical.lot_only_flag,
    images: canonical.images.map((image) => ({
      url: image.public_url ?? image.source_path,
      alt: image.alt,
    })),
    channel_copy_variants: canonical.platform_overrides
      .filter((override): override is typeof override & { channel: BatchMarketingChannel } =>
        requestedPlatformSet.has(override.channel)
      )
      .map((override) => ({
        channel: override.channel,
        title: override.title,
        description: override.description,
      })),
  };
}

export function buildBatchMarketingAssetsForUnits(
  units: ForkliftUnit[],
  requestedPlatforms: BatchMarketingChannel[]
): BatchMarketingAssetResponse {
  return {
    slugs_requested: units.map((unit) => normalizeInventorySlug(unit.canonical_slug || unit.unit_id)),
    platforms_included: requestedPlatforms,
    results: units
      .map((unit) => buildBatchMarketingAssetResult(unit, requestedPlatforms))
      .filter((entry): entry is BatchMarketingAssetResult => entry !== null),
  };
}

export function buildBatchMarketingAssetsForSlugs(
  slugsRequested: string[],
  requestedPlatforms: BatchMarketingChannel[]
): BatchMarketingAssetResponse {
  const normalizedSlugs = slugsRequested.map((slug) => normalizeInventorySlug(slug));

  return {
    slugs_requested: normalizedSlugs,
    platforms_included: requestedPlatforms,
    results: normalizedSlugs
      .map((slug) => {
        const unit = findInventoryUnitBySlug(slug);
        if (!unit) {
          return null;
        }

        return buildBatchMarketingAssetResult(unit, requestedPlatforms);
      })
      .filter((entry): entry is BatchMarketingAssetResult => entry !== null),
  };
}

export function summarizeBatchMarketingResults(results: BatchMarketingAssetResult[]): MarketingSummary {
  return results.reduce<MarketingSummary>(
    (summary, entry) => ({
      eligible: summary.eligible + (entry.publish_eligibility ? 1 : 0),
      on_hold: summary.on_hold + (entry.hold_flag ? 1 : 0),
      lot_only: summary.lot_only + (entry.lot_only_flag ? 1 : 0),
      total: summary.total + 1,
    }),
    {
      eligible: 0,
      on_hold: 0,
      lot_only: 0,
      total: 0,
    }
  );
}

export function formatBatchMarketingAssetsPlainText(response: BatchMarketingAssetResponse): string {
  if (response.results.length === 0) {
    return 'No publish-eligible marketing assets were found for the requested slugs.';
  }

  return response.results
    .map((result) => {
      const channelBlocks = result.channel_copy_variants
        .map(
          (variant) =>
            `[${variant.channel}]\nTitle: ${variant.title}\nDescription:\n${variant.description}`
        )
        .join('\n\n');

      const imageBlock = result.images
        .map((image, index) => `${index + 1}. ${image.url}\n   Alt: ${image.alt}`)
        .join('\n');

      return [
        `${result.unit_id} (${result.slug})`,
        `Publish eligible: ${result.publish_eligibility ? 'yes' : 'no'}`,
        `On hold: ${result.hold_flag ? 'yes' : 'no'}`,
        `Lot only: ${result.lot_only_flag ? 'yes' : 'no'}`,
        '',
        channelBlocks,
        '',
        'Images:',
        imageBlock,
      ].join('\n');
    })
    .join('\n\n---\n\n');
}
