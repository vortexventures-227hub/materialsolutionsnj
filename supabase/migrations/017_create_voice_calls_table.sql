-- Migration: 017_create_voice_calls_table
-- Date: 2026-04-27
-- Purpose: add David runtime Retell voice-call persistence table expected by david-agent.
-- Additive only; safe to apply through Supabase SQL editor after owner approval.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Retell call metadata
  retell_call_id TEXT NOT NULL UNIQUE,
  agent_id TEXT,
  from_number TEXT,
  to_number TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Retell standard analysis
  transcript TEXT,
  call_summary TEXT,
  user_sentiment TEXT,
  call_successful BOOLEAN,
  in_voicemail BOOLEAN,

  -- David/MSNJ custom analysis fields
  caller_name TEXT,
  company TEXT,
  unit_interest TEXT,
  lead_intent TEXT,
  escalation_needed TEXT,
  budget TEXT,
  timeline TEXT,
  caller_contact TEXT,
  lead_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_voice_calls_caller_contact
  ON voice_calls(caller_contact)
  WHERE caller_contact IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_calls_retell_call_id
  ON voice_calls(retell_call_id);

CREATE INDEX IF NOT EXISTS idx_voice_calls_created_at
  ON voice_calls(created_at DESC);

ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_calls'
      AND policyname = 'Allow service role full access to voice_calls'
  ) THEN
    CREATE POLICY "Allow service role full access to voice_calls"
      ON voice_calls FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

GRANT ALL ON voice_calls TO service_role;

COMMENT ON TABLE voice_calls IS
  'Retell AI post-call records for David voice agent. Populated by POST /webhook/retell/post-call.';

SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'voice_calls'
) AS voice_calls_exists;
