-- ============================================================
-- Coffre quotidien v2 : 3 coffres GRATUITS par jour (reset minuit Paris),
-- raretés aléatoires pondérées équitablement :
--   commun 60% · rare 25% · épique 11% · légendaire 4%
-- ============================================================

DROP FUNCTION IF EXISTS claim_daily_chest(uuid);
CREATE OR REPLACE FUNCTION claim_daily_chest(p_user_id UUID)
RETURNS TABLE(ok BOOLEAN, already BOOLEAN, granted INTEGER, rarities TEXT[]) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last DATE;
  v_rarity TEXT;
  v_rarities TEXT[] := '{}';
  v_roll DOUBLE PRECISION;
  i INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT chest_last_claim_day INTO v_last FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0, '{}'::text[]; RETURN;
  END IF;
  IF v_last = v_today THEN
    RETURN QUERY SELECT true, true, 0, '{}'::text[]; RETURN;
  END IF;

  UPDATE profiles SET chest_last_claim_day = v_today WHERE id = p_user_id;

  FOR i IN 1..3 LOOP
    v_roll := random();
    v_rarity := CASE
      WHEN v_roll < 0.60 THEN 'common'
      WHEN v_roll < 0.85 THEN 'rare'
      WHEN v_roll < 0.96 THEN 'epic'
      ELSE 'legendary'
    END;
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, v_rarity, 'daily');
    v_rarities := array_append(v_rarities, v_rarity);
  END LOOP;

  RETURN QUERY SELECT true, false, 3, v_rarities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_daily_chest(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_daily_chest(uuid) TO authenticated, service_role;
