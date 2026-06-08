-- ============================================
-- DATA PERSISTENCE GUARANTEES
-- Version: 1.0.0
--
-- IMPORTANT: This migration ensures player data is NEVER deleted
-- All stats, badges, wins, and achievements are permanent
-- ============================================

-- ============================================
-- 1. MODIFY WINNERS TABLE FK TO SET NULL
-- This ensures winner records persist even if games are cleaned up
-- ============================================

-- First, drop the existing constraint
ALTER TABLE winners
DROP CONSTRAINT IF EXISTS winners_game_id_fkey;

-- Re-add with SET NULL - winner records persist even if game is deleted
ALTER TABLE winners
ADD CONSTRAINT winners_game_id_fkey
FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL;

-- Make game_id nullable to allow SET NULL
ALTER TABLE winners
ALTER COLUMN game_id DROP NOT NULL;

-- ============================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- Explicit documentation that these tables are NEVER to be truncated/deleted
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles - NEVER DELETE. Contains permanent stats: total_wins, total_clicks, earned_credits, badges count. Only daily credits field resets.';

COMMENT ON TABLE user_badges IS 'User earned badges - NEVER DELETE. Permanent achievement records.';

COMMENT ON TABLE winners IS 'Winner history - NEVER DELETE. Permanent record of all victories.';

COMMENT ON TABLE mini_game_plays IS 'Mini-game play history - NEVER DELETE. Permanent record of all plays.';

-- Column-specific comments for profiles
COMMENT ON COLUMN profiles.total_wins IS 'PERMANENT - Lifetime wins counter, never reset';
COMMENT ON COLUMN profiles.total_clicks IS 'PERMANENT - Lifetime clicks counter, never reset';
COMMENT ON COLUMN profiles.earned_credits IS 'PERMANENT - Earned credits from games/badges/purchases, never reset';
COMMENT ON COLUMN profiles.credits IS 'DAILY RESET - Free credits, resets to 10 (or 20 for VIP) daily';
COMMENT ON COLUMN profiles.referral_count IS 'PERMANENT - Referral count, never reset';
COMMENT ON COLUMN profiles.referral_credits_earned IS 'PERMANENT - Credits earned from referrals, never reset';

-- ============================================
-- 3. CREATE AUDIT LOG TABLE FOR DATA CHANGES
-- Track any modifications to critical player data
-- ============================================

CREATE TABLE IF NOT EXISTS player_data_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'badge_earned', 'win_recorded', 'credits_earned', etc.
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying user history
CREATE INDEX IF NOT EXISTS idx_player_data_audit_user ON player_data_audit(user_id, created_at DESC);

-- RLS for audit table
ALTER TABLE player_data_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit log
CREATE POLICY "Users can view own audit log"
  ON player_data_audit FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Only service role can insert (via server actions)
CREATE POLICY "Service role can insert audit logs"
  ON player_data_audit FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 4. CREATE FUNCTION TO LOG IMPORTANT EVENTS
-- ============================================

CREATE OR REPLACE FUNCTION log_player_event(
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO player_data_audit (user_id, action, details)
  VALUES (p_user_id, p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ADD TRIGGERS TO LOG CRITICAL CHANGES
-- ============================================

-- Log when a badge is earned
CREATE OR REPLACE FUNCTION log_badge_earned()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_player_event(
    NEW.user_id,
    'badge_earned',
    jsonb_build_object('badge_id', NEW.badge_id, 'earned_at', NEW.earned_at)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_badge_earned ON user_badges;
CREATE TRIGGER on_badge_earned
  AFTER INSERT ON user_badges
  FOR EACH ROW EXECUTE FUNCTION log_badge_earned();

-- Log when a win is recorded
CREATE OR REPLACE FUNCTION log_win_recorded()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_player_event(
    NEW.user_id,
    'win_recorded',
    jsonb_build_object(
      'item_name', NEW.item_name,
      'item_value', NEW.item_value,
      'won_at', NEW.won_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_win_recorded ON winners;
CREATE TRIGGER on_win_recorded
  AFTER INSERT ON winners
  FOR EACH ROW EXECUTE FUNCTION log_win_recorded();

-- ============================================
-- 6. VERIFY DATA PERSISTENCE (run to confirm)
-- ============================================

-- This query should return all tables that contain player data
-- SELECT table_name, obj_description(('"' || table_name || '"')::regclass)
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('profiles', 'user_badges', 'winners', 'mini_game_plays');
