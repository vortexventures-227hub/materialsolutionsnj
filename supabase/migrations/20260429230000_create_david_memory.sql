-- David Memory production schema gate
-- Patch REQUEST_CHANGES 2026-04-29: reviewable SQL + RLS + identity/updated_at index.
-- Safe to review while DAVID_MEMORY_ENABLED and DAVID_MEMORY_WRITE_ENABLED remain false.

create extension if not exists pgcrypto;

create table if not exists public.david_memory (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null,
  pii_fingerprint text,
  fact text not null,
  category text not null check (category in (
    'durable_fact',
    'equipment_interest',
    'operator_note',
    'preference'
  )),
  inventory_ref jsonb,
  source text not null default 'chat',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.david_memory is
  'David persistent memory rows. Stores redacted identity keys/fingerprints and safe durable facts only; no raw PII, no live availability/pricing/spec truth.';
comment on column public.david_memory.identity_key is
  'Server-derived key such as person:{id} or session:{sha12}; never raw phone/email/name/company.';
comment on column public.david_memory.pii_fingerprint is
  'Optional SHA-256/12 receipt/debug fingerprint; never raw PII.';
comment on column public.david_memory.inventory_ref is
  'JSON object limited to inventory id/slug/title references. Not proof of availability, pricing, or specs.';

create or replace function public.set_david_memory_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists david_memory_set_updated_at on public.david_memory;
create trigger david_memory_set_updated_at
before update on public.david_memory
for each row
execute function public.set_david_memory_updated_at();

-- Retrieval path: retrieve filters by identity_key and orders by updated_at desc.
create index if not exists david_memory_identity_updated_at_idx
  on public.david_memory (identity_key, updated_at desc);

create index if not exists david_memory_category_idx
  on public.david_memory (category);

-- Explicit permission boundary. Service role owns server-side writes; authenticated
-- reads are still constrained by RLS. Anonymous callers get nothing.
revoke all on public.david_memory from anon;
revoke all on public.david_memory from authenticated;
revoke all on public.david_memory from service_role;

grant select on public.david_memory to authenticated;
grant insert, update on public.david_memory to service_role;
grant select, insert, update, delete on public.david_memory to service_role;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

alter table public.david_memory enable row level security;
alter table public.david_memory force row level security;

-- RLS claim contract:
-- The API layer must set request.jwt.claims.david_memory_identity_key to the same
-- server-derived identity_key used by the David memory adapter. This avoids exposing
-- raw PII in SQL policies and keeps browser/session callers scoped to their own rows.
create policy "david_memory_select_own_identity"
  on public.david_memory
  for select
  to authenticated
  using (
    identity_key = (current_setting('request.jwt.claims', true)::jsonb ->> 'david_memory_identity_key')
  );

create policy "david_memory_insert_own_identity"
  on public.david_memory
  for insert
  to authenticated
  with check (
    identity_key = (current_setting('request.jwt.claims', true)::jsonb ->> 'david_memory_identity_key')
  );

create policy "david_memory_update_own_identity"
  on public.david_memory
  for update
  to authenticated
  using (
    identity_key = (current_setting('request.jwt.claims', true)::jsonb ->> 'david_memory_identity_key')
  )
  with check (
    identity_key = (current_setting('request.jwt.claims', true)::jsonb ->> 'david_memory_identity_key')
  );

-- Server-side service role may write/read during the guarded adapter path. This is
-- intentionally unavailable to anon and still feature-flagged by DAVID_MEMORY_WRITE_ENABLED.
create policy "david_memory_service_role_all"
  on public.david_memory
  for all
  to service_role
  using (true)
  with check (true);
