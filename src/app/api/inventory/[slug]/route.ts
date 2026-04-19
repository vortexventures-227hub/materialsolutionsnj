import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db/supabase';
import { writeInventoryFailureArtifact, makeInventoryFailureId } from '@/lib/inventory/errors';
import { sendInventoryFailureNotification } from '@/lib/notifications/telegram';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Hoist slug before try so it's in scope for the catch block's failure artifact
  const { slug } = await params;
  try {
    const supabase = getSupabase();

    // Try to find by slug first, then by ID
    let query = supabase
      .from('listings')
      .select('*, listing_images(*), listing_specs(*)')
      .eq('status', 'active');

    // Check if it looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    if (isUUID) {
      query = query.eq('id', slug);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ listing: data });
  } catch (error) {
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
