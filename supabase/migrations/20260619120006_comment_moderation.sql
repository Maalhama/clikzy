-- ============================================================================
-- Audit 2026-06-19 (#3) : modération des commentaires (produit argent réel public).
-- - soft-delete admin (comments.deleted_at)
-- - signalement joueur (table comment_reports + RPC report_comment)
-- - blacklist serveur (liens/phishing + insultes) dans post_comment
-- - les commentaires supprimés sont exclus des lectures publiques
-- Idempotent.
-- ============================================================================

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ---------- Signalements ----------
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, reporter_id)
);
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
-- Aucune policy : lecture admin via service_role, écriture via RPC DEFINER ci-dessous.
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON public.comment_reports(comment_id);

CREATE OR REPLACE FUNCTION public.report_comment(p_comment_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  INSERT INTO public.comment_reports (comment_id, reporter_id, reason)
  VALUES (p_comment_id, v_uid, NULLIF(btrim(coalesce(p_reason, '')), ''))
  ON CONFLICT (comment_id, reporter_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION public.report_comment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_comment(uuid, text) TO authenticated;

-- ---------- post_comment + blacklist (liens/phishing + insultes graves) ----------
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

  -- Blacklist : liens (anti-spam / phishing sur un produit argent réel)
  IF v_clean ~* '(https?://|www\.|t\.me/|bit\.ly|\m\w+\.(com|fr|net|org|io|me|xyz)\M)' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_links');
  END IF;
  -- Blacklist : insultes graves (filtre basique, bornes de mots)
  IF v_clean ~* '\m(connard|conard|salope|salaud|encul\w*|fdp|ntm|nique ta|pd|negre|n[ée]gre|bougnoule|pute)\M' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'inappropriate');
  END IF;

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

-- ---------- get_recent_comments : exclure les commentaires supprimés ----------
CREATE OR REPLACE FUNCTION get_recent_comments(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID, username TEXT, content TEXT, created_at TIMESTAMPTZ,
  game_id UUID, item_name TEXT, item_image TEXT
) AS $$
  SELECT c.id, c.username, c.content, c.created_at, c.game_id, i.name, i.image_url
  FROM comments c
  JOIN games g ON g.id = c.game_id
  JOIN items i ON i.id = g.item_id
  WHERE c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
GRANT EXECUTE ON FUNCTION get_recent_comments(integer) TO anon, authenticated;
