-- ============================================================
-- CALENDRIER DE RÉCOMPENSES MENSUEL
-- ------------------------------------------------------------
-- Une récompense par jour (réclamable LE jour même, fuseau Europe/Paris,
-- pas de rattrapage). Déterministe par date — cohérent quel que soit le mois :
--   - SAMEDIS = coffres par rang dans le mois : 1er=commun, 2e=rare,
--     3e=épique, 4e (et 5e)=légendaire
--   - Dernier jour du mois = coffre rare
--   - Autres jours : XP (25/40/60, doublée à partir du 25) ou crédits
--     symboliques (1-2) — l'économie reste portée par les packs
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_claims (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
ALTER TABLE calendar_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own calendar claims readable" ON calendar_claims;
CREATE POLICY "Own calendar claims readable" ON calendar_claims
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- aucune policy INSERT : écriture via claim_calendar_day (DEFINER) uniquement

-- ---------- Récompense déterministe d'une date ----------
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
      WHEN 3 THEN RETURN QUERY SELECT 'credits'::text, 1, NULL::text;
      WHEN 4 THEN RETURN QUERY SELECT 'xp'::text, 60 * v_boost, NULL::text;
      ELSE        RETURN QUERY SELECT 'credits'::text, 2, NULL::text;
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------- Le mois courant d'un joueur (jours + état) ----------
CREATE OR REPLACE FUNCTION get_calendar_month(p_user_id UUID)
RETURNS TABLE(day DATE, kind TEXT, amount INTEGER, rarity TEXT, claimed BOOLEAN, claimable BOOLEAN) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_start DATE := date_trunc('month', v_today)::date;
  v_end DATE := (date_trunc('month', v_today) + interval '1 month - 1 day')::date;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT d::date,
         r.kind, r.amount, r.rarity,
         (c.user_id IS NOT NULL) AS claimed,
         (d::date = v_today AND c.user_id IS NULL) AS claimable
  FROM generate_series(v_start, v_end, interval '1 day') AS d
  CROSS JOIN LATERAL calendar_reward(d::date) r
  LEFT JOIN calendar_claims c ON c.user_id = p_user_id AND c.day = d::date
  ORDER BY d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_calendar_month(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_calendar_month(uuid) TO authenticated, service_role;

-- ---------- Claim du jour courant (idempotent, self-guard) ----------
CREATE OR REPLACE FUNCTION claim_calendar_day(p_user_id UUID)
RETURNS TABLE(ok BOOLEAN, already BOOLEAN, kind TEXT, amount INTEGER, rarity TEXT, chest_id UUID) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_r RECORD;
  v_chest UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_r FROM calendar_reward(v_today);

  BEGIN
    INSERT INTO calendar_claims(user_id, day) VALUES (p_user_id, v_today);
  EXCEPTION WHEN unique_violation THEN
    RETURN QUERY SELECT true, true, v_r.kind, v_r.amount, v_r.rarity, NULL::uuid; RETURN;
  END;

  IF v_r.kind = 'chest' THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, v_r.rarity, 'calendar')
    RETURNING id INTO v_chest;
  ELSIF v_r.kind = 'credits' THEN
    UPDATE profiles SET earned_credits = earned_credits + v_r.amount WHERE id = p_user_id;
  ELSIF v_r.kind = 'xp' THEN
    UPDATE profiles SET xp = xp + v_r.amount, level = xp_to_level(xp + v_r.amount) WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT true, false, v_r.kind, v_r.amount, v_r.rarity, v_chest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_calendar_day(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_calendar_day(uuid) TO authenticated, service_role;
