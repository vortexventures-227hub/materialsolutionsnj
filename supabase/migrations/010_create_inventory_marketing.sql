-- Lane H Phase 1 canonical marketing storage.
-- UP migration

create extension if not exists pgcrypto;

create table if not exists public.inventory_marketing (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null,
  source_kind text not null check (source_kind in ('unit', 'lot')),
  source_record_id text not null,
  legacy_source_ids jsonb not null default '[]'::jsonb,
  inventory_status text not null,
  publish_status text not null check (publish_status in ('draft', 'ready', 'blocked', 'published', 'archived')),
  publish_eligibility boolean not null default false,
  hold_flag boolean not null default false,
  lot_only_flag boolean not null default false,
  make text not null,
  model text not null,
  year integer,
  unit_type text not null,
  title text not null,
  subtitle text,
  long_description text not null,
  teaser_by_channel jsonb not null default '{}'::jsonb,
  structured_feature_list jsonb not null default '[]'::jsonb,
  keyword_targets jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  price_justification_prose text,
  condition_grade text not null check (condition_grade in ('excellent', 'good', 'fair', 'parts_only')),
  condition_summary text not null,
  warranty_terms_short text,
  location_city text,
  location_state text,
  location_label text not null,
  contact_email_public text not null,
  contact_phone_public text not null,
  serial text,
  capacity_lbs integer,
  mast_collapsed_inches integer,
  mast_extended_inches integer,
  battery_summary text,
  battery_voltage integer,
  hours_approx integer,
  asking_price_usd numeric(12,2),
  lot_asking_price_usd numeric(12,2),
  price_posture text not null check (price_posture in ('fixed', 'lot_only', 'call_for_price', 'best_offer')),
  canonical_slug text not null,
  canonical_url text not null,
  seo_title text not null,
  meta_description text not null,
  og_title text not null,
  og_description text not null,
  og_image_url text,
  twitter_card text not null check (twitter_card in ('summary', 'summary_large_image')),
  images jsonb not null default '[]'::jsonb,
  schema_pointers jsonb not null default '{}'::jsonb,
  platform_overrides jsonb not null default '[]'::jsonb,
  manual_overrides jsonb not null default '{}'::jsonb,
  claim_safety_flags jsonb not null default '[]'::jsonb,
  derivation_version text not null,
  source_updated_at timestamptz not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists inventory_marketing_unit_id_uidx on public.inventory_marketing (unit_id);
create unique index if not exists inventory_marketing_canonical_slug_uidx on public.inventory_marketing (canonical_slug);
create index if not exists inventory_marketing_publish_status_idx on public.inventory_marketing (publish_status);
create index if not exists inventory_marketing_source_kind_idx on public.inventory_marketing (source_kind);

alter table public.inventory_marketing enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventory_marketing'
      and policyname = 'inventory_marketing_service_role_write'
  ) then
    create policy inventory_marketing_service_role_write
    on public.inventory_marketing
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventory_marketing'
      and policyname = 'inventory_marketing_admin_read'
  ) then
    create policy inventory_marketing_admin_read
    on public.inventory_marketing
    for select
    using (auth.role() = 'service_role' or auth.jwt() ->> 'role' = 'admin');
  end if;
end $$;

-- DOWN guide (manual rollback)
-- drop policy if exists inventory_marketing_admin_read on public.inventory_marketing;
-- drop policy if exists inventory_marketing_service_role_write on public.inventory_marketing;
-- drop table if exists public.inventory_marketing;
