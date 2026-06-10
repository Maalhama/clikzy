-- ============================================================
-- GAMIFICATION — Classement par période (jour / semaine / mois / all-time)
-- Ledger xp_events alimenté AUTOMATIQUEMENT par un trigger sur profiles.xp
-- (capture tous les gains : clics, victoires, quêtes, coffres) -> zéro fonction
-- à re-toucher. All-time = profiles.xp (total) ; périodes = SUM sur le ledger.
-- ============================================================

CREATE TABLE IF NOT EXISTS xp_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_events_period ON xp_events(created_at);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id, created_at);
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
-- aucune policy -> uniquement service_role / fonctions DEFINER

-- Trigger : journalise chaque gain d'XP (delta positif)
CREATE OR REPLACE FUNCTION log_xp_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.xp IS DISTINCT FROM OLD.xp AND NEW.xp > OLD.xp THEN
    INSERT INTO xp_events(user_id, amount) VALUES (NEW.id, (NEW.xp - OLD.xp)::int);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
DROP TRIGGER IF EXISTS trg_log_xp ON profiles;
CREATE TRIGGER trg_log_xp AFTER UPDATE OF xp ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_xp_event();

-- get_leaderboard(période, limite)
DROP FUNCTION IF EXISTS get_leaderboard(integer);
CREATE OR REPLACE FUNCTION get_leaderboard(p_period TEXT DEFAULT 'all', p_limit INTEGER DEFAULT 50)
RETURNS TABLE(rank BIGINT, user_id UUID, username TEXT, avatar_url TEXT, level INTEGER, xp BIGINT, total_wins INTEGER) AS $$
DECLARE v_start TIMESTAMPTZ;
BEGIN
  IF p_period = 'all' OR p_period IS NULL THEN
    RETURN QUERY
    SELECT ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.total_wins DESC, p.created_at ASC),
      p.id, p.username, p.avatar_url, p.level, p.xp, p.total_wins
    FROM profiles p
    ORDER BY p.xp DESC, p.total_wins DESC, p.created_at ASC
    LIMIT GREATEST(1, LEAST(p_limit, 200));
    RETURN;
  END IF;

  v_start := CASE p_period
    WHEN 'day'   THEN date_trunc('day',   now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
    WHEN 'week'  THEN date_trunc('week',  now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
    WHEN 'month' THEN date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
    ELSE now() - INTERVAL '1000 years'
  END;

  RETURN QUERY
  WITH agg AS (
    SELECT e.user_id AS uid, SUM(e.amount)::bigint AS pxp
    FROM xp_events e WHERE e.created_at >= v_start GROUP BY e.user_id
  )
  SELECT ROW_NUMBER() OVER (ORDER BY a.pxp DESC, p.total_wins DESC),
    p.id, p.username, p.avatar_url, p.level, a.pxp, p.total_wins
  FROM agg a JOIN profiles p ON p.id = a.uid
  ORDER BY a.pxp DESC, p.total_wins DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_leaderboard(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_leaderboard(text, integer) TO anon, authenticated, service_role;

-- get_my_rank(période)
DROP FUNCTION IF EXISTS get_my_rank();
CREATE OR REPLACE FUNCTION get_my_rank(p_period TEXT DEFAULT 'all')
RETURNS TABLE(my_rank BIGINT, total_players BIGINT) AS $$
DECLARE v_user UUID := auth.uid(); v_start TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;

  IF p_period = 'all' OR p_period IS NULL THEN
    RETURN QUERY
    WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY xp DESC, total_wins DESC, created_at ASC) AS r FROM profiles)
    SELECT (SELECT r FROM ranked WHERE id = v_user), (SELECT COUNT(*) FROM profiles);
    RETURN;
  END IF;

  v_start := CASE p_period
    WHEN 'day'   THEN date_trunc('day',   now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
    WHEN 'week'  THEN date_trunc('week',  now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
    WHEN 'month' THEN date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
    ELSE now() - INTERVAL '1000 years'
  END;

  RETURN QUERY
  WITH agg AS (
    SELECT e.user_id AS uid, SUM(e.amount)::bigint AS pxp
    FROM xp_events e WHERE e.created_at >= v_start GROUP BY e.user_id
  ), ranked AS (
    SELECT uid, ROW_NUMBER() OVER (ORDER BY pxp DESC) AS r FROM agg
  )
  SELECT (SELECT r FROM ranked WHERE uid = v_user), (SELECT COUNT(*) FROM agg);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_my_rank(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_rank(text) TO authenticated, service_role;
