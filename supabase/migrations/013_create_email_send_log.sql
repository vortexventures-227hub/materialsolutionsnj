-- Migration: 013_create_email_send_log
-- Date: 2026-04-25
-- Adds durable audit trail for David outbound/post-conversation email sends.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  to_email TEXT NOT NULL,
  cc_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  outcome TEXT NOT NULL,
  lead_id UUID,
  conversation_id UUID,
  sendgrid_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_send_log_sent_at
  ON email_send_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_to_email
  ON email_send_log(lower(to_email));

CREATE INDEX IF NOT EXISTS idx_email_send_log_lead_id
  ON email_send_log(lead_id);

CREATE INDEX IF NOT EXISTS idx_email_send_log_conversation_id
  ON email_send_log(conversation_id);

ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_send_log'
      AND policyname = 'Allow service role full access to email_send_log'
  ) THEN
    CREATE POLICY "Allow service role full access to email_send_log"
      ON email_send_log FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

GRANT ALL ON email_send_log TO service_role;

SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'email_send_log'
) AS email_send_log_exists;
