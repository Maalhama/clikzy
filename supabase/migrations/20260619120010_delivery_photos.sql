-- ============================================================================
-- Audit 2026-06-19 (#10) : galerie « preuve de livraison ». Le gagnant peut joindre
-- une photo du colis reçu ; elle n'apparaît publiquement (/gagnants) qu'APRÈS
-- approbation admin (contenu public modéré). Idempotent.
-- ============================================================================

ALTER TABLE public.winners
  ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_photo_approved BOOLEAN NOT NULL DEFAULT false;
