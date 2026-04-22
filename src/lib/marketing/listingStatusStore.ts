import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { ListingPlatform } from '@/lib/marketing/pasteQueueData';

export type ListingStatusValue = 'not_started' | 'viewed' | 'posted';

export interface ListingStatusRecord {
  unit_id: string;
  platform: ListingPlatform;
  status: ListingStatusValue;
  live_url: string | null;
  posted_at: string | null;
  notes: string | null;
  updated_at: string | null;
}

type UpsertListingStatusInput = {
  unit_id: string;
  platform: ListingPlatform;
  status: Exclude<ListingStatusValue, 'not_started'>;
  live_url?: string | null;
  posted_at?: string | null;
  notes?: string | null;
};

export async function getAllListingStatuses(): Promise<ListingStatusRecord[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('listing_status')
      .select('unit_id, platform, status, live_url, posted_at, notes, updated_at');

    if (error) {
      console.error('listing_status select failed', error);
      return [];
    }

    return (data ?? []) as ListingStatusRecord[];
  } catch (error) {
    console.error('listing_status bootstrap failed', error);
    return [];
  }
}

export async function getListingStatusRecord(
  unitId: string,
  platform: ListingPlatform
): Promise<ListingStatusRecord | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('listing_status')
      .select('unit_id, platform, status, live_url, posted_at, notes, updated_at')
      .eq('unit_id', unitId)
      .eq('platform', platform)
      .maybeSingle();

    if (error) {
      console.error('listing_status fetch failed', error);
      return null;
    }

    return (data as ListingStatusRecord | null) ?? null;
  } catch (error) {
    console.error('listing_status bootstrap failed', error);
    return null;
  }
}

export async function upsertListingStatus(
  input: UpsertListingStatusInput
): Promise<ListingStatusRecord | null> {
  try {
    const supabase = getSupabaseAdmin();
    const payload = {
      unit_id: input.unit_id,
      platform: input.platform,
      status: input.status,
      live_url: input.live_url ?? null,
      posted_at: input.posted_at ?? null,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('listing_status')
      .upsert(payload, { onConflict: 'unit_id,platform' })
      .select('unit_id, platform, status, live_url, posted_at, notes, updated_at')
      .single();

    if (error) {
      console.error('listing_status upsert failed', error);
      return null;
    }

    return data as ListingStatusRecord;
  } catch (error) {
    console.error('listing_status bootstrap failed', error);
    return null;
  }
}
