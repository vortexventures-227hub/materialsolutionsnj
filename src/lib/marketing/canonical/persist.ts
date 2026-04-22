import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { normalizeInventorySlug } from '@/lib/inventorySeo';

import { CanonicalContentSchema } from './schema';
import type { CanonicalContent } from './types';

export interface InventoryMarketingRow extends CanonicalContent {
  id: string;
  created_at: string;
  updated_at: string;
}

function toRow(content: CanonicalContent) {
  return {
    ...content,
    source_updated_at: new Date(content.source_updated_at).toISOString(),
    generated_at: new Date(content.generated_at).toISOString(),
  };
}

export async function upsertCanonicalContent(
  content: CanonicalContent,
  client: Pick<SupabaseClient, 'from'> = getSupabaseAdmin()
): Promise<InventoryMarketingRow> {
  const validated = CanonicalContentSchema.parse(content);
  const payload = toRow(validated);

  const query = client
    .from('inventory_marketing')
    .upsert(payload, { onConflict: 'unit_id' })
    .select('*')
    .single();

  const { data, error } = await query;

  if (error) {
    throw new Error(`inventory_marketing upsert failed for ${validated.unit_id}: ${error.message}`);
  }

  return data as InventoryMarketingRow;
}

export async function getCanonicalContentBySlug(
  slug: string,
  client?: Pick<SupabaseClient, 'from'>
): Promise<InventoryMarketingRow | null> {
  try {
    const normalizedSlug = normalizeInventorySlug(slug);
    const resolvedClient = client ?? getSupabaseAdmin();
    const { data, error } = await resolvedClient
      .from('inventory_marketing')
      .select('*')
      .eq('canonical_slug', normalizedSlug)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('inventory_marketing fetch failed', error);
      }
      return null;
    }

    const validated = CanonicalContentSchema.parse(data);

    return {
      ...validated,
      id: String((data as { id?: string }).id ?? ''),
      created_at: String((data as { created_at?: string }).created_at ?? ''),
      updated_at: String((data as { updated_at?: string }).updated_at ?? ''),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (/is not configured/.test(error.message) || /invalid scheme/.test(error.message))
    ) {
      return null;
    }

    console.error('inventory_marketing bootstrap failed', error);
    return null;
  }
}
