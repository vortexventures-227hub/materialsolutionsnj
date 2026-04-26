import { NextResponse } from 'next/server';

import { requireAdminRouteGate } from '@/lib/adminRouteGate';
import { upsertListingStatus, type ListingStatusRecord } from '@/lib/marketing/listingStatusStore';
import { LISTING_STATUS_PLATFORMS, type ListingPlatform } from '@/lib/marketing/pasteQueueData';
import { runPublishPipeline, type PipelineOptions, type PipelineResult, type SupportedPlatform } from '@/lib/marketing/publishPipeline';

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

export async function handleMarketingPublishRequest(
  request: Request,
  deps: MarketingPublishRouteDeps = defaultDeps,
) {
  const adminGateResponse = requireAdminRouteGate(request);
  if (adminGateResponse) return adminGateResponse;

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
    const result = await deps.runPublishPipeline(body.unitId.trim(), body.platform, {
      skipNotifications: typeof body.skipNotifications === 'boolean' ? body.skipNotifications : undefined,
    });

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
