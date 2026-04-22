'use server';

import { revalidatePath } from 'next/cache';

import type { ListingPlatform } from '@/lib/marketing/pasteQueueData';
import {
  getListingStatusRecord,
  upsertListingStatus,
} from '@/lib/marketing/listingStatusStore';

function revalidateListingSurfaces(unitId?: string) {
  revalidatePath('/admin/listing-status');
  revalidatePath('/admin/paste-queue');
  if (unitId) {
    revalidatePath(`/admin/paste-queue/${encodeURIComponent(unitId)}`);
  }
}

export async function markListingViewed(unitId: string, platform: ListingPlatform) {
  const current = await getListingStatusRecord(unitId, platform);

  if (current?.status === 'posted') {
    revalidateListingSurfaces(unitId);
    return current;
  }

  const record = await upsertListingStatus({
    unit_id: unitId,
    platform,
    status: 'viewed',
    live_url: current?.live_url ?? null,
    posted_at: current?.posted_at ?? null,
    notes: current?.notes ?? null,
  });

  revalidateListingSurfaces(unitId);
  return record;
}

export async function setListingPosted(
  unitId: string,
  platform: ListingPlatform,
  posted: boolean
) {
  const current = await getListingStatusRecord(unitId, platform);

  if (!posted) {
    const record = await upsertListingStatus({
      unit_id: unitId,
      platform,
      status: current?.status === 'viewed' ? 'viewed' : 'viewed',
      live_url: current?.live_url ?? null,
      posted_at: null,
      notes: current?.notes ?? null,
    });
    revalidateListingSurfaces(unitId);
    return record;
  }

  const record = await upsertListingStatus({
    unit_id: unitId,
    platform,
    status: 'posted',
    live_url: current?.live_url ?? null,
    posted_at: new Date().toISOString(),
    notes: current?.notes ?? null,
  });

  revalidateListingSurfaces(unitId);
  return record;
}

export async function setListingLiveUrl(
  unitId: string,
  platform: ListingPlatform,
  liveUrl: string
) {
  const current = await getListingStatusRecord(unitId, platform);
  const trimmed = liveUrl.trim();

  const record = await upsertListingStatus({
    unit_id: unitId,
    platform,
    status: current?.status === 'posted' || trimmed ? 'posted' : 'viewed',
    live_url: trimmed || null,
    posted_at: trimmed ? new Date().toISOString() : current?.posted_at ?? null,
    notes: current?.notes ?? null,
  });

  revalidateListingSurfaces(unitId);
  return record;
}
