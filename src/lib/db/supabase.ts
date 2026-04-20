import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function normalizeEnvValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  let normalized = value.trim();
  // Strip trailing \n bytes injected by Vercel CLI env-pull
  normalized = normalized.replace(/[\r\n]+$/, '');
  // Strip trailing \\n escape sequences (original guard)
  while (normalized.endsWith('\\n')) {
    normalized = normalized.slice(0, -2).trimEnd();
  }

  if (!normalized) {
    throw new Error(`${name} is not configured`);
  }

  return normalized;
}

function getSupabaseUrl(): string {
  return normalizeEnvValue('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function getSupabaseAnonKey(): string {
  return normalizeEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceRoleKey = normalizeEnvValue(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    _supabaseAdmin = createClient(getSupabaseUrl(), serviceRoleKey);
  }
  return _supabaseAdmin;
}

// Legacy exports for compatibility
export const supabase = {
  from: (table: string) => getSupabase().from(table),
};

export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
};

// Database types
export interface Inventory {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  type: 'sit-down' | 'reach-truck' | 'order-picker' | 'pallet-jack' | 'turret-truck';
  fuel_type: 'electric' | 'propane' | 'diesel' | 'manual';
  capacity_lbs: number;
  lift_height_inches: number;
  hours: number;
  price: number;
  condition: 'excellent' | 'good' | 'fair';
  description: string;
  features: string[];
  images: string[];
  inspection_checklist: Record<string, boolean>;
  warranty_info: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  is_available: boolean;
}

export interface Lead {
  id: string;
  visitor_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  subject: string | null;
  source: string;
  page_origin: string | null;
  cta_origin: string | null;
  listing_id: string | null;
  listing_slug: string | null;
  listing_title: string | null;
  service_slug: string | null;
  score: number;
  status: 'hot' | 'warm' | 'cool' | 'contacted' | 'converted';
  interests: string[];
  conversation_summary: string;
  timeline: string | null;
  budget_confirmed: boolean;
  use_case: string | null;
  created_at: string;
  updated_at: string;
  last_activity: string;
  notified: boolean;
}

export interface Conversation {
  id: string;
  visitor_id: string;
  messages: Message[];
  context: ConversationContext;
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationContext {
  pages_viewed: string[];
  inventory_viewed: string[];
  questions_asked: string[];
  signals: ScoreSignal[];
}

export interface ScoreSignal {
  type: string;
  points: number;
  timestamp: string;
}
