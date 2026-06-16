-- ============================================================
-- FIX P1 (audit 2026-06-16) : perform_click était GRANT EXECUTE à `authenticated`, donc
-- appelable EN DIRECT par tout client via supabase.rpc('perform_click', ...) -> contournement
-- total de checkClickFraud (détection de fraude au clic, en mémoire dans la server action)
-- et de la garde d'auto-exclusion. Un bot pouvait cliquer à vitesse machine sans alerte.
--
-- Correctif : seul service_role peut désormais exécuter perform_click. La server action
-- clickGame l'appelle via createServiceClient() APRÈS checkClickFraud + self-exclusion, donc
-- le clic passe obligatoirement par ces contrôles. perform_click reste SECURITY DEFINER et
-- la garde `auth.uid() <> p_user_id` interne reste valable (service_role => auth.uid() NULL,
-- p_user_id = l'utilisateur validé par la server action).
--
-- ⚠️ À APPLIQUER APRÈS le déploiement du code clickGame (service_role) — sinon l'ancien code
-- (client authentifié) casse le clic en prod pendant la fenêtre de déploiement.
-- Les bots (cron bot-clicks) n'appellent PAS perform_click -> non impactés.
-- ============================================================
REVOKE EXECUTE ON FUNCTION perform_click(uuid, uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION perform_click(uuid, uuid, text, text) TO service_role;
