-- ============================================================
-- increment_total_wins : incrément ATOMIQUE de total_wins (donnée permanente)
-- Remplace le read-then-write du cron endGame (race possible). DEFINER (bypass le
-- trigger de protection des colonnes), réservé au service_role (cron).
-- ============================================================

CREATE OR REPLACE FUNCTION increment_total_wins(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE v_wins INTEGER;
BEGIN
  UPDATE profiles SET total_wins = total_wins + 1 WHERE id = p_user_id
  RETURNING total_wins INTO v_wins;
  RETURN v_wins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION increment_total_wins(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_total_wins(uuid) TO service_role;
