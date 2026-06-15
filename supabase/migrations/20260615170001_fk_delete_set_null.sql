-- ============================================================================
-- RGPD : rendre la suppression de compte (deleteMyAccount) RÉELLEMENT possible.
-- 5 FK vers profiles(id) étaient en NO ACTION (bloquant) : supprimer un compte
-- d'un joueur actif (leader/gagnant d'une partie, clics, audit) échouait.
-- Toutes ces colonnes sont nullables -> ON DELETE SET NULL (on dé-identifie,
-- on ne casse pas l'historique de jeu). Les autres FK étaient déjà CASCADE/SET NULL.
-- ============================================================================

ALTER TABLE games DROP CONSTRAINT IF EXISTS games_last_click_user_id_fkey;
ALTER TABLE games ADD CONSTRAINT games_last_click_user_id_fkey
  FOREIGN KEY (last_click_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE games DROP CONSTRAINT IF EXISTS games_winner_id_fkey;
ALTER TABLE games ADD CONSTRAINT games_winner_id_fkey
  FOREIGN KEY (winner_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE clicks DROP CONSTRAINT IF EXISTS clicks_user_id_fkey;
ALTER TABLE clicks ADD CONSTRAINT clicks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE winners DROP CONSTRAINT IF EXISTS winners_user_id_fkey;
ALTER TABLE winners ADD CONSTRAINT winners_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE player_data_audit DROP CONSTRAINT IF EXISTS player_data_audit_user_id_fkey;
ALTER TABLE player_data_audit ADD CONSTRAINT player_data_audit_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
