-- Add last_credits_reset column to profiles table
-- This tracks when credits were last reset for free users

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_credits_reset TIMESTAMPTZ DEFAULT NOW();

-- Add index for efficient querying during daily reset
-- Only indexes profiles that haven't purchased credits (free users)
CREATE INDEX IF NOT EXISTS idx_profiles_last_reset
ON profiles(last_credits_reset)
WHERE has_purchased_credits = false;

-- Initialize last_credits_reset for existing profiles
UPDATE profiles
SET last_credits_reset = NOW()
WHERE last_credits_reset IS NULL;
