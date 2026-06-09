-- ============================================================
-- C5 — Idempotence des webhooks Stripe
-- ------------------------------------------------------------
-- Stripe livre les évènements "at-least-once" (retries sur timeout / non-2xx).
-- Le handler checkout.session.completed INCRÉMENTE les crédits => un même
-- paiement rejoué crédite plusieurs fois. On enregistre chaque event.id traité
-- avec succès (PK) ; un second passage du même id est ignoré.
--
-- Accès réservé au service_role (webhook). RLS activée sans policy => aucun
-- rôle PostgREST (authenticated/anon) ne peut lire/écrire la table.
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
