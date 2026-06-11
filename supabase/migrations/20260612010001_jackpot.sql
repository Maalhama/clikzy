-- ============================================================
-- JACKPOT COMMUNAUTAIRE : cagnotte de crédits qui grossit chaque jour et
-- est distribuée le 8 de chaque mois à un joueur actif tiré au sort.
-- Affichée sur le hero de la LP. Événement mensuel (1 gagnant) → impact
-- économie maîtrisé.
-- ============================================================

CREATE TABLE IF NOT EXISTS jackpot (
  id INTEGER PRIMARY KEY DEFAULT 1,
  amount INTEGER NOT NULL DEFAULT 500,
  last_distributed_month TEXT,        -- 'YYYY-MM' (Europe/Paris)
  last_winner_username TEXT,
  last_winner_amount INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jackpot_singleton CHECK (id = 1)
);
INSERT INTO jackpot (id, amount) VALUES (1, 500) ON CONFLICT (id) DO NOTHING;

ALTER TABLE jackpot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Jackpot public read" ON jackpot;
CREATE POLICY "Jackpot public read" ON jackpot FOR SELECT TO anon, authenticated USING (true);

-- Croissance quotidienne (appelée par le cron reset-credits)
CREATE OR REPLACE FUNCTION grow_jackpot(p_amount INTEGER DEFAULT 30)
RETURNS void AS $$
  UPDATE jackpot SET amount = amount + GREATEST(0, p_amount), updated_at = now() WHERE id = 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION grow_jackpot(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION grow_jackpot(integer) TO service_role;

-- Distribution mensuelle : le 8, si pas déjà fait ce mois, tire un gagnant
-- parmi les joueurs ayant cliqué (total_clicks > 0), le crédite, reset le pot.
CREATE OR REPLACE FUNCTION distribute_jackpot()
RETURNS TABLE(distributed BOOLEAN, winner TEXT, won INTEGER) AS $$
DECLARE
  v_month TEXT := to_char((now() AT TIME ZONE 'Europe/Paris'), 'YYYY-MM');
  v_day INTEGER := EXTRACT(DAY FROM (now() AT TIME ZONE 'Europe/Paris'))::int;
  v_pot INTEGER;
  v_done TEXT;
  v_winner_id UUID;
  v_winner_name TEXT;
BEGIN
  SELECT amount, last_distributed_month INTO v_pot, v_done FROM jackpot WHERE id = 1;
  IF v_day <> 8 OR v_done = v_month THEN
    RETURN QUERY SELECT false, NULL::text, 0; RETURN;
  END IF;

  -- Gagnant : un joueur actif au hasard (a déjà cliqué)
  SELECT id, username INTO v_winner_id, v_winner_name
  FROM profiles WHERE COALESCE(total_clicks, 0) > 0
  ORDER BY random() LIMIT 1;

  IF v_winner_id IS NULL THEN
    -- personne d'éligible : on marque le mois pour ne pas boucler, sans distribuer
    UPDATE jackpot SET last_distributed_month = v_month WHERE id = 1;
    RETURN QUERY SELECT false, NULL::text, 0; RETURN;
  END IF;

  UPDATE profiles SET earned_credits = earned_credits + v_pot WHERE id = v_winner_id;
  UPDATE jackpot SET
    amount = 500,                                  -- reset à la base
    last_distributed_month = v_month,
    last_winner_username = v_winner_name,
    last_winner_amount = v_pot,
    updated_at = now()
  WHERE id = 1;

  RETURN QUERY SELECT true, v_winner_name, v_pot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION distribute_jackpot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION distribute_jackpot() TO service_role;
