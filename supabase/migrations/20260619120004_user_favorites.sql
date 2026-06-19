-- ============================================================================
-- Audit 2026-06-19 (#10) : les favoris vivaient uniquement en localStorage, donc le
-- serveur ne pouvait pas notifier « ton favori entre en phase finale ». On persiste
-- les favoris en base (par joueur connecté). RLS own-row. Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id    UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_own_select" ON public.user_favorites;
CREATE POLICY "favorites_own_select" ON public.user_favorites
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_own_insert" ON public.user_favorites;
CREATE POLICY "favorites_own_insert" ON public.user_favorites
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_own_delete" ON public.user_favorites;
CREATE POLICY "favorites_own_delete" ON public.user_favorites
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Lookup par partie (notif phase finale, service_role).
CREATE INDEX IF NOT EXISTS idx_user_favorites_game ON public.user_favorites(game_id);
