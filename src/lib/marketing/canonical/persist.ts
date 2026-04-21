import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '@/lib/db/supabase';

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
