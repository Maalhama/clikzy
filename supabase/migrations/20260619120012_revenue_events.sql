-- ============================================================================
-- Fix revue 2026-06-19 : revenu admin exact. computeRevenueEstimate sous-comptait
-- les rachats d'un même pack (PK pack_purchases user/month/pack = 1 ligne). On trace
-- désormais le MONTANT RÉELLEMENT ENCAISSÉ via Stripe à chaque checkout complété
-- (amount_total, VIP -10% inclus). Lecture admin via service_role uniquement.
-- Note : revenu BRUT (hors remboursements) des achats one-shot via Checkout, à partir
-- de l'activation de la table. Idempotent (session_id unique).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.revenue_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   TEXT UNIQUE,
  user_id      UUID,
  kind         TEXT NOT NULL DEFAULT 'pack',
  amount_cents INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_revenue_events_created ON public.revenue_events(created_at DESC);
