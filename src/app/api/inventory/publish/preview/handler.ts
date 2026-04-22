import { NextResponse } from 'next/server';

import {
  previewPublishPipeline,
  type PublishPreviewResult,
  type SupportedPlatform,
} from '@/lib/marketing/publishPipeline';
import { resolvePublishInventoryIdBySlug } from '@/lib/inventorySeo';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'];
const MAX_SLUGS = 50;

export interface BatchPublishPreviewDeps {
  resolveUnitIdBySlug: (slug: string) => string | null;
  previewPublishPipeline: (unitId: string, platform: SupportedPlatform) => Promise<PublishPreviewResult>;
  now?: () => Date;
}

const defaultDeps: BatchPublishPreviewDeps = {
  resolveUnitIdBySlug: (slug) => resolvePublishInventoryIdBySlug(slug),
  previewPublishPipeline,
  now: () => new Date(),
};

function isSupportedPlatform(value: unknown): value is SupportedPlatform {
  return typeof value === 'string' && SUPPORTED_PLATFORMS.includes(value as SupportedPlatform);
}

function parseCsvParam(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function unsupportedPlatformResponse() {
  return NextResponse.json(
    {
      error: 'Unsupported platform',
      supportedPlatforms: SUPPORTED_PLATFORMS,
    },
    { status: 400 },
  );
}

function missingSlugsResponse() {
  return NextResponse.json({ error: 'At least one slug is required' }, { status: 400 });
}

function tooManySlugsResponse() {
  return NextResponse.json({ error: `Too many slugs requested (max ${MAX_SLUGS})` }, { status: 400 });
}

export async function handleBatchPublishPreviewRequest(
  request: Request,
  deps: BatchPublishPreviewDeps = defaultDeps,
) {
  const url = new URL(request.url);
  const slugs = parseCsvParam(url.searchParams.get('slugs'));
  const platform = url.searchParams.get('platform');

  if (!isSupportedPlatform(platform)) {
    return unsupportedPlatformResponse();
  }

  if (slugs.length === 0) {
    return missingSlugsResponse();
  }

  if (slugs.length > MAX_SLUGS) {
    return tooManySlugsResponse();
  }

  const units: Array<{
    slug: string;
    unitId: string;
    eligible: boolean;
    holdFlag: boolean;
    lotOnlyFlag: boolean;
    publishEligibility: boolean;
    warnings: string[];
    blockedByQa: boolean;
    channelCopy: PublishPreviewResult['channelCopy'];
  }> = [];
  const missing: string[] = [];

  for (const slug of slugs) {
    const unitId = deps.resolveUnitIdBySlug(slug);
    if (!unitId) {
      missing.push(slug);
      continue;
    }

    const preview = await deps.previewPublishPipeline(unitId, platform);
    units.push({
      slug,
      unitId: preview.unitId,
      eligible: preview.eligible,
      holdFlag: preview.holdFlag,
      lotOnlyFlag: preview.lotOnlyFlag,
      publishEligibility: preview.publishEligibility,
      warnings: preview.warnings,
      blockedByQa: preview.blockedByQa,
      channelCopy: preview.channelCopy,
    });
  }

  return NextResponse.json({
    requested: slugs,
    found: units.length,
    missing,
    platform,
    generated_at: (deps.now ?? (() => new Date()))().toISOString(),
    units,
  });
}
