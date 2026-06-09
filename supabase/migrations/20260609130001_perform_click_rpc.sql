-- ============================================================
-- perform_click : clic joueur ATOMIQUE (I5) + permet de fermer la RLS games UPDATE (C1)
-- Fait en UNE transaction (avec verrou FOR UPDATE sur la partie) : vérif crédits, déduction
-- (daily puis earned), insertion du clic, maj de la partie (last_click, total_clicks, timer
-- en phase finale, battle_start_time), maj total_clicks du profil.
-- SECURITY DEFINER → bypass RLS, ce qui permettra de retirer le grant UPDATE direct sur games.
-- ============================================================

CREATE OR REPLACE FUNCTION perform_click(
  p_game_id UUID,
  p_user_id UUID,
  p_username TEXT,
  p_item_name TEXT
)
RETURNS TABLE(ok BOOLEAN, new_total INTEGER, new_end_time BIGINT, reason TEXT) AS $$
DECLARE
  v_status TEXT;
  v_end_time BIGINT;
  v_battle_start TIMESTAMPTZ;
  v_daily INTEGER;
  v_earned INTEGER;
  v_seq INTEGER;
  v_now BIGINT := (EXTRACT(EPOCH FROM now()) * 1000)::bigint;
  v_new_end BIGINT;
  v_new_status TEXT;
BEGIN
  -- Verrou sur la partie (sérialise les clics concurrents → règle les races I5)
  SELECT status, end_time, battle_start_time INTO v_status, v_end_time, v_battle_start
  FROM games WHERE id = p_game_id FOR UPDATE;

  IF v_status IS NULL OR v_status NOT IN ('active', 'final_phase') THEN
    RETURN QUERY SELECT false, 0, 0::bigint, 'game_not_active'::text; RETURN;
  END IF;

  SELECT credits, earned_credits INTO v_daily, v_earned FROM profiles WHERE id = p_user_id;
  IF v_daily IS NULL THEN
    RETURN QUERY SELECT false, 0, 0::bigint, 'no_profile'::text; RETURN;
  END IF;
  IF (v_daily + v_earned) < 1 THEN
    RETURN QUERY SELECT false, (v_daily + v_earned), 0::bigint, 'insufficient_credits'::text; RETURN;
  END IF;

  -- Déduction : daily d'abord, puis earned
  IF v_daily >= 1 THEN
    UPDATE profiles SET credits = credits - 1 WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET credits = 0, earned_credits = earned_credits - 1 WHERE id = p_user_id;
  END IF;

  -- Numéro de séquence (sous le verrou → pas de doublon)
  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq FROM clicks WHERE game_id = p_game_id;

  INSERT INTO clicks (game_id, user_id, username, item_name, is_bot, sequence_number, credits_spent)
  VALUES (p_game_id, p_user_id, p_username, p_item_name, false, v_seq, 1);

  -- Timer : si < 1m30 restant, reset à 90s + entrée en phase finale
  IF (v_end_time - v_now) <= 90000 THEN
    v_new_end := v_now + 90000;
    v_new_status := 'final_phase';
  ELSE
    v_new_end := v_end_time;
    v_new_status := v_status;
  END IF;

  UPDATE games SET
    last_click_user_id = p_user_id,
    last_click_username = p_username,
    last_click_at = now(),
    total_clicks = total_clicks + 1,
    end_time = v_new_end,
    status = v_new_status::game_status,
    battle_start_time = CASE
      WHEN v_new_status = 'final_phase' AND battle_start_time IS NULL THEN now()
      ELSE battle_start_time END
  WHERE id = p_game_id;

  UPDATE profiles SET total_clicks = total_clicks + 1 WHERE id = p_user_id;

  SELECT credits + earned_credits INTO v_daily FROM profiles WHERE id = p_user_id;
  RETURN QUERY SELECT true, v_daily, v_new_end, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
