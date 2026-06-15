-- ============================================================================
-- DURCISSEMENT POST-AUDIT 2026-06-15 (batch 1, additif/sûr)
--   1) count_game_contenders : compteur de participants (perf preuve sociale)
--   2) storage avatars : owner-check (anti-griefing)
--   3) end_game : clôture atomique verrouillée (anti-TOCTOU, P1.6)
-- ============================================================================

-- ---------- 1) Preuve sociale : COUNT(DISTINCT) borné côté SQL ----------
-- Remplace le scan de 400 lignes × N spectateurs × /30s par un seul entier.
CREATE OR REPLACE FUNCTION count_game_contenders(p_game_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT COUNT(DISTINCT username)::INTEGER
  FROM clicks
  WHERE game_id = p_game_id
    AND username IS NOT NULL
    AND clicked_at > now() - interval '15 minutes';
$$;
REVOKE ALL ON FUNCTION count_game_contenders(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION count_game_contenders(UUID) TO anon, authenticated;

-- ---------- 2) Storage avatars : un user n'écrit que SES fichiers ----------
-- Chemin réel : avatars/<uid>-<timestamp>.<ext> (cf. actions/profile.ts).
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

CREATE POLICY "Avatar insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND name LIKE 'avatars/' || auth.uid()::text || '-%');
CREATE POLICY "Avatar update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profiles' AND name LIKE 'avatars/' || auth.uid()::text || '-%')
  WITH CHECK (bucket_id = 'profiles' AND name LIKE 'avatars/' || auth.uid()::text || '-%');
CREATE POLICY "Avatar delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profiles' AND name LIKE 'avatars/' || auth.uid()::text || '-%');
-- La policy SELECT publique ("Public read access") reste inchangée.

-- ---------- 3) Clôture de partie ATOMIQUE (anti-TOCTOU) ----------
-- Avant : le cron clôturait depuis un snapshot (pas de verrou, pas de revérif
-- end_time) -> à la dernière seconde, un perform_click concurrent qui ÉTEND
-- end_time pouvait quand même voir la partie close sur l'ancien leader.
-- Ici : SELECT ... FOR UPDATE + revérif end_time<=now SOUS le verrou (le même
-- que perform_click). Renvoie le gagnant autoritaire, ou closed=false.
CREATE OR REPLACE FUNCTION end_game(p_game_id UUID)
RETURNS TABLE(closed BOOLEAN, out_winner_id UUID, out_winner_username TEXT, out_is_bot BOOLEAN, out_item_id UUID, out_total_clicks INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE g games%ROWTYPE;
BEGIN
  SELECT * INTO g FROM games WHERE id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::BOOLEAN, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  IF g.status NOT IN ('active', 'final_phase')
     OR g.end_time > (extract(epoch FROM now()) * 1000)::BIGINT THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::BOOLEAN, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  UPDATE games SET status = 'ended', ended_at = now(), winner_id = g.last_click_user_id
   WHERE id = p_game_id;
  RETURN QUERY SELECT true, g.last_click_user_id, g.last_click_username,
                      (g.last_click_user_id IS NULL), g.item_id, g.total_clicks;
END;
$$;
REVOKE ALL ON FUNCTION end_game(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION end_game(UUID) TO service_role;
