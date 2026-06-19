-- ============================================================================
-- Lot F (engagement) #5 : objectifs HEBDOMADAIRES (couche au-dessus des quêtes
-- journalières) — urgence en milieu de semaine, récompenses plus grosses. Réplique
-- le pattern daily_quests (def + claims + claim/status RPC) calé sur la semaine ISO
-- (lundi, Europe/Paris). Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_quests (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL,            -- 'clicks_week' | 'distinct_games_week' | 'mini_games_week'
  target INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  credits_reward INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO weekly_quests (key, title, description, metric, target, xp_reward, credits_reward, sort_order) VALUES
  ('w_clicks_30',   'Marathon de la semaine', 'Utilise 30 clics cette semaine',         'clicks_week',         30, 150, 50, 1),
  ('w_games_10',    'Grand explorateur',      'Participe à 10 lots différents',         'distinct_games_week', 10, 200, 75, 2),
  ('w_minigames_5', 'Roi des mini-jeux',      'Joue à 5 mini-jeux cette semaine',       'mini_games_week',      5, 120, 40, 3)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_weekly_quest_claims (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL REFERENCES weekly_quests(key),
  quest_week DATE NOT NULL,        -- lundi de la semaine ISO (Europe/Paris)
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_key, quest_week)
);

ALTER TABLE weekly_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_quest_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Weekly quests readable" ON weekly_quests;
CREATE POLICY "Weekly quests readable" ON weekly_quests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Own weekly claims readable" ON user_weekly_quest_claims;
CREATE POLICY "Own weekly claims readable" ON user_weekly_quest_claims FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- claim_weekly_quest : valide depuis les VRAIES données + crédite une fois/semaine.
CREATE OR REPLACE FUNCTION claim_weekly_quest(p_quest_key TEXT)
RETURNS TABLE(ok BOOLEAN, reason TEXT, xp_reward INTEGER, credits_reward INTEGER) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_week DATE := date_trunc('week', (now() AT TIME ZONE 'Europe/Paris'))::date;
  v_q weekly_quests%ROWTYPE;
  v_progress INTEGER;
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text, 0, 0; RETURN; END IF;

  SELECT * INTO v_q FROM weekly_quests WHERE key = p_quest_key AND active = true;
  IF v_q.key IS NULL THEN RETURN QUERY SELECT false, 'unknown_quest'::text, 0, 0; RETURN; END IF;

  IF EXISTS (SELECT 1 FROM user_weekly_quest_claims WHERE user_id = v_user AND quest_key = p_quest_key AND quest_week = v_week) THEN
    RETURN QUERY SELECT false, 'already_claimed'::text, 0, 0; RETURN;
  END IF;

  v_progress := CASE v_q.metric
    WHEN 'clicks_week' THEN (
      SELECT COUNT(*) FROM clicks
      WHERE user_id = v_user AND is_bot = false
        AND (clicked_at AT TIME ZONE 'Europe/Paris')::date >= v_week)
    WHEN 'distinct_games_week' THEN (
      SELECT COUNT(DISTINCT game_id) FROM clicks
      WHERE user_id = v_user AND is_bot = false
        AND (clicked_at AT TIME ZONE 'Europe/Paris')::date >= v_week)
    WHEN 'mini_games_week' THEN (
      SELECT COUNT(*) FROM mini_game_plays WHERE user_id = v_user AND play_day >= v_week)
    ELSE 0
  END;

  IF v_progress < v_q.target THEN
    RETURN QUERY SELECT false, 'not_completed'::text, 0, 0; RETURN;
  END IF;

  INSERT INTO user_weekly_quest_claims (user_id, quest_key, quest_week) VALUES (v_user, p_quest_key, v_week);
  UPDATE profiles SET
    earned_credits = earned_credits + v_q.credits_reward,
    xp = xp + v_q.xp_reward,
    level = xp_to_level(xp + v_q.xp_reward)
  WHERE id = v_user;

  RETURN QUERY SELECT true, 'ok'::text, v_q.xp_reward, v_q.credits_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_weekly_quest(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_weekly_quest(text) TO authenticated, service_role;

-- weekly_quests_status : quêtes + progression réelle + claimed pour la semaine courante.
CREATE OR REPLACE FUNCTION weekly_quests_status()
RETURNS TABLE(
  key TEXT, title TEXT, description TEXT, target INTEGER,
  xp_reward INTEGER, credits_reward INTEGER, progress INTEGER,
  claimed BOOLEAN, sort_order INTEGER
) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_week DATE := date_trunc('week', (now() AT TIME ZONE 'Europe/Paris'))::date;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    q.key, q.title, q.description, q.target, q.xp_reward, q.credits_reward,
    CASE q.metric
      WHEN 'clicks_week' THEN (
        SELECT COUNT(*)::int FROM clicks
        WHERE user_id = v_user AND is_bot = false
          AND (clicked_at AT TIME ZONE 'Europe/Paris')::date >= v_week)
      WHEN 'distinct_games_week' THEN (
        SELECT COUNT(DISTINCT game_id)::int FROM clicks
        WHERE user_id = v_user AND is_bot = false
          AND (clicked_at AT TIME ZONE 'Europe/Paris')::date >= v_week)
      WHEN 'mini_games_week' THEN (
        SELECT COUNT(*)::int FROM mini_game_plays WHERE user_id = v_user AND play_day >= v_week)
      ELSE 0
    END AS progress,
    EXISTS (
      SELECT 1 FROM user_weekly_quest_claims c
      WHERE c.user_id = v_user AND c.quest_key = q.key AND c.quest_week = v_week
    ) AS claimed,
    q.sort_order
  FROM weekly_quests q
  WHERE q.active = true
  ORDER BY q.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION weekly_quests_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION weekly_quests_status() TO authenticated, service_role;
