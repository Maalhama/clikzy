-- ============================================================
-- GAMIFICATION Phase 2 — Classement mondial (par XP/progression)
-- Lecture seule. N'expose que des colonnes publiques (username/avatar/level/xp/wins).
-- ============================================================

-- Top N joueurs (all-time) par XP puis victoires.
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE(rank BIGINT, user_id UUID, username TEXT, avatar_url TEXT, level INTEGER, xp BIGINT, total_wins INTEGER) AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.total_wins DESC, p.created_at ASC) AS rank,
    p.id, p.username, p.avatar_url, p.level, p.xp, p.total_wins
  FROM profiles p
  ORDER BY p.xp DESC, p.total_wins DESC, p.created_at ASC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_leaderboard(integer) TO anon, authenticated, service_role;

-- Rang du joueur courant + nombre total de joueurs ("Tu es Xe sur N").
CREATE OR REPLACE FUNCTION get_my_rank()
RETURNS TABLE(my_rank BIGINT, total_players BIGINT) AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY xp DESC, total_wins DESC, created_at ASC) AS r FROM profiles
  )
  SELECT (SELECT r FROM ranked WHERE id = v_user), (SELECT COUNT(*) FROM profiles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_my_rank() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_rank() TO authenticated, service_role;

-- Index pour le classement (tri par xp desc)
CREATE INDEX IF NOT EXISTS idx_profiles_xp_rank ON profiles(xp DESC, total_wins DESC);
