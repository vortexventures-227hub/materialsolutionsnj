-- Migration: 20260422_inventory_marketing_assets_json
-- Purpose: Store the full MarketingAssets JSON so the Tier-2 (Supabase) read path
-- in getCanonicalBySlugWithSupabase can serve canonical content directly without
-- recomputing. Previously inventory_marketing only stored flattened channel_copy
-- strings, which made the Supabase tier a no-op (always fell through to recompute).
-- With assets_json, Tier 2 is a real cache layer: serves pre-computed MarketingAssets
-- from DB on cache miss, skipping the full canonical pipeline entirely.

alter table public.inventory_marketing
  add column if not exists assets_json jsonb not null default '{}';

-- GIN index for fast JSONB lookups (not strictly needed for point lookup by listing_id,
-- but enables future query patterns over the assets JSON if needed)
create index if not exists idx_inventory_marketing_assets_json
  on public.inventory_marketing using gin (assets_json);
