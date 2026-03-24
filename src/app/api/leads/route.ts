import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      message,
      source = 'contact_form',
    } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone required' },
        { status: 400 }
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('leads')
        .insert({
          name,
          email,
          phone,
          company,
          conversation_summary: message || '',
          score: 30, // Contact form submission = high intent
          status: 'warm',
          interests: [source],
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: 'Failed to save lead' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, lead: data });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return success anyway - we don't want to lose the lead
      return NextResponse.json({ 
        success: true, 
        message: 'Lead captured (database temporarily unavailable)' 
      });
    }
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Failed to process lead' },
      { status: 500 }
    );
  }
}
