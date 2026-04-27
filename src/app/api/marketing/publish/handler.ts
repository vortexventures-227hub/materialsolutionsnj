import { NextResponse } from 'next/server';

import { BackendError, backendPost } from '@/lib/api/backend';
import { requireAdminRouteGate } from '@/lib/adminRouteGate';
import { type SupportedPlatform } from '@/lib/marketing/publishPipeline';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'];

type MarketingPublishRequestBody = {
  unitId?: unknown;
  platform?: unknown;
  skipNotifications?: unknown;
  skipEmail?: unknown;
  tiers?: unknown;
  options?: unknown;
};

type BackendPost = <T>(path: string, body: unknown) => Promise<T>;

export interface MarketingPublishRouteDeps {
  backendPost: BackendPost;
}

const defaultDeps: MarketingPublishRouteDeps = {
  backendPost,
};

function isSupportedPlatform(value: unknown): value is SupportedPlatform {
  return typeof value === 'string' && SUPPORTED_PLATFORMS.includes(value as SupportedPlatform);
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

function fsmErrorResponse(error: unknown) {
  if (error instanceof BackendError) {
    return NextResponse.json(
      {
        error: 'FSM publish proxy failed',
        fsmStatus: error.status,
        fsmBody: error.body ?? { error: error.message },
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      error: 'FSM publish proxy failed',
      detail: error instanceof Error ? error.message : 'Unknown backend error',
    },
    { status: 502 },
  );
}

function buildFsmMarketingPayload(body: MarketingPublishRequestBody, unitId: string, platform: SupportedPlatform) {
  return {
    platforms: [platform],
    ...(Array.isArray(body.tiers) ? { tiers: body.tiers } : {}),
    ...(body.options && typeof body.options === 'object' ? { options: body.options } : {}),
    skipEmail: typeof body.skipEmail === 'boolean'
      ? body.skipEmail
      : typeof body.skipNotifications === 'boolean'
        ? body.skipNotifications
        : false,
    source: 'storefront-marketing-publish',
    storefront: {
      unitId,
      route: '/api/marketing/publish',
    },
  };
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
    const unitId = body.unitId.trim();
    const result = await deps.backendPost<unknown>(
      `/api/publish/${encodeURIComponent(unitId)}`,
      buildFsmMarketingPayload(body, unitId, body.platform),
    );
    return NextResponse.json(result);
  } catch (error) {
    return fsmErrorResponse(error);
  }
}
