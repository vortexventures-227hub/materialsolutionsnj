create extension if not exists pgcrypto;

create table if not exists public.listing_status (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null,
  platform text not null,
  status text not null check (status in ('not_started', 'viewed', 'posted')),
  live_url text,
  posted_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  unique (unit_id, platform)
);
