-- Add shipping address fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shipping_firstname TEXT,
ADD COLUMN IF NOT EXISTS shipping_lastname TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_address2 TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'France',
ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

-- Add shipping status to winners table
ALTER TABLE winners
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'address_needed', 'processing', 'shipped', 'delivered')),
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN profiles.shipping_firstname IS 'First name for shipping';
COMMENT ON COLUMN profiles.shipping_lastname IS 'Last name for shipping';
COMMENT ON COLUMN profiles.shipping_address IS 'Main address line';
COMMENT ON COLUMN profiles.shipping_address2 IS 'Additional address info (apt, building, etc.)';
COMMENT ON COLUMN profiles.shipping_postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN profiles.shipping_city IS 'City';
COMMENT ON COLUMN profiles.shipping_country IS 'Country (default: France)';
COMMENT ON COLUMN profiles.shipping_phone IS 'Phone number for delivery';
COMMENT ON COLUMN winners.shipping_status IS 'Status: pending, address_needed, processing, shipped, delivered';
