-- Migration: 015_add_conversations_identity_columns
-- Date: 2026-04-26
-- Purpose: make David runtime identity/operator recall schema match runtime code.
-- Additive only: nullable email/phone columns plus partial indexes; no data mutation.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_email
  ON conversations(email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_phone
  ON conversations(phone)
  WHERE phone IS NOT NULL;
