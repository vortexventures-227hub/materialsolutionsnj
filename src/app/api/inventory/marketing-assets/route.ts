import { NextResponse } from 'next/server';

import {
  buildBatchMarketingAssetsForSlugs,
  formatBatchMarketingAssetsPlainText,
  parseRequestedBatchMarketingChannels,
} from '@/lib/marketing/batchMarketingAssets';

export const dynamic = 'force-dynamic';

function parseCsvParam(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugsRequested = parseCsvParam(url.searchParams.get('slugs'));
  const requestedPlatforms = parseRequestedBatchMarketingChannels(url.searchParams.get('platforms'));
  const responseBody = buildBatchMarketingAssetsForSlugs(slugsRequested, requestedPlatforms);
  const format = url.searchParams.get('format');

  if (format === 'plain') {
    return new Response(formatBatchMarketingAssetsPlainText(responseBody), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Marketing-Pipeline': 'canonical-v1',
      },
    });
  }

  return NextResponse.json(
    responseBody,
    {
      headers: {
        'X-Marketing-Pipeline': 'canonical-v1',
      },
    }
  );
}
