import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads/callback
 *
 * Marks a lead as "contacted" — called by an operator after they have
 * followed up by phone. This is the canonical-row metadata durability
 * path: the operator-visible receipt that a callback was completed.
 *
 * Request body: { leadId: string }
 * Response: { success: true, lead: Lead } | { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId || typeof leadId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'leadId is required and must be a string.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'contacted',
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('[LeadsCallback] DB update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update lead status.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: `Lead ${leadId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, lead: data }, { status: 200 });
  } catch (err) {
    console.error('[LeadsCallback] Unhandled error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
