-- Fix: Allow anonymous users to read winners and profiles
-- The policies were set to "authenticated" only, preventing logged-out users from seeing data

-- ============================================
-- WINNERS
-- ============================================
DROP POLICY IF EXISTS "Winners are viewable by everyone" ON winners;

CREATE POLICY "Winners are viewable by everyone"
  ON winners FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- PROFILES (for "Les plus chanceux" widget)
-- ============================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);
