import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db/supabase';
import { writeInventoryFailureArtifact, makeInventoryFailureId } from '@/lib/inventory/errors';
import { sendInventoryFailureNotification } from '@/lib/notifications/telegram';
import { legacyToListing, type InventoryItemLegacy } from '@/lib/types';
import { findStandaloneUnitBySlug, standaloneUnitToListing } from '@/lib/inventorySeo';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Hoist slug before try so it's in scope for the catch block's failure artifact
  const { slug } = await params;
  const standaloneUnit = findStandaloneUnitBySlug(slug);

  const fallbackResponse = () => {
    if (!standaloneUnit) {
      return null;
    }

    return NextResponse.json({
      listing: standaloneUnitToListing(standaloneUnit, slug),
    });
  };

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

    const listing = legacyToListing(data as InventoryItemLegacy);
    const inventoryRecord = data as InventoryItemLegacy & { slug?: string | null };
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
