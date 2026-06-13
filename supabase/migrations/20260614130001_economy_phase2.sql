-- ============================================================
-- ÉCONOMIE PHASE 2 (2026-06) — crédits gratuits secondaires -50%
-- Les mini-jeux sont déjà réduits côté code (provablyFair / miniGames types).
-- Ici : quêtes du jour + streak de connexion. XP inchangée (on ne coupe que les crédits).
-- But : crédits gratuits rares -> les packs restent la vraie source (cf Phase 1).
-- ============================================================

-- Quêtes du jour : ~4 -> ~2 crédits/jour
UPDATE daily_quests SET credits_reward = 1 WHERE key = 'clicks_5';
UPDATE daily_quests SET credits_reward = 1 WHERE key = 'games_3';   -- était 2
UPDATE daily_quests SET credits_reward = 0 WHERE key = 'minigame_1'; -- le mini-jeu paie déjà
UPDATE daily_quests SET credits_reward = 0 WHERE key = 'login';

-- Streak connexion : crédits -50% (J1..J7 -> ~0..3 au lieu de 1..7). XP inchangée.
CREATE OR REPLACE FUNCTION claim_daily_login(p_user_id UUID)
RETURNS TABLE(streak INTEGER, xp_gained INTEGER, credits_gained INTEGER, already BOOLEAN) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last DATE; v_streak INT; v_xp CONSTANT INT := 20; v_credits INT; v_cbonus INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT streak_last_day, streak_count, COALESCE(equip_credit_bonus_pct, 0)
    INTO v_last, v_streak, v_cbonus FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_last = v_today THEN RETURN QUERY SELECT v_streak, 0, 0, true; RETURN; END IF;
  IF v_last = v_today - 1 THEN v_streak := COALESCE(v_streak, 0) + 1; ELSE v_streak := 1; END IF;
  -- Phase 2 : crédits -50% (cap J7), bonus équipement inclus
  v_credits := floor(LEAST(v_streak, 7) * (100 + v_cbonus) / 200.0);
  UPDATE profiles SET streak_count = v_streak, streak_last_day = v_today,
    earned_credits = earned_credits + v_credits, xp = xp + v_xp, level = xp_to_level(xp + v_xp)
  WHERE id = p_user_id;
  IF v_streak > 0 AND v_streak % 30 = 0 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'legendary', 'streak_30');
  ELSIF v_streak > 0 AND v_streak % 7 = 0 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'rare', 'streak_7');
  END IF;
  RETURN QUERY SELECT v_streak, v_xp, v_credits, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_daily_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_daily_login(uuid) TO authenticated, service_role;
