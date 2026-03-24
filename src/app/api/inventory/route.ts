import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    
    // Build query
    let query = supabase
      .from('inventory')
      .select('*')
      .eq('is_available', true);

    // Apply filters
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

    // Sorting
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    query = query.order(sort, { ascending: order === 'asc' });

    // Featured filter
    const featured = searchParams.get('featured');
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({ inventory: data || [] });
  } catch (error) {
    console.error('Inventory API error:', error);
    // Return empty array if Supabase not configured
    return NextResponse.json({ inventory: [] });
  }
}
