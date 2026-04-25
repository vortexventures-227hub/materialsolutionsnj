-- Migration: 014_create_david_runtime_conversation_tables
-- Date: 2026-04-25
-- Enables David Telegram/email runtime persistence for conversations and Telegram turns.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  surface TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_surface ON conversations(surface);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
      AND policyname = 'Allow service role full access to conversations'
  ) THEN
    CREATE POLICY "Allow service role full access to conversations"
      ON conversations FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

GRANT ALL ON conversations TO service_role;

CREATE TABLE IF NOT EXISTS david_telegram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL,
  update_id BIGINT NOT NULL UNIQUE,
  from_user_id BIGINT,
  from_username TEXT,
  from_first_name TEXT,
  inbound_text TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  lead_score INTEGER,
  should_escalate BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_david_telegram_conversations_chat_id
  ON david_telegram_conversations(chat_id);

CREATE INDEX IF NOT EXISTS idx_david_telegram_conversations_sent_at
  ON david_telegram_conversations(sent_at DESC);

ALTER TABLE david_telegram_conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'david_telegram_conversations'
      AND policyname = 'Allow service role full access to david_telegram_conversations'
  ) THEN
    CREATE POLICY "Allow service role full access to david_telegram_conversations"
      ON david_telegram_conversations FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

GRANT ALL ON david_telegram_conversations TO service_role;

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) AS conversations_exists,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'david_telegram_conversations'
  ) AS david_telegram_conversations_exists;
