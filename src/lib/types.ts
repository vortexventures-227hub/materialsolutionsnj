// ═══════════════════════════════════════════
// Material Solutions NJ — Database Types
// Matches Supabase schema from redesign plan
// ═══════════════════════════════════════════

export interface Listing {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number | null;
  price: number | null;
  capacity: number | null;
  fuel_type: string | null;
  mast_type: string | null;
  max_height: number | null;
  hours: number | null;
  serial_number: string | null;
  condition: 'new' | 'used' | 'certified';
  status: 'active' | 'sold' | 'draft' | 'archived';
  featured: boolean;
  ai_description: string | null;
  ai_analysis: Record<string, unknown> | null;
  ai_highlights: string[] | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  listing_images?: ListingImage[];
  listing_specs?: ListingSpec[];
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_primary: boolean;
  ai_labels: Record<string, unknown> | null;
  created_at: string;
}

export interface ListingSpec {
  id: string;
  listing_id: string;
  category: 'general' | 'performance' | 'mast' | 'power' | 'tires' | 'dimensions';
  spec_key: string;
  spec_value: string;
  sort_order: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  needs: string | null;
  urgency: 'immediate' | '1-3 months' | 'exploring' | null;
  source: string;
  session_id: string | null;
  interested_listings: string[] | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy type alias for backward compatibility
export interface InventoryItemLegacy {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  fuel_type: string;
  capacity_lbs: number;
  lift_height_inches: number;
  hours: number;
  price: number;
  condition: string;
  description: string;
  features: string[];
  images: string[];
  inspection_checklist?: Record<string, boolean>;
  warranty_info?: string;
  is_featured: boolean;
  is_available: boolean;
  created_at?: string;
}

// Helper to convert legacy inventory item to new Listing format
export function legacyToListing(item: InventoryItemLegacy): Listing {
  return {
    id: item.id,
    slug: generateSlug({ year: item.year, make: item.brand, model: item.model, capacity: item.capacity_lbs, fuel_type: item.fuel_type }),
    title: item.title,
    make: item.brand,
    model: item.model,
    year: item.year,
    price: item.price,
    capacity: item.capacity_lbs,
    fuel_type: item.fuel_type,
    mast_type: null,
    max_height: item.lift_height_inches,
    hours: item.hours,
    serial_number: null,
    condition: item.condition as 'used',
    status: item.is_available ? 'active' : 'sold',
    featured: item.is_featured,
    ai_description: item.description,
    ai_analysis: null,
    ai_highlights: item.features,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.created_at || new Date().toISOString(),
    listing_images: item.images.map((url, i) => ({
      id: `img-${i}`,
      listing_id: item.id,
      url,
      thumbnail_url: null,
      sort_order: i,
      is_primary: i === 0,
      ai_labels: null,
      created_at: new Date().toISOString(),
    })),
  };
}

// Utility Functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US').format(hours) + ' hrs';
}

export function generateSlug(listing: {
  year?: number | null;
  make: string;
  model: string;
  capacity?: number | null;
  fuel_type?: string | null;
}): string {
  return [listing.year, listing.make, listing.model, listing.capacity ? `${listing.capacity}lb` : null, listing.fuel_type]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: 'New',
    used: 'Used',
    certified: 'Certified Pre-Owned',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
  };
  return labels[condition] || condition;
}

export function getConditionColor(condition: string): 'success' | 'warning' | 'ai' {
  if (condition === 'excellent' || condition === 'new' || condition === 'certified') return 'success';
  if (condition === 'good') return 'ai';
  return 'warning';
}

export function getFuelIcon(fuel_type: string): string {
  const icons: Record<string, string> = {
    electric: '⚡',
    propane: '🔥',
    diesel: '⛽',
  };
  return icons[fuel_type] || '⚡';
}
