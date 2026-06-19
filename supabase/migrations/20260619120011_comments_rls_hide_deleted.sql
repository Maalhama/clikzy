-- ============================================================================
-- Fix revue 2026-06-19 : la modération des commentaires (soft-delete deleted_at)
-- n'était appliquée qu'en lecture applicative. La policy SELECT publique restait
-- USING (true) -> un client anon pouvait lire les commentaires supprimés via l'API
-- REST. On durcit la policy pour masquer les supprimés à TOUS les clients ; la
-- modération admin lit via service_role (bypass RLS). Idempotent.
-- ============================================================================

DROP POLICY IF EXISTS "Comments readable by all" ON public.comments;
CREATE POLICY "Comments readable by all" ON public.comments
  FOR SELECT USING (deleted_at IS NULL);
