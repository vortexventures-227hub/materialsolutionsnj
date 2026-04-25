import { NextRequest, NextResponse } from 'next/server';

import { getSupabase, getSupabaseAdmin, getSupabaseRuntimeConfig, getSupabaseRuntimeFingerprint } from '@/lib/db/supabase';
import {
  makeInventoryFailureId,
  writeInventoryFailureArtifact,
  type InventoryFailureRecord,
} from '@/lib/inventory/errors';
import { sendInventoryFailureNotification } from '@/lib/notifications/telegram';

type InventoryQueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

type InventoryQueryBuilder = {
  select(columns: '*'): InventoryQueryBuilder;
  eq(column: string, value: string | number | boolean): InventoryQueryBuilder;
  gte(column: string, value: number): InventoryQueryBuilder;
  lte(column: string, value: number): InventoryQueryBuilder;
  order(column: string, options: { ascending: boolean }): InventoryQueryBuilder;
  then<TResult1 = InventoryQueryResult, TResult2 = never>(
    onfulfilled?: ((value: InventoryQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
};

type InventorySupabaseClient = {
  from(table: 'inventory'): InventoryQueryBuilder;
};

type InventoryFailureArtifactInput = {
  failureId: string;
  route: string;
  kind: InventoryFailureRecord['kind'];
  operatorAlerted: boolean;
  reason: string;
  details?: unknown;
};

type InventoryFailureNotificationInput = {
  failureId: string;
  route: string;
  kind: string;
  reason: string;
  details?: unknown;
};

type InventoryRow = Record<string, unknown>;

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

function toPublicInventoryImageUrl(rawPath: unknown): string | null {
  if (typeof rawPath !== 'string' || rawPath.trim().length === 0) return null;
  const trimmed = rawPath.trim();
  if (isDisallowedInventoryPhoto(trimmed)) return null;
  if (!/\.(jpe?g|webp)$/i.test(trimmed)) return null;
  if (/^https?:\/\//.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return `/inventory-media/${encodeURIComponent(getBasename(trimmed))}`;
}

function getSourceMediaPaths(row: InventoryRow): unknown[] {
  const payload = row.source_payload;
  if (!payload || typeof payload !== 'object') return [];
  const sourcePayload = payload as Record<string, unknown>;
  const rawLot = sourcePayload.raw_lot && typeof sourcePayload.raw_lot === 'object'
    ? (sourcePayload.raw_lot as Record<string, unknown>)
    : null;
  const candidates = [
    sourcePayload.media_paths,
    sourcePayload.lot_photos,
    rawLot?.media_paths,
    rawLot?.lot_photos,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function enrichInventoryImages(rows: unknown[]): InventoryRow[] {
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row as InventoryRow;
    const inventoryRow = row as InventoryRow;
    const existingImages = Array.isArray(inventoryRow.images) ? inventoryRow.images : [];
    if (existingImages.length > 0) return inventoryRow;

    const images = getSourceMediaPaths(inventoryRow)
      .map(toPublicInventoryImageUrl)
      .filter((url): url is string => Boolean(url));

    if (images.length === 0) return inventoryRow;

    return {
      ...inventoryRow,
      images,
    };
  });
}

function getRawLot(row: InventoryRow): Record<string, unknown> | null {
  const payload = row.source_payload;
  if (!payload || typeof payload !== 'object') return null;
  const sourcePayload = payload as Record<string, unknown>;
  return sourcePayload.raw_lot && typeof sourcePayload.raw_lot === 'object'
    ? (sourcePayload.raw_lot as Record<string, unknown>)
    : null;
}

function getRawUnit(row: InventoryRow): Record<string, unknown> | null {
  const payload = row.source_payload;
  if (!payload || typeof payload !== 'object') return null;
  const sourcePayload = payload as Record<string, unknown>;
  return sourcePayload.raw_unit && typeof sourcePayload.raw_unit === 'object'
    ? (sourcePayload.raw_unit as Record<string, unknown>)
    : null;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function isSwingReachRow(row: InventoryRow): boolean {
  const rawUnit = getRawUnit(row);
  const signals = [
    row.title,
    row.type,
    row.model,
    row.description,
    rawUnit?.unit_type,
    rawUnit?.model,
  ].map(normalizeText);

  return signals.some((value) => value.includes('swing reach')) ||
    signals.some((value) => /\b9(?:60|70)csr30t{1,2}\b/i.test(value));
}

function normalizeBuyerFacingClassification(row: InventoryRow): InventoryRow {
  if (!isSwingReachRow(row)) return row;

  const title = typeof row.title === 'string' && /swing reach/i.test(row.title)
    ? row.title
    : [row.year, row.brand, row.model, 'Swing Reach Forklift'].filter(Boolean).join(' ');

  return {
    ...row,
    title,
    type: 'swing-reach',
  };
}

function collapseLotRows(rows: InventoryRow[]): InventoryRow[] {
  const collapsed: InventoryRow[] = [];
  const lotRowsById = new Map<string, InventoryRow[]>();

  for (const row of rows) {
    const rawLot = getRawLot(row);
    const lotId = typeof rawLot?.lot_id === 'string' ? rawLot.lot_id : null;
    if (lotId) {
      lotRowsById.set(lotId, [...(lotRowsById.get(lotId) ?? []), row]);
    } else {
      collapsed.push(row);
    }
  }

  for (const [lotId, lotRows] of Array.from(lotRowsById.entries())) {
    const firstRow = lotRows[0];
    const rawLot = firstRow ? getRawLot(firstRow) : null;
    if (!firstRow || !rawLot) continue;

    const firstUnit = getRawUnit(firstRow);
    const make = typeof firstUnit?.make === 'string' ? firstUnit.make : String(firstRow.brand ?? 'Raymond');
    const model = typeof firstUnit?.model === 'string' ? firstUnit.model : String(firstRow.model ?? 'Order Picker');
    const yearValues = lotRows
      .map((row) => getRawUnit(row)?.year)
      .filter((year): year is number => typeof year === 'number');
    const minYear = yearValues.length > 0 ? Math.min(...yearValues) : null;
    const maxYear = yearValues.length > 0 ? Math.max(...yearValues) : null;
    const yearLabel = minYear && maxYear && minYear !== maxYear ? `${minYear}–${maxYear}` : String(minYear ?? firstRow.year ?? '');
    const title = typeof rawLot.title === 'string'
      ? rawLot.title
      : `Lot of ${lotRows.length} — ${make} ${model} Order Pickers`;
    const lotPrice = typeof rawLot.lot_asking_price_usd === 'number'
      ? rawLot.lot_asking_price_usd
      : null;
    const hoursAvg = typeof rawLot.hours_avg === 'number' ? rawLot.hours_avg : null;
    const mastExtended = typeof rawLot.mast_extended_inches === 'number' ? rawLot.mast_extended_inches : null;
    const description = [
      title,
      `Sold as one lot only — ${lotRows.length} units, not priced individually.`,
      typeof rawLot.location === 'string' ? `Location: ${rawLot.location}.` : null,
      typeof rawLot.condition === 'string' ? `Condition: ${rawLot.condition}.` : null,
    ].filter(Boolean).join(' ');

    collapsed.push({
      ...firstRow,
      id: String(firstRow.id ?? lotId),
      external_key: lotId,
      slug: lotId.toLowerCase(),
      title,
      brand: make,
      model: `Lot of ${lotRows.length} ${model}`,
      year: minYear ?? firstRow.year ?? null,
      type: 'order-picker',
      fuel_type: 'electric',
      capacity_lbs: firstRow.capacity_lbs ?? null,
      lift_height_inches: mastExtended,
      hours: hoursAvg,
      price: lotPrice,
      condition: 'good',
      description,
      features: [
        'Sold as one lot only',
        `${lotRows.length} Raymond order pickers`,
        typeof rawLot.guidance === 'string' ? `${rawLot.guidance} guidance` : null,
        rawLot.battery_and_charger_included ? 'Battery + charger included' : null,
        typeof rawLot.fob === 'string' ? `FOB ${rawLot.fob}` : null,
        yearLabel ? `${yearLabel} model years` : null,
      ].filter(Boolean),
      images: getSourceMediaPaths(firstRow)
        .map(toPublicInventoryImageUrl)
        .filter((url): url is string => Boolean(url)),
      is_available: true,
      status: 'available',
      source_type: 'lot',
      source_payload: {
        lot_id: lotId,
        raw_lot: rawLot,
        unit_count: lotRows.length,
        lot_only: true,
      },
    });
  }

  return collapsed;
}

export type InventoryGetHandlerDependencies = {
  getSupabase(): InventorySupabaseClient;
  writeInventoryFailureArtifact(input: InventoryFailureArtifactInput): Promise<string>;
  makeInventoryFailureId(): string;
  sendInventoryFailureNotification(input: InventoryFailureNotificationInput): Promise<boolean>;
};

const defaultDeps: InventoryGetHandlerDependencies = {
  getSupabase: () => getSupabase() as unknown as InventorySupabaseClient,
  writeInventoryFailureArtifact,
  makeInventoryFailureId,
  sendInventoryFailureNotification,
};

export function createInventoryGetHandler(
  deps: InventoryGetHandlerDependencies = defaultDeps
) {
  return async function inventoryGetHandler(request: Request | NextRequest) {
    let supabase: InventorySupabaseClient;
    try {
      supabase = deps.getSupabase();
    } catch (error) {
      const failureId = deps.makeInventoryFailureId();
      let artifactPath: string;
      try {
        artifactPath = await deps.writeInventoryFailureArtifact({
          failureId,
          route: '/api/inventory',
          kind: 'unexpected_error',
          operatorAlerted: await deps.sendInventoryFailureNotification({
            failureId,
            route: '/api/inventory',
            kind: 'unexpected_error',
            reason: 'Supabase client initialization failed',
            details: { message: String(error) },
          }),
          reason: 'Supabase client initialization failed',
          details: { message: String(error) },
        });
      } catch {
        artifactPath = '(artifact-write-failed)';
      }
      console.error(`[inventory-failure] id=${failureId} artifact=${artifactPath}`, error);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
    try {
      const url = request instanceof NextRequest ? request.nextUrl : new URL(request.url);
      const searchParams = url.searchParams;
      const debugInventory = searchParams.get('debug_inventory') === 'true';

      let query = supabase.from('inventory').select('*').eq('is_available', true);

      const type = searchParams.get('type');
      if (type) {
        query = query.eq('type', type);
      }

      const fuelType = searchParams.get('fuel_type');
      if (fuelType) {
        query = query.eq('fuel_type', fuelType);
      }

      const minCapacity = searchParams.get('min_capacity');
      if (minCapacity) {
        query = query.gte('capacity_lbs', parseInt(minCapacity));
      }

      const maxCapacity = searchParams.get('max_capacity');
      if (maxCapacity) {
        query = query.lte('capacity_lbs', parseInt(maxCapacity));
      }

      const minPrice = searchParams.get('min_price');
      if (minPrice) {
        query = query.gte('price', parseInt(minPrice));
      }

      const maxPrice = searchParams.get('max_price');
      if (maxPrice) {
        query = query.lte('price', parseInt(maxPrice));
      }

      const maxHours = searchParams.get('max_hours');
      if (maxHours) {
        query = query.lte('hours', parseInt(maxHours));
      }

      const brand = searchParams.get('brand');
      if (brand) {
        query = query.eq('brand', brand);
      }

      const sort = searchParams.get('sort') || 'created_at';
      const order = searchParams.get('order') || 'desc';
      query = query.order(sort, { ascending: order === 'asc' });

      const featured = searchParams.get('featured');
      if (featured === 'true') {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      let resolvedData = Array.isArray(data) ? data : [];
      let restProbeStatus: number | null = null;
      let restProbeData: unknown[] | null = null;
      let restProbeError: string | null = null;
      const shouldRunRestProbe = debugInventory || (!error && resolvedData.length === 0);

      if (shouldRunRestProbe) {
        try {
          const { url: supabaseUrl, anonKey } = getSupabaseRuntimeConfig();
          const restParams = new URLSearchParams();
          restParams.set('select', '*');
          restParams.set('is_available', 'eq.true');
          if (type) restParams.set('type', `eq.${type}`);
          if (fuelType) restParams.set('fuel_type', `eq.${fuelType}`);
          if (minCapacity) restParams.set('capacity_lbs', `gte.${parseInt(minCapacity)}`);
          if (maxCapacity) restParams.set('capacity_lbs', `lte.${parseInt(maxCapacity)}`);
          if (minPrice) restParams.set('price', `gte.${parseInt(minPrice)}`);
          if (maxPrice) restParams.set('price', `lte.${parseInt(maxPrice)}`);
          if (maxHours) restParams.set('hours', `lte.${parseInt(maxHours)}`);
          if (brand) restParams.set('brand', `eq.${brand}`);
          if (featured === 'true') restParams.set('is_featured', 'eq.true');
          restParams.set('order', `${sort}.${order === 'asc' ? 'asc' : 'desc'}`);

          const restProbe = await fetch(
            `${supabaseUrl.replace(/\/$/, '')}/rest/v1/inventory?${restParams.toString()}`,
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                Accept: 'application/json',
              },
              cache: 'no-store',
            }
          );
          restProbeStatus = restProbe.status;
          restProbeData = restProbe.ok ? ((await restProbe.json()) as unknown[]) : null;
          if (!restProbe.ok) {
            restProbeError = await restProbe.text();
          }
        } catch (restError) {
          restProbeError = String(restError);
        }
      }

      if (!error && resolvedData.length === 0 && Array.isArray(restProbeData) && restProbeData.length > 0) {
        resolvedData = restProbeData;
        console.info(
          '[inventory-rest-fallback]',
          JSON.stringify({
            supabaseClientCount: Array.isArray(data) ? data.length : null,
            restProbeCount: restProbeData.length,
          })
        );
      }

      if (debugInventory) {
        const adminQuery = getSupabaseAdmin()
          .from('inventory')
          .select('id', { count: 'exact', head: true })
          .eq('is_available', true);
        const { count: adminAvailableCount, error: adminError } = await adminQuery;

        console.info(
          '[inventory-debug]',
          JSON.stringify({
            runtime: getSupabaseRuntimeFingerprint(),
            anonAvailableCount: Array.isArray(data) ? data.length : null,
            anonError: error?.message ?? null,
            adminAvailableCount,
            adminError: adminError?.message ?? null,
            restAnonStatus: restProbeStatus,
            restAnonCount: Array.isArray(restProbeData) ? restProbeData.length : null,
            restAnonError: restProbeError,
            responseCount: resolvedData.length,
          })
        );
      }

      if (error) {
        const failureId = deps.makeInventoryFailureId();
        const artifactPath = await deps.writeInventoryFailureArtifact({
          failureId,
          route: '/api/inventory',
          kind: 'supabase_error',
          operatorAlerted: await deps.sendInventoryFailureNotification({
            failureId,
            route: '/api/inventory',
            kind: 'supabase_error',
            reason: 'Supabase inventory query failed',
            details: { message: error.message },
          }),
          reason: 'Supabase inventory query failed',
          details: { message: error.message },
        });
        console.error(`[inventory-failure] id=${failureId} artifact=${artifactPath}`, error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
      }

      const buyerFacingRows = enrichInventoryImages(resolvedData).map(normalizeBuyerFacingClassification);

      return NextResponse.json({ inventory: collapseLotRows(buyerFacingRows) });
    } catch (error) {
      const failureId = deps.makeInventoryFailureId();
      const artifactPath = await deps.writeInventoryFailureArtifact({
        failureId,
        route: '/api/inventory',
        kind: 'unexpected_error',
        operatorAlerted: await deps.sendInventoryFailureNotification({
          failureId,
          route: '/api/inventory',
          kind: 'unexpected_error',
          reason: 'Unexpected error in inventory GET handler',
          details: { message: String(error) },
        }),
        reason: 'Unexpected error in inventory GET handler',
        details: { message: String(error) },
      });
      console.error(`[inventory-failure] id=${failureId} artifact=${artifactPath}`, error);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
  };
}