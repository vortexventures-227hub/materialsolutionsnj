-- Create production inventory table for Push Button inventory sync
-- Additive and safe to run on an empty or partially provisioned project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_key TEXT NOT NULL,
  slug TEXT,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  type TEXT NOT NULL,
  fuel_type TEXT,
  capacity_lbs INTEGER,
  lift_height_inches INTEGER,
  hours INTEGER,
  price INTEGER,
  condition TEXT,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  warranty_info TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'available',
  hold_reason TEXT,
  source_type TEXT NOT NULL DEFAULT 'unit',
  source_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS source_payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS warranty_info TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE inventory
SET external_key = COALESCE(external_key, id::text)
WHERE external_key IS NULL;

ALTER TABLE inventory
  ALTER COLUMN external_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_external_key_unique'
  ) THEN
    ALTER TABLE inventory
      ADD CONSTRAINT inventory_external_key_unique UNIQUE (external_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory(is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type);
CREATE INDEX IF NOT EXISTS idx_inventory_slug ON inventory(slug);

CREATE OR REPLACE FUNCTION update_inventory_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_updated_at'
  ) THEN
    CREATE TRIGGER update_inventory_updated_at
      BEFORE UPDATE ON inventory
      FOR EACH ROW
      EXECUTE FUNCTION update_inventory_updated_at_column();
  END IF;
END $$;

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory' AND policyname = 'Allow public read access to inventory'
  ) THEN
    CREATE POLICY "Allow public read access to inventory"
      ON inventory FOR SELECT
      USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory' AND policyname = 'Allow service role full access to inventory'
  ) THEN
    CREATE POLICY "Allow service role full access to inventory"
      ON inventory FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
