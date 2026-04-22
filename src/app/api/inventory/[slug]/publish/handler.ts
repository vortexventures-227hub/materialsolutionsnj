import { NextResponse } from 'next/server';

import { findInventoryUnitBySlug } from '@/lib/inventorySeo';
import { runPublishPipeline, type PipelineResult, type SupportedPlatform } from '@/lib/marketing/publishPipeline';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'];

export interface PublishRouteDeps {
  resolveUnitIdBySlug: (slug: string) => string | null;
  runPublishPipeline: (unitId: string, platform: SupportedPlatform) => Promise<PipelineResult>;
}

const defaultDeps: PublishRouteDeps = {
  resolveUnitIdBySlug: (slug) => findInventoryUnitBySlug(slug)?.unit_id ?? null,
  runPublishPipeline,
};

function isSupportedPlatform(value: unknown): value is SupportedPlatform {
  return typeof value === 'string' && SUPPORTED_PLATFORMS.includes(value as SupportedPlatform);
}

export async function handlePublishRequest(
  request: Request,
  slug: string,
  deps: PublishRouteDeps = defaultDeps,
) {
  let body: { platform?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isSupportedPlatform(body.platform)) {
    return NextResponse.json(
      {
        error: 'Unsupported platform',
        supportedPlatforms: SUPPORTED_PLATFORMS,
      },
      { status: 400 },
    );
  }

  const unitId = deps.resolveUnitIdBySlug(slug);
  if (!unitId) {
    return NextResponse.json({ error: 'Inventory unit not found' }, { status: 404 });
  }

  const result = await deps.runPublishPipeline(unitId, body.platform);

  return NextResponse.json({
    unitId: result.unitId,
    platform: result.platform,
    receiptId: result.receiptId,
    mode: result.mode,
    listingUrl: result.listingUrl,
    queueFilePath: result.queueFilePath,
    warnings: result.warnings,
    blockedByQa: result.blockedByQa,
  });
}
