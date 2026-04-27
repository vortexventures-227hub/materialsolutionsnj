import { NextResponse } from 'next/server';

import { normalizedInventoryUnits } from '@/lib/inventorySeo';
import { generateMarketingAssets } from '@/lib/marketing/canonical/generateMarketingAssets';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function shouldIncludeAssets(value: string | null): boolean {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assetsIncluded = shouldIncludeAssets(url.searchParams.get('assets'));

  const results = normalizedInventoryUnits.map((unit) => {
    const canonical = generateMarketingAssets(unit);

    if (assetsIncluded) {
      return canonical;
    }

    const {
      faq,
      images,
      platform_overrides,
      schema_pointers,
      structured_feature_list,
      keyword_targets,
      teaser_by_channel,
      manual_overrides,
      claim_safety_flags,
      ...summary
    } = canonical;

    return summary;
  });

  return NextResponse.json(
    {
      count: results.length,
      assets_included: assetsIncluded,
      results,
    },
    {
      headers: {
        'X-Marketing-Pipeline': 'canonical-v1',
      },
    }
  );
}
