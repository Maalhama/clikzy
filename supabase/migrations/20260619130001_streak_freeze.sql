-- ============================================================================
-- Lot F (rétention) #1 : streak freeze. Le joueur peut acheter des « gels » (crédits)
-- qui couvrent UN jour manqué pour ne pas perdre sa série. Données Duolingo : +48% de
-- durée de streak. Transforme le streak (qui punit à la cassure) en mécanique anti-churn.
-- Idempotent.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_freezes INTEGER NOT NULL DEFAULT 0;

-- Achat d'un gel (sink crédits permanents). Plafonné à 3 gels en réserve.
CREATE OR REPLACE FUNCTION buy_streak_freeze(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_cost CONSTANT INT := 100;
  v_max  CONSTANT INT := 3;
  v_earned INT;
  v_cur INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT earned_credits, COALESCE(streak_freezes, 0) INTO v_earned, v_cur FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_cur >= v_max THEN RETURN jsonb_build_object('ok', false, 'reason', 'max_freezes'); END IF;
  IF COALESCE(v_earned, 0) < v_cost THEN RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits'); END IF;
  UPDATE profiles
    SET earned_credits = earned_credits - v_cost,
        streak_freezes = COALESCE(streak_freezes, 0) + 1
    WHERE id = p_user_id;
  RETURN jsonb_build_object('ok', true, 'freezes', v_cur + 1, 'cost', v_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION buy_streak_freeze(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION buy_streak_freeze(uuid) TO authenticated;

-- claim_daily_login : si UN seul jour a été manqué et qu'un gel est disponible, on
-- consomme le gel et la série CONTINUE (au lieu de repartir à 1). Reste identique sinon.
CREATE OR REPLACE FUNCTION claim_daily_login(p_user_id UUID)
RETURNS TABLE(streak INTEGER, xp_gained INTEGER, credits_gained INTEGER, already BOOLEAN) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last DATE;
  v_streak INT;
  v_freezes INT;
  v_used_freeze BOOLEAN := false;
  v_xp CONSTANT INT := 20;
  v_credits INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT streak_last_day, streak_count, COALESCE(streak_freezes, 0)
    INTO v_last, v_streak, v_freezes
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_last = v_today THEN
    RETURN QUERY SELECT v_streak, 0, 0, true; RETURN;  -- déjà récupéré aujourd'hui
  END IF;

  IF v_last = v_today - 1 THEN
    v_streak := COALESCE(v_streak, 0) + 1;             -- série continue
  ELSIF v_last = v_today - 2 AND v_freezes > 0 THEN
    v_streak := COALESCE(v_streak, 0) + 1;             -- 1 jour manqué couvert par un gel
    v_used_freeze := true;
  ELSE
    v_streak := 1;                                     -- 1er jour / série rompue
  END IF;

  v_credits := LEAST(v_streak, 7) * 50;

  UPDATE profiles SET
    streak_count = v_streak,
    streak_last_day = v_today,
    streak_freezes = streak_freezes - (CASE WHEN v_used_freeze THEN 1 ELSE 0 END),
    earned_credits = earned_credits + v_credits,
    xp = xp + v_xp,
    level = xp_to_level(xp + v_xp)
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_streak, v_xp, v_credits, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_daily_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_daily_login(uuid) TO authenticated, service_role;
