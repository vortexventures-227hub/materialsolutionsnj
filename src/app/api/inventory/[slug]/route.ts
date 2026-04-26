import { NextRequest, NextResponse } from 'next/server';
import inventorySource from '../../../../../data/forklift-inventory.json';
import { getSupabase } from '@/lib/db/supabase';
import { writeInventoryFailureArtifact, makeInventoryFailureId } from '@/lib/inventory/errors';
import { sendInventoryFailureNotification } from '@/lib/notifications/telegram';
import { legacyToListing, type InventoryItemLegacy } from '@/lib/types';
import { findInventoryUnitBySlug, inventoryUnitToListing } from '@/lib/inventorySeo';

export const dynamic = 'force-dynamic';

type InventorySource = {
  inventory: {
    lots: Array<Record<string, any>>;
  };
};

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getBasename(rawPath: string): string {
  return rawPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() ?? rawPath;
}

function isDisallowedInventoryPhoto(rawPath: string): boolean {
  const basename = getBasename(rawPath).toLowerCase();
  return /(?:screenshot|video[_-]?still|still[_-]?\d*|frame[_-]?grab|grab)/i.test(basename)
    || /^md_orderpicker_lot_photo_\d+\.jpe?g$/i.test(basename)
    || /^raymond_752r45tt_2018_reachtruck_photo_\d+\.jpe?g$/i.test(basename)
    || /^raymond_970csr30t_reachtruck_photo_\d+\.jpe?g$/i.test(basename);
}

function mediaPathToPublicUrl(rawPath: string): string | null {
  if (isDisallowedInventoryPhoto(rawPath)) return null;
  if (!/\.(jpe?g|webp|mp4|mov|webm)$/i.test(rawPath)) return null;
  if (rawPath.startsWith('/') || /^https?:\/\//.test(rawPath)) return rawPath;
  const basename = getBasename(rawPath);
  return basename ? `/inventory-media/${encodeURIComponent(basename)}` : null;
}

function mediaPathsFromSourcePayload(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const sourcePayload = payload as Record<string, any>;
  const rawLot = sourcePayload.raw_lot && typeof sourcePayload.raw_lot === 'object' ? sourcePayload.raw_lot : null;
  const candidates = [
    sourcePayload.media_paths,
    sourcePayload.video_paths,
    sourcePayload.lot_photos,
    sourcePayload.lot_videos,
    rawLot?.media_paths,
    rawLot?.video_paths,
    rawLot?.lot_photos,
    rawLot?.lot_videos,
  ];
  return candidates.flatMap((candidate) =>
    Array.isArray(candidate) ? candidate.filter((item): item is string => typeof item === 'string') : []
  );
}

function mediaDedupeKey(url: string) {
  const pathname = url.startsWith('http://') || url.startsWith('https://') ? new URL(url).pathname : url;
  return decodeURIComponent(pathname.split('/').pop() ?? pathname).toLowerCase();
}

function attachPublicImages(listing: ReturnType<typeof legacyToListing>, sourcePayload: unknown) {
  const createdAt = new Date().toISOString();
  const sourceUrls = mediaPathsFromSourcePayload(sourcePayload)
    .map(mediaPathToPublicUrl)
    .filter((url): url is string => Boolean(url));
  const existing = listing.listing_images ?? [];
  const seen = new Set<string>();
  const urls = [...sourceUrls, ...existing.map((image) => image.url)].filter((url) => {
    const key = mediaDedupeKey(url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (urls.length === 0) return listing;

  return {
    ...listing,
    listing_images: urls.map((url, index) => ({
      id: `${listing.id}-image-${index}`,
      listing_id: listing.id,
      url,
      thumbnail_url: null,
      sort_order: index,
      is_primary: index === 0,
      ai_labels: null,
      created_at: existing[index]?.created_at ?? createdAt,
    })),
  };
}

function buildLotListing(slug: string) {
  const source = inventorySource as InventorySource;
  const lot = source.inventory.lots.find((candidate) => normalizeSlug(String(candidate.lot_id ?? '')) === normalizeSlug(slug));
  if (!lot) return null;
  const units = Array.isArray(lot.units) ? lot.units : [];
  const firstUnit = units[0] ?? {};
  const yearValues = units.map((unit) => unit.year).filter((year): year is number => typeof year === 'number');
  const minYear = yearValues.length > 0 ? Math.min(...yearValues) : null;
  const maxYear = yearValues.length > 0 ? Math.max(...yearValues) : null;
  const yearLabel = minYear && maxYear && minYear !== maxYear ? `${minYear}–${maxYear}` : String(minYear ?? '');
  const title = typeof lot.title === 'string' ? lot.title : `Lot of ${units.length} — Raymond Electric Order Pickers`;
  const createdAt = new Date().toISOString();
  const imageUrls = [
    ...(Array.isArray(lot.lot_photos) ? lot.lot_photos : []),
    ...(Array.isArray(lot.lot_videos) ? lot.lot_videos : []),
  ]
    .filter((item): item is string => typeof item === 'string')
    .map(mediaPathToPublicUrl)
    .filter((url): url is string => Boolean(url));

  return {
    id: String(lot.lot_id),
    slug: normalizeSlug(String(lot.lot_id)),
    title,
    make: typeof firstUnit.make === 'string' ? firstUnit.make : 'Raymond',
    model: `Lot of ${units.length} ${typeof firstUnit.model === 'string' ? firstUnit.model : 'Order Pickers'}`,
    year: minYear,
    price: typeof lot.lot_asking_price_usd === 'number' ? lot.lot_asking_price_usd : null,
    capacity: null,
    fuel_type: 'electric',
    mast_type: null,
    max_height: typeof lot.mast_extended_inches === 'number' ? lot.mast_extended_inches : null,
    hours: typeof lot.hours_avg === 'number' ? lot.hours_avg : null,
    serial_number: null,
    condition: 'used' as const,
    status: lot.status === 'available' ? 'active' as const : 'draft' as const,
    featured: false,
    ai_description: `${title}. Sold as one lot only — ${units.length} units for $${Number(lot.lot_asking_price_usd ?? 0).toLocaleString()}, not $2,500 each. ${typeof lot.location === 'string' ? `Location: ${lot.location}.` : ''}`,
    ai_analysis: null,
    ai_highlights: [
      `Sale structure: one lot only`,
      `Lot price: $${Number(lot.lot_asking_price_usd ?? 0).toLocaleString()}`,
      `Unit count: ${units.length}`,
      yearLabel ? `Years: ${yearLabel}` : null,
      typeof lot.fob === 'string' ? `FOB: ${lot.fob}` : null,
    ].filter((item): item is string => Boolean(item)),
    created_at: createdAt,
    updated_at: createdAt,
    listing_images: imageUrls.map((url, index) => ({
      id: `${lot.lot_id}-image-${index}`,
      listing_id: String(lot.lot_id),
      url,
      thumbnail_url: null,
      sort_order: index,
      is_primary: index === 0,
      ai_labels: null,
      created_at: createdAt,
    })),
    listing_specs: [
      { category: 'general' as const, spec_key: 'Sale Structure', spec_value: 'Sold as one lot only' },
      { category: 'general' as const, spec_key: 'Unit Count', spec_value: String(units.length) },
      { category: 'general' as const, spec_key: 'Lot Price', spec_value: `$${Number(lot.lot_asking_price_usd ?? 0).toLocaleString()}` },
      { category: 'general' as const, spec_key: 'Location', spec_value: String(lot.location ?? '') },
      { category: 'performance' as const, spec_key: 'Average Hours', spec_value: lot.hours_avg ? `${Number(lot.hours_avg).toLocaleString()} hrs` : '' },
      { category: 'mast' as const, spec_key: 'Mast Raised', spec_value: lot.mast_extended_inches ? `${lot.mast_extended_inches}"` : '' },
    ]
      .filter((spec) => spec.spec_value)
      .map((spec, index) => ({
        id: `${lot.lot_id}-spec-${index}`,
        listing_id: String(lot.lot_id),
        sort_order: index,
        ai_labels: null,
        ...spec,
      })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Hoist slug before try so it's in scope for the catch block's failure artifact
  const { slug } = await params;
  const inventoryUnit = findInventoryUnitBySlug(slug);

  const fallbackResponse = () => {
    const lotListing = buildLotListing(slug);
    if (lotListing) {
      return NextResponse.json({ listing: lotListing });
    }

    if (!inventoryUnit) {
      return null;
    }

    const listing = inventoryUnitToListing(inventoryUnit, slug);
    return NextResponse.json({
      listing: attachPublicImages(listing, {
        media_paths: inventoryUnit.media_paths,
        video_paths: inventoryUnit.media_paths.filter((mediaPath) => /\.(mp4|mov|webm)$/i.test(mediaPath)),
      }),
    });
  };

  const lockedInventoryFallback = fallbackResponse();
  if (lockedInventoryFallback) {
    return lockedInventoryFallback;
  }

  try {
    const supabase = getSupabase();

    // Read from the current inventory table backing the buyer inventory feed.
    let query = supabase
      .from('inventory')
      .select('*')
      .eq('is_available', true);

    // Check if it looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    if (isUUID) {
      query = query.eq('id', slug);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      const fallback = fallbackResponse();
      if (!fallback) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      return fallback;
    }

    const inventoryRecord = data as InventoryItemLegacy & { slug?: string | null; source_payload?: unknown };
    const listing = attachPublicImages(legacyToListing(data as InventoryItemLegacy), inventoryRecord.source_payload);
    if (inventoryRecord.slug) {
      listing.slug = inventoryRecord.slug;
    }

    return NextResponse.json({ listing });
  } catch (error) {
    const fallback = fallbackResponse();
    if (fallback) {
      console.warn(
        `[inventory-route] Falling back to locked inventory JSON for slug "${slug}" after runtime error: ${String(error)}`
      );
      return fallback;
    }

    const failureId = makeInventoryFailureId();
    const routePath = `/api/inventory/${slug}`;
    const artifactPath = await writeInventoryFailureArtifact({
      failureId,
      route: routePath,
      kind: 'unexpected_error',
      operatorAlerted: await sendInventoryFailureNotification({
        failureId,
        route: routePath,
        kind: 'unexpected_error',
        reason: 'Unexpected error in listing detail GET handler',
        details: { message: String(error), slug },
      }),
      reason: 'Unexpected error in listing detail GET handler',
      details: { message: String(error), slug },
    });
    console.error(`[inventory-failure] id=${failureId} artifact=${artifactPath}`, error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}
