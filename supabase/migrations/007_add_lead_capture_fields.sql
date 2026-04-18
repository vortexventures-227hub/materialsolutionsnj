-- Migration: 007_add_lead_capture_fields
-- Date: 2026-04-17
-- Adds rich lead-capture columns to the leads table that capture.ts requires.
-- This is an ADDITIVE migration only — no data loss, no column drops.

-- Add missing lead-capture context columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'contact_form';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS page_origin TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cta_origin TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS listing_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS listing_slug TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS listing_title TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_slug TEXT;

-- Backfill source with 'contact_form' for any existing leads that have no source
UPDATE leads SET source = 'contact_form' WHERE source IS NULL;

-- Add index on source for lead attribution queries
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Add indexes on page_origin and cta_origin for CTA attribution
CREATE INDEX IF NOT EXISTS idx_leads_page_origin ON leads(page_origin) WHERE page_origin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_cta_origin ON leads(cta_origin) WHERE cta_origin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_listing_id ON leads(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_service_slug ON leads(service_slug) WHERE service_slug IS NOT NULL;

-- Verify columns were added
DO $$
BEGIN
  PERFORM TRUE FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name IN ('subject','source','page_origin','cta_origin','listing_id','listing_slug','listing_title','service_slug');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Column verification failed: %', SQLERRM;
END $$;
