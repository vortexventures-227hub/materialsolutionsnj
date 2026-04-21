-- Material Solutions NJ - Supabase Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sit-down', 'reach-truck', 'order-picker', 'pallet-jack', 'turret-truck')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('electric', 'propane', 'diesel', 'manual')),
  capacity_lbs INTEGER NOT NULL,
  lift_height_inches INTEGER NOT NULL,
  hours INTEGER NOT NULL,
  price INTEGER NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('excellent', 'good', 'fair')),
  description TEXT,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  inspection_checklist JSONB DEFAULT '{}',
  warranty_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE
);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  subject TEXT,
  source TEXT DEFAULT 'contact_form',
  page_origin TEXT,
  cta_origin TEXT,
  listing_id TEXT,
  listing_slug TEXT,
  listing_title TEXT,
  service_slug TEXT,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'cool' CHECK (status IN ('hot', 'warm', 'cool', 'contacted', 'converted')),
  interests TEXT[] DEFAULT '{}',
  conversation_summary TEXT,
  timeline TEXT,
  budget_confirmed BOOLEAN DEFAULT FALSE,
  use_case TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE
);

-- Conversations Table (optional - for local storage backup)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Durable fallback queue for lead capture degraded mode
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type);
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory(is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_featured ON inventory(is_featured);
CREATE INDEX IF NOT EXISTS idx_inventory_price ON inventory(price);
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id ON leads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_lead_capture_fallback_queue_capture_id ON lead_capture_fallback_queue(capture_id);
CREATE INDEX IF NOT EXISTS idx_lead_capture_fallback_queue_retry_deadline ON lead_capture_fallback_queue(retry_deadline);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_capture_fallback_queue ENABLE ROW LEVEL SECURITY;

-- Policies for public read access to inventory
CREATE POLICY "Allow public read access to available inventory"
  ON inventory FOR SELECT
  USING (is_available = TRUE);

-- Policies for service role access (full access)
CREATE POLICY "Allow service role full access to inventory"
  ON inventory FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to leads"
  ON leads FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to conversations"
  ON conversations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to lead_capture_fallback_queue"
  ON lead_capture_fallback_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Sample inventory data for testing
INSERT INTO inventory (title, brand, model, year, type, fuel_type, capacity_lbs, lift_height_inches, hours, price, condition, description, features, warranty_info, is_featured)
VALUES 
(
  '2019 Raymond 5200 Order Picker',
  'Raymond',
  '5200',
  2019,
  'order-picker',
  'electric',
  3000,
  276,
  4200,
  24500,
  'excellent',
  'Low-hour Raymond 5200 in excellent condition. Perfect for distribution centers and high-volume picking operations. Wire guidance compatible.',
  ARRAY['Wire guidance ready', 'AC traction motor', 'Full maintenance history', 'Height select system'],
  '90-day powertrain warranty included',
  TRUE
),
(
  '2020 Toyota 8FGCU25 Cushion Tire',
  'Toyota',
  '8FGCU25',
  2020,
  'sit-down',
  'propane',
  5000,
  189,
  3100,
  19800,
  'excellent',
  'Toyota reliability with low hours. SAS stability system equipped. Ideal for indoor warehouse operations.',
  ARRAY['SAS stability system', 'Side shift', 'Recently serviced', 'LP Ready'],
  '90-day powertrain warranty included',
  TRUE
),
(
  '2018 Crown RC 5500 Reach Truck',
  'Crown',
  'RC 5500',
  2018,
  'reach-truck',
  'electric',
  4500,
  312,
  6800,
  18500,
  'good',
  'Well-maintained Crown reach truck with 26ft lift height. InfoLink ready for fleet management.',
  ARRAY['InfoLink ready', 'Ergonomic controls', 'Good battery', '26ft reach'],
  '60-day warranty included',
  FALSE
),
(
  '2021 Yale MPB045VG Electric Pallet Jack',
  'Yale',
  'MPB045VG',
  2021,
  'pallet-jack',
  'electric',
  4500,
  8,
  1200,
  4800,
  'excellent',
  'Like-new electric pallet jack with very low hours. Great for dock work and retail operations.',
  ARRAY['Lithium battery option', 'Low hours', 'Full warranty', 'AC drive'],
  '90-day full warranty',
  TRUE
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON inventory TO anon;
GRANT ALL ON inventory, leads, conversations TO authenticated;
GRANT ALL ON inventory, leads, conversations, lead_capture_fallback_queue TO service_role;
