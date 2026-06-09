-- ============================================================
-- Durcissement RLS : C1 (games UPDATE) + C2 (winners INSERT)
-- ------------------------------------------------------------
-- AVANT : tout utilisateur authentifié pouvait UPDATE n'importe quelle partie
-- (forcer un gagnant, prolonger/terminer une partie via la console) et INSERER
-- n'importe quel gagnant (victoires arbitraires). Vecteur d'exploit critique.
--
-- DÉSORMAIS :
--   - les écritures de parties passent EXCLUSIVEMENT par la RPC perform_click
--     (SECURITY DEFINER, bypass RLS) et le cron bot-clicks (service_role) ;
--   - les gagnants sont insérés UNIQUEMENT par le cron bot-clicks (service_role).
-- La Server Action endGame (qui écrivait côté client session) était du code mort
-- et a été supprimée de l'app.
--
-- On retire donc les policies permissives : plus aucune policy UPDATE sur games
-- ni INSERT sur winners pour le rôle `authenticated` => refus par défaut.
-- Le rôle `service_role` (crons) n'est jamais soumis à la RLS.
-- ============================================================

DROP POLICY IF EXISTS "Games can be updated by authenticated users" ON games;
DROP POLICY IF EXISTS "Winners can be inserted by authenticated" ON winners;
