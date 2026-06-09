-- ============================================================
-- Findings low : intégrité + perf
--  - earned_credits ne doit jamais être négatif (cohérence économie).
--  - index composite pour le feed de clics par partie (/api/clicks/recent?game_id=).
-- ============================================================

-- garde-fou : aucun earned_credits négatif (corrige d'abord d'éventuelles anomalies)
UPDATE profiles SET earned_credits = 0 WHERE earned_credits < 0;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS earned_credits_non_negative;
ALTER TABLE profiles ADD CONSTRAINT earned_credits_non_negative CHECK (earned_credits >= 0);

-- feed temps réel par partie : clics d'une partie triés par date
CREATE INDEX IF NOT EXISTS idx_clicks_game_recent ON clicks(game_id, clicked_at DESC);
