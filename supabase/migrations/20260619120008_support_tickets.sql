-- ============================================================================
-- Audit 2026-06-19 (#8) : vrais tickets de support (le formulaire ouvrait un mailto,
-- aucune trace côté serveur). On stocke les demandes + on alerte l'équipe par email.
-- Écriture/lecture via service_role (action serveur) ; RLS activée sans policy.
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name       TEXT,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets(created_at DESC);
