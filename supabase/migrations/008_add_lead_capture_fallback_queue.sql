-- Migration: 008_add_lead_capture_fallback_queue
-- Date: 2026-04-17
-- Adds a durable fallback queue for lead capture degraded mode so serverless runtime
-- does not depend on ephemeral filesystem writes for recovery.

CREATE TABLE IF NOT EXISTS lead_capture_fallback_queue (
  queue_id TEXT PRIMARY KEY,
  capture_id TEXT NOT NULL,
  retry_owner TEXT NOT NULL,
  retry_deadline TIMESTAMPTZ NOT NULL,
  degraded_reason TEXT NOT NULL,
  alert_artifact_path TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_capture_fallback_queue_capture_id
  ON lead_capture_fallback_queue(capture_id);

CREATE INDEX IF NOT EXISTS idx_lead_capture_fallback_queue_retry_deadline
  ON lead_capture_fallback_queue(retry_deadline);

ALTER TABLE lead_capture_fallback_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lead_capture_fallback_queue'
      AND policyname = 'Allow service role full access to lead_capture_fallback_queue'
  ) THEN
    CREATE POLICY "Allow service role full access to lead_capture_fallback_queue"
      ON lead_capture_fallback_queue FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

GRANT ALL ON lead_capture_fallback_queue TO service_role;
