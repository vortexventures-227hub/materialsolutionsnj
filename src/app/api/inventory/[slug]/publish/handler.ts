import { NextResponse } from 'next/server';

import { BackendError, backendPost } from '@/lib/api/backend';
import { resolvePublishInventoryIdBySlug } from '@/lib/inventorySeo';
import { previewPublishPipeline, type PublishPreviewResult, type SupportedPlatform } from '@/lib/marketing/publishPipeline';
import {
  lookupIdempotencyKey,
  writeProxyReceipt,
  type ProxyReceiptEntry,
} from '@/lib/marketing/publishReceiptLedger';

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['website', 'facebook_marketplace', 'craigslist', 'offer_up', 'ebay'];

type InventoryPublishRequestBody = {
  platform?: unknown;
  tiers?: unknown;
  options?: unknown;
  skipEmail?: unknown;
  skipNotifications?: unknown;
};

type BackendPost = <T>(path: string, body: unknown) => Promise<T>;
type LookupIdempotencyKey = (key: string) => Promise<ProxyReceiptEntry | null>;
type WriteProxyReceipt = (entry: Omit<ProxyReceiptEntry, 'receiptId'>) => Promise<string>;

export interface PublishRouteDeps {
  resolveUnitIdBySlug: (slug: string) => string | null;
  previewPublishPipeline: (unitId: string, platform: SupportedPlatform) => Promise<PublishPreviewResult>;
  backendPost: BackendPost;
  lookupIdempotencyKey: LookupIdempotencyKey;
  writeProxyReceipt: WriteProxyReceipt;
}

const defaultDeps: PublishRouteDeps = {
  resolveUnitIdBySlug: (slug) => resolvePublishInventoryIdBySlug(slug),
  previewPublishPipeline,
  backendPost,
  lookupIdempotencyKey,
  writeProxyReceipt,
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

function buildFsmPublishPayload(body: InventoryPublishRequestBody, slug: string, unitId: string, platform: SupportedPlatform) {
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

  const idempotencyKey = request.headers.get('Idempotency-Key') ?? undefined;

  if (idempotencyKey) {
    const existing = await deps.lookupIdempotencyKey(idempotencyKey);
    if (existing) {
      return NextResponse.json(existing.fsmResponse, {
        headers: { 'X-Receipt-Id': existing.receiptId, 'X-Idempotency-Replayed': 'true' },
      });
    }
  }

  const payload = buildFsmPublishPayload(body, slug, unitId, body.platform);

  try {
    const result = await deps.backendPost<unknown>(`/api/publish/${encodeURIComponent(unitId)}`, payload);

    if (idempotencyKey) {
      const receiptId = await deps.writeProxyReceipt({
        idempotencyKey,
        unitId,
        platform: body.platform,
        timestamp: new Date().toISOString(),
        fsmResponse: result,
        source: `storefront:/api/inventory/${slug}/publish`,
      });
      return NextResponse.json(result, { headers: { 'X-Receipt-Id': receiptId } });
    }

    return NextResponse.json(result);
  } catch (error) {
    return fsmErrorResponse(error);
  }
}
