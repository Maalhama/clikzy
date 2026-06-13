-- ============================================================
-- COMMENTAIRES 2026-06 — chat par partie + feed global lobby
-- Seuls les joueurs ayant cliqué >= 1 fois dans la partie peuvent commenter.
-- Lecture publique (game page + feed lobby anon/connecté).
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_game ON comments(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_recent ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- Lecture publique (le feed et la game page sont visibles par tous)
DROP POLICY IF EXISTS "Comments readable by all" ON comments;
CREATE POLICY "Comments readable by all" ON comments FOR SELECT USING (true);
-- Aucune policy INSERT : l'écriture passe par post_comment (DEFINER) qui valide la participation.

-- ---------- Poster un commentaire (authenticated, doit avoir joué la partie) ----------
CREATE OR REPLACE FUNCTION post_comment(p_game_id UUID, p_content TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_username TEXT;
  v_clicks INTEGER;
  v_clean TEXT;
  v_id UUID;
  v_at TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;

  v_clean := btrim(coalesce(p_content, ''));
  IF v_clean = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'empty'); END IF;
  IF length(v_clean) > 280 THEN v_clean := left(v_clean, 280); END IF;

  -- Participation : au moins un clic du joueur dans cette partie
  SELECT count(*) INTO v_clicks FROM clicks WHERE game_id = p_game_id AND user_id = v_uid;
  IF v_clicks < 1 THEN RETURN jsonb_build_object('ok', false, 'error', 'must_play_first'); END IF;

  -- Anti-spam : 1 commentaire / 15s / partie
  IF EXISTS (
    SELECT 1 FROM comments
    WHERE game_id = p_game_id AND user_id = v_uid AND created_at > now() - interval '15 seconds'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_fast');
  END IF;

  SELECT username INTO v_username FROM profiles WHERE id = v_uid;
  INSERT INTO comments (game_id, user_id, username, content)
  VALUES (p_game_id, v_uid, COALESCE(v_username, 'Joueur'), v_clean)
  RETURNING id, created_at INTO v_id, v_at;

  RETURN jsonb_build_object(
    'ok', true, 'id', v_id, 'username', COALESCE(v_username, 'Joueur'),
    'content', v_clean, 'created_at', v_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION post_comment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION post_comment(uuid, text) TO authenticated;

-- ---------- Le joueur peut-il commenter cette partie ? (a-t-il cliqué ?) ----------
CREATE OR REPLACE FUNCTION can_comment(p_game_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clicks WHERE game_id = p_game_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
GRANT EXECUTE ON FUNCTION can_comment(uuid) TO authenticated;

-- ---------- Feed global pour le lobby : qui a dit quoi sous quel item ----------
CREATE OR REPLACE FUNCTION get_recent_comments(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID, username TEXT, content TEXT, created_at TIMESTAMPTZ,
  game_id UUID, item_name TEXT, item_image TEXT
) AS $$
  SELECT c.id, c.username, c.content, c.created_at, c.game_id, i.name, i.image_url
  FROM comments c
  JOIN games g ON g.id = c.game_id
  JOIN items i ON i.id = g.item_id
  ORDER BY c.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
GRANT EXECUTE ON FUNCTION get_recent_comments(integer) TO anon, authenticated;
