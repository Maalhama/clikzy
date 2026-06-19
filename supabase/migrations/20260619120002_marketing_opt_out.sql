-- ============================================================================
-- Audit 2026-06-19 (P1) : les emails de retention (rappel de serie / streak) etaient
-- envoyes sans aucun moyen de se desabonner. Ajout d'un opt-out par profil.
-- L'email transactionnel (gain, expedition, echec paiement) n'est PAS concerne.
-- Idempotent. Defaut = false (tout le monde recoit, jusqu'a desabonnement explicite).
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_out boolean NOT NULL DEFAULT false;
