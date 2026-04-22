import { NextResponse } from 'next/server';

import { findInventoryUnitBySlug, normalizeInventorySlug } from '@/lib/inventorySeo';
import { generateMarketingAssets } from '@/lib/marketing/canonical/generateMarketingAssets';

export const dynamic = 'force-dynamic';

const SUPPORTED_PLATFORM_CHANNELS = [
  'website',
  'facebook_marketplace',
  'craigslist',
  'offer_up',
  'ebay',
  'machinery_trader',
  'iron_planet',
  'linkedin',
] as const;

function parseCsvParam(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseRequestedPlatforms(value: string | null): string[] {
  const requested = parseCsvParam(value);

  if (requested.length === 0) {
    return [...SUPPORTED_PLATFORM_CHANNELS];
  }

  const supported = new Set<string>(SUPPORTED_PLATFORM_CHANNELS);
  const seen = new Set<string>();

  return requested.filter((entry) => {
    if (!supported.has(entry) || seen.has(entry)) {
      return false;
    }

    seen.add(entry);
    return true;
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugsRequested = parseCsvParam(url.searchParams.get('slugs')).map((slug) => normalizeInventorySlug(slug));
  const requestedPlatforms = parseRequestedPlatforms(url.searchParams.get('platforms'));
  const requestedPlatformSet = new Set(requestedPlatforms);

  const results = slugsRequested
    .map((slug) => {
      const unit = findInventoryUnitBySlug(slug);
      if (!unit) {
        return null;
      }

      const canonical = generateMarketingAssets(unit);
      if (!canonical.publish_eligibility) {
        return null;
      }

      return {
        slug,
        unit_id: canonical.unit_id,
        publish_eligibility: canonical.publish_eligibility,
        lot_only_flag: canonical.lot_only_flag,
        channel_copy_variants: canonical.platform_overrides
          .filter((override) => requestedPlatformSet.has(override.channel))
          .map((override) => ({
            channel: override.channel,
            title: override.title,
            description: override.description,
          })),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return NextResponse.json(
    {
      slugs_requested: slugsRequested,
      platforms_included: requestedPlatforms,
      results,
    },
    {
      headers: {
        'X-Marketing-Pipeline': 'canonical-v1',
      },
    }
  );
}
