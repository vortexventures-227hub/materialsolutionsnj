import { NextResponse } from 'next/server';

import { requireAdminRouteGate } from '@/lib/adminRouteGate';
import { resolvePublishInventoryIdBySlug } from '@/lib/inventorySeo';
import { previewPublishPipeline, runPublishPipeline, type PipelineResult, type PublishPreviewResult, type SupportedPlatform } from '@/lib/marketing/publishPipeline';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'];

export interface PublishRouteDeps {
  resolveUnitIdBySlug: (slug: string) => string | null;
  runPublishPipeline: (unitId: string, platform: SupportedPlatform) => Promise<PipelineResult>;
  previewPublishPipeline: (unitId: string, platform: SupportedPlatform) => Promise<PublishPreviewResult>;
}

const defaultDeps: PublishRouteDeps = {
  resolveUnitIdBySlug: (slug) => resolvePublishInventoryIdBySlug(slug),
  runPublishPipeline,
  previewPublishPipeline,
};

function isSupportedPlatform(value: unknown): value is SupportedPlatform {
  return typeof value === 'string' && SUPPORTED_PLATFORMS.includes(value as SupportedPlatform);
}

function resolveUnitId(slug: string, deps: PublishRouteDeps): string | null {
  return deps.resolveUnitIdBySlug(slug);
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

function missingUnitResponse() {
  return NextResponse.json({ error: 'Inventory unit not found' }, { status: 404 });
}

export async function handlePublishPreviewRequest(
  request: Request,
  slug: string,
  deps: PublishRouteDeps = defaultDeps,
) {
  const platform = new URL(request.url).searchParams.get('platform');

  if (!isSupportedPlatform(platform)) {
    return unsupportedPlatformResponse();
  }

  const unitId = resolveUnitId(slug, deps);
  if (!unitId) {
    return missingUnitResponse();
  }

  const result = await deps.previewPublishPipeline(unitId, platform);

  return NextResponse.json({
    unitId: result.unitId,
    platform: result.platform,
    mode: result.mode,
    eligible: result.eligible,
    holdFlag: result.holdFlag,
    lotOnlyFlag: result.lotOnlyFlag,
    publishEligibility: result.publishEligibility,
    channelCopy: result.channelCopy,
    warnings: result.warnings,
    blockedByQa: result.blockedByQa,
  });
}

export async function handlePublishRequest(
  request: Request,
  slug: string,
  deps: PublishRouteDeps = defaultDeps,
) {
  const adminGateResponse = requireAdminRouteGate(request);
  if (adminGateResponse) return adminGateResponse;

  let body: { platform?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isSupportedPlatform(body.platform)) {
    return unsupportedPlatformResponse();
  }

  const unitId = resolveUnitId(slug, deps);
  if (!unitId) {
    return missingUnitResponse();
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
