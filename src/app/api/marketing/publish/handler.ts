import { NextResponse } from 'next/server';

import { upsertListingStatus, type ListingStatusRecord } from '@/lib/marketing/listingStatusStore';
import { LISTING_STATUS_PLATFORMS, type ListingPlatform } from '@/lib/marketing/pasteQueueData';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { runPublishPipeline, previewPublishPipeline, type PipelineOptions, type PipelineResult, type PublishPreviewResult, type SupportedPlatform } from '@/lib/marketing/publishPipeline';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'];
type MarketingListingStatusPlatform = Extract<SupportedPlatform, ListingPlatform>;

type MarketingPublishRequestBody = {
  unitId?: unknown;
  platform?: unknown;
  skipNotifications?: unknown;
};

export interface MarketingPublishRouteDeps {
  runPublishPipeline: (
    unitId: string,
    platform: SupportedPlatform,
    options?: Pick<PipelineOptions, 'skipNotifications'>,
  ) => Promise<PipelineResult>;
  previewPublishPipeline: (unitId: string, platform: SupportedPlatform) => Promise<PublishPreviewResult>;
  upsertListingStatus: (input: {
    unit_id: string;
    platform: MarketingListingStatusPlatform;
    status: 'viewed' | 'posted';
    live_url?: string | null;
    posted_at?: string | null;
    notes?: string | null;
  }) => Promise<ListingStatusRecord | null>;
}

const defaultDeps: MarketingPublishRouteDeps = {
  runPublishPipeline,
  previewPublishPipeline,
  upsertListingStatus,
};

function isSupportedPlatform(value: unknown): value is SupportedPlatform {
  return typeof value === 'string' && SUPPORTED_PLATFORMS.includes(value as SupportedPlatform);
}

function supportsListingStatusPlatform(platform: SupportedPlatform): platform is MarketingListingStatusPlatform {
  return LISTING_STATUS_PLATFORMS.includes(platform as ListingPlatform);
}

function invalidBodyResponse() {
  return NextResponse.json({ error: 'unitId and platform are required' }, { status: 400 });
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

function failedPublishResponse() {
  return NextResponse.json({ error: 'Failed to publish marketing payload' }, { status: 500 });
}

function ineligibleResponse(
  result: PublishPreviewResult,
  unitId: string,
) {
  const reasons: string[] = [];
  if (!result.eligible) reasons.push('unit not eligible for publish');
  if (result.holdFlag) reasons.push('unit is on hold');
  if (result.lotOnlyFlag) reasons.push('unit is lot-only');
  if (result.blockedByQa) reasons.push('QA blocked');

  return NextResponse.json(
    {
      error: 'Unit is not eligible for publish',
      unitId,
      ineligibleReasons: reasons,
      qaFailures: result.blockedByQa ? (result.qaSummary ?? []) : [],
      message: `publish eligibility check failed: ${reasons.join('; ')}`,
    },
    { status: 422 },
  );
}

export async function handleMarketingPublishRequest(
  request: Request,
  deps: MarketingPublishRouteDeps = defaultDeps,
) {
  let body: MarketingPublishRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.unitId !== 'string' || body.unitId.trim().length === 0) {
    return invalidBodyResponse();
  }

  if (!isSupportedPlatform(body.platform)) {
    return unsupportedPlatformResponse();
  }

  if (body.skipNotifications != null && typeof body.skipNotifications !== 'boolean') {
    return NextResponse.json({ error: 'skipNotifications must be a boolean when provided' }, { status: 400 });
  }

  try {
    // 422 guard: check eligibility before running pipeline
    const preview = await deps.previewPublishPipeline(body.unitId.trim(), body.platform);
    if (!preview.eligible || preview.blockedByQa || preview.holdFlag || preview.lotOnlyFlag) {
      return ineligibleResponse(preview, body.unitId.trim());
    }

    const result = await deps.runPublishPipeline(body.unitId.trim(), body.platform, {
      skipNotifications: typeof body.skipNotifications === 'boolean' ? body.skipNotifications : undefined,
    });

    // Promote publish_status in inventory_marketing after successful publish
    if (result.mode === 'api' || result.mode === 'storage') {
      try {
        await getSupabaseAdmin()
          .from('inventory_marketing')
          .update({ publish_status: 'published' })
          .eq('unit_id', result.unitId);
      } catch (err) {
        console.error('[publish] publish_status promotion failed for unit', result.unitId, String(err));
      }
    }

    if (result.mode === 'api' && supportsListingStatusPlatform(result.platform)) {
      await deps.upsertListingStatus({
        unit_id: result.unitId,
        platform: result.platform,
        status: 'posted',
        live_url: result.listingUrl ?? result.queueFilePath ?? null,
        posted_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      unitId: result.unitId,
      platform: result.platform,
      receiptId: result.receiptId,
      mode: result.mode,
      listingUrl: result.listingUrl ?? null,
      queueFilePath: result.queueFilePath ?? null,
      warnings: result.warnings,
      blockedByQa: result.blockedByQa,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found in inventory')) {
      return missingUnitResponse();
    }

    return failedPublishResponse();
  }
}
