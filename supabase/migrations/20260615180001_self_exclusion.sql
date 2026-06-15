-- ============================================================================
-- Jeu responsable : auto-exclusion réelle (le joueur met son compte en pause).
-- Table séparée : le joueur LIT sa pause mais ne peut ni la raccourcir ni la
-- lever (pas de policy UPDATE/DELETE = default-deny). Pose/prolongation via RPC.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_self_exclusion (
  user_id        UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  excluded_until TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_self_exclusion ENABLE ROW LEVEL SECURITY;

-- Lecture de SA propre exclusion uniquement. Aucune policy INSERT/UPDATE/DELETE
-- => le joueur ne peut pas contourner sa pause (tout passe par la RPC DEFINER).
CREATE POLICY "read own self exclusion" ON user_self_exclusion
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Pose ou PROLONGE l'auto-exclusion (jamais raccourcir : GREATEST).
CREATE OR REPLACE FUNCTION set_self_exclusion(p_days INTEGER)
RETURNS TIMESTAMPTZ AS $$
DECLARE v_user UUID := auth.uid(); v_until TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_days < 1 OR p_days > 3650 THEN RAISE EXCEPTION 'invalid_duration'; END IF;
  v_until := now() + make_interval(days => p_days);
  INSERT INTO user_self_exclusion (user_id, excluded_until)
  VALUES (v_user, v_until)
  ON CONFLICT (user_id)
    DO UPDATE SET excluded_until = GREATEST(user_self_exclusion.excluded_until, EXCLUDED.excluded_until);
  SELECT excluded_until INTO v_until FROM user_self_exclusion WHERE user_id = v_user;
  RETURN v_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION set_self_exclusion(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_self_exclusion(integer) TO authenticated;
