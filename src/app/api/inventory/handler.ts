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

      return NextResponse.json({ inventory: resolvedData });
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