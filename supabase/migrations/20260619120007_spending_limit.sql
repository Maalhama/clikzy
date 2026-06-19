-- ============================================================================
-- Audit 2026-06-19 (#5) : jeu responsable — auto-limitation de dépense.
-- Le joueur fixe une limite mensuelle d'achat de crédits (en euros). NULL = aucune.
-- Baisse/suppression immédiate ; hausse soumise à un cooldown (anti-contournement
-- impulsif), géré côté action via monthly_purchase_limit_updated_at. Idempotent.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_purchase_limit INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_purchase_limit_updated_at TIMESTAMPTZ;
