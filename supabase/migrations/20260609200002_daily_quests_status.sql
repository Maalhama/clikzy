-- ============================================================
-- daily_quests_status : statut des quêtes du jour pour l'UI (progression réelle
-- calculée côté serveur + déjà-réclamée). Même logique que claim_quest (DRY).
-- ============================================================

CREATE OR REPLACE FUNCTION daily_quests_status()
RETURNS TABLE(
  key TEXT, title TEXT, description TEXT, target INTEGER,
  xp_reward INTEGER, credits_reward INTEGER, progress INTEGER,
  claimed BOOLEAN, sort_order INTEGER
) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    q.key, q.title, q.description, q.target, q.xp_reward, q.credits_reward,
    CASE q.metric
      WHEN 'clicks_today' THEN (
        SELECT COUNT(*)::int FROM clicks
        WHERE user_id = v_user AND is_bot = false
          AND (clicked_at AT TIME ZONE 'Europe/Paris')::date = v_today)
      WHEN 'distinct_games_today' THEN (
        SELECT COUNT(DISTINCT game_id)::int FROM clicks
        WHERE user_id = v_user AND is_bot = false
          AND (clicked_at AT TIME ZONE 'Europe/Paris')::date = v_today)
      WHEN 'mini_games_today' THEN (
        SELECT COUNT(*)::int FROM mini_game_plays WHERE user_id = v_user AND play_day = v_today)
      WHEN 'login' THEN 1
      ELSE 0
    END AS progress,
    EXISTS (
      SELECT 1 FROM user_quest_claims c
      WHERE c.user_id = v_user AND c.quest_key = q.key AND c.quest_day = v_today
    ) AS claimed,
    q.sort_order
  FROM daily_quests q
  WHERE q.active = true
  ORDER BY q.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION daily_quests_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION daily_quests_status() TO authenticated, service_role;
