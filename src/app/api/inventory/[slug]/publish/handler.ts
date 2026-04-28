import { NextResponse } from 'next/server';

import { BackendError, backendPost, isBackendApiKeyConfigured } from '@/lib/api/backend';
import { requireAdminRouteGate } from '@/lib/adminRouteGate';
import { resolvePublishInventoryIdBySlug } from '@/lib/inventorySeo';
import { previewPublishPipeline, type PublishPreviewResult, type SupportedPlatform } from '@/lib/marketing/publishPipeline';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'];

type InventoryPublishRequestBody = {
  platform?: unknown;
  fsmInventoryId?: unknown;
  tiers?: unknown;
  options?: unknown;
  skipEmail?: unknown;
  skipNotifications?: unknown;
};

type BackendPost = <T>(path: string, body: unknown) => Promise<T>;

export interface PublishRouteDeps {
  resolveUnitIdBySlug: (slug: string) => string | null;
  previewPublishPipeline: (unitId: string, platform: SupportedPlatform) => Promise<PublishPreviewResult>;
  backendPost: BackendPost;
}

const defaultDeps: PublishRouteDeps = {
  resolveUnitIdBySlug: (slug) => resolvePublishInventoryIdBySlug(slug),
  previewPublishPipeline,
  backendPost,
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function resolveFsmInventoryId(body: InventoryPublishRequestBody, unitId: string): string | null {
  if (typeof body.fsmInventoryId === 'string' && isUuid(body.fsmInventoryId.trim())) {
    return body.fsmInventoryId.trim();
  }

  return isUuid(unitId) ? unitId : null;
}

function invalidFsmInventoryIdResponse() {
  return NextResponse.json({ error: 'fsmInventoryId must be a valid UUID when provided' }, { status: 400 });
}

function missingFsmInventoryMappingResponse(unitId: string) {
  return NextResponse.json(
    {
      error: 'FSM inventory UUID mapping required',
      detail: 'Storefront unit ids cannot be proxied to FSM publish until they are mapped to a canonical FSM inventory UUID.',
      storefrontUnitId: unitId,
    },
    { status: 409 },
  );
}

function missingFsmBackendKeyResponse() {
  return NextResponse.json(
    {
      error: 'FSM backend API key not configured',
      detail: 'Authenticated storefront publish requests require BACKEND_API_KEY or FSM_SERVICE_JWT before proxying to Railway FSM.',
    },
    { status: 503 },
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

function buildFsmPublishPayload(
  body: InventoryPublishRequestBody,
  slug: string,
  unitId: string,
  fsmInventoryId: string,
  platform: SupportedPlatform,
) {
  return {
    platforms: [platform],
    ...(Array.isArray(body.tiers) ? { tiers: body.tiers } : {}),
    ...(body.options && typeof body.options === 'object' ? { options: body.options } : {}),
    skipEmail: typeof body.skipEmail === 'boolean'
      ? body.skipEmail
      : typeof body.skipNotifications === 'boolean'
        ? body.skipNotifications
        : false,
    source: 'storefront',
    storefront: {
      slug,
      unitId,
      fsmInventoryId,
      route: `/api/inventory/${slug}/publish`,
    },
  };
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

  let body: InventoryPublishRequestBody;

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

  if (typeof body.fsmInventoryId !== 'undefined' && (typeof body.fsmInventoryId !== 'string' || !isUuid(body.fsmInventoryId.trim()))) {
    return invalidFsmInventoryIdResponse();
  }

  const fsmInventoryId = resolveFsmInventoryId(body, unitId);
  if (!fsmInventoryId) {
    return missingFsmInventoryMappingResponse(unitId);
  }

  if (!isBackendApiKeyConfigured()) {
    return missingFsmBackendKeyResponse();
  }

  const payload = buildFsmPublishPayload(body, slug, unitId, fsmInventoryId, body.platform);

  try {
    const result = await deps.backendPost<unknown>(`/api/publish/${encodeURIComponent(fsmInventoryId)}`, payload);
    return NextResponse.json(result);
  } catch (error) {
    return fsmErrorResponse(error);
  }
}
