-- ============================================================================
-- Lot G (confiance) : enchères « débutants ». Certaines parties d'une rotation
-- sont réservées aux joueurs SANS aucune victoire (profiles.total_wins = 0),
-- pour donner aux nouveaux une vraie première chance face aux habitués.
-- C'est une feature de CONFIANCE (réputation « pas que des pros ») ; pas de
-- hasard, pas de money-path -> aucun risque légal ajouté.
--
-- Enforcement : le gate (total_wins = 0) est appliqué côté action serveur
-- clickGame, seul point d'entrée du clic (perform_click est REVOKE de
-- authenticated et n'est appelé qu'en service_role depuis l'action — même
-- modèle que la garde d'auto-exclusion). Ici on n'ajoute que la colonne.
-- ============================================================================

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS beginners_only BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.games.beginners_only IS
  'Enchère réservée aux joueurs sans victoire (profiles.total_wins = 0). '
  'Gate appliqué côté action clickGame. Marqué à la création par create-rotation.';
