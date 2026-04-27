-- Migration: 015_create_published_queue
-- Date: 2026-04-26
-- Adds durable audit trail for the Publish Button pipeline.
-- Replaces appendFile-to-JSONL ephemeral pattern with a persistent Supabase record.
-- Receipt entries are append-only; id is the deterministic sha256 hash from the pipeline.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS published_queue (
  id              TEXT        PRIMARY KEY,  -- sha256 hash from writeReceiptEntry (receiptId)
  unit_id         TEXT        NOT NULL,
  platform        TEXT        NOT NULL,
  mode            TEXT        NOT NULL,
  listing_url     TEXT,
  queue_file_path TEXT,
  channel_receipt JSONB,
  error_log       TEXT,
  qa_blocked      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_published_queue_created_at
  ON published_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_published_queue_unit_id
  ON published_queue(unit_id);

CREATE INDEX IF NOT EXISTS idx_published_queue_platform
  ON published_queue(platform);

ALTER TABLE published_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'published_queue'
      AND policyname = 'Allow service role full access to published_queue'
  ) THEN
    CREATE POLICY "Allow service role full access to published_queue"
      ON published_queue FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

GRANT ALL ON published_queue TO service_role;

SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'published_queue'
) AS published_queue_exists;
