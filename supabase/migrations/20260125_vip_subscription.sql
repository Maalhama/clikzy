-- Migration: Add VIP subscription fields to profiles
-- Date: 2025-01-25

-- Add VIP columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vip_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;

-- Create index for VIP queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_vip ON profiles(is_vip) WHERE is_vip = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_vip IS 'Whether the user has an active VIP subscription';
COMMENT ON COLUMN profiles.vip_subscription_id IS 'Stripe subscription ID for VIP';
COMMENT ON COLUMN profiles.vip_expires_at IS 'When the current VIP period expires';
