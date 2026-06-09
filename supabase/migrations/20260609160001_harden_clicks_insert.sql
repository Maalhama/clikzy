-- ============================================================
-- I8 — Clics : retirer le bypass "user_id IS NULL"
-- ------------------------------------------------------------
-- AVANT : WITH CHECK (user_id = auth.uid() OR user_id IS NULL)
-- => un joueur authentifié pouvait insérer des clics avec user_id NULL, c.-à-d.
--    fabriquer de FAUX clics de bot (username/item arbitraires) dans le feed live.
--
-- Les clics légitimes ne passent plus jamais par le client :
--   - clic joueur  -> RPC perform_click (SECURITY DEFINER, bypass RLS)
--   - clics bots   -> cron bot-clicks (service_role, bypass RLS)
-- On resserre donc la policy authenticated à "ses propres clics" (défense en
-- profondeur si un insert client était réintroduit un jour).
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert clicks" ON clicks;
DROP POLICY IF EXISTS "Authenticated users can insert own clicks" ON clicks;
CREATE POLICY "Authenticated users can insert own clicks"
  ON clicks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
