-- ============================================================
-- ÉCONOMIE PHASE 2 (suite) — calendrier des récompenses : crédits gratuits réduits.
-- Avant : 2 jours/5 donnaient des crédits (1 et 2). Après : 1 jour/5 (1 crédit),
-- l'autre devient de l'XP. Le Passe d'Arène (25 cr/mois) est LAISSÉ : c'est un
-- produit PAYANT, réduire sa récompense le dévaloriserait sans rendre les
-- crédits GRATUITS plus rares.
-- ============================================================

CREATE OR REPLACE FUNCTION calendar_reward(p_day DATE)
RETURNS TABLE(kind TEXT, amount INTEGER, rarity TEXT) AS $$
DECLARE
  v_dow INT := EXTRACT(ISODOW FROM p_day)::int;          -- 1=lundi .. 6=samedi, 7=dimanche
  v_n INT := EXTRACT(DAY FROM p_day)::int;
  v_sat_rank INT := ((EXTRACT(DAY FROM p_day)::int - 1) / 7) + 1;
  v_last DATE := (date_trunc('month', p_day) + interval '1 month - 1 day')::date;
  v_boost INT := CASE WHEN v_n >= 25 THEN 2 ELSE 1 END;  -- fin de mois : XP doublée
BEGIN
  IF v_dow = 6 THEN
    RETURN QUERY SELECT 'chest'::text, 1,
      CASE v_sat_rank WHEN 1 THEN 'common' WHEN 2 THEN 'rare' WHEN 3 THEN 'epic' ELSE 'legendary' END;
  ELSIF p_day = v_last THEN
    RETURN QUERY SELECT 'chest'::text, 1, 'rare'::text;
  ELSE
    CASE v_n % 5
      WHEN 1 THEN RETURN QUERY SELECT 'xp'::text, 25 * v_boost, NULL::text;
      WHEN 2 THEN RETURN QUERY SELECT 'xp'::text, 40 * v_boost, NULL::text;
      WHEN 3 THEN RETURN QUERY SELECT 'xp'::text, 30 * v_boost, NULL::text;  -- Phase 2 : était 1 crédit -> XP
      WHEN 4 THEN RETURN QUERY SELECT 'xp'::text, 60 * v_boost, NULL::text;
      ELSE        RETURN QUERY SELECT 'credits'::text, 1, NULL::text;        -- Phase 2 : était 2
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
