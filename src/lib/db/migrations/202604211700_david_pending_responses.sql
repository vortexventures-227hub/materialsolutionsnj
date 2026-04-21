create extension if not exists pgcrypto;

create table if not exists public.david_pending_responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  conversation_id uuid not null,
  channel text not null check (channel in ('email', 'sms', 'voice', 'telegram')),
  draft_response text not null,
  template_used text,
  variables_filled jsonb,
  confidence_score numeric(3,2),
  reasoning text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'edited', 'rejected', 'escalated')),
  final_response text,
  decision_by text,
  decided_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_dpr_status on public.david_pending_responses(status);
create index if not exists idx_dpr_conversation on public.david_pending_responses(conversation_id);
