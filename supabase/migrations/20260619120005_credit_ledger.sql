-- ============================================================================
-- Audit 2026-06-19 (#7) : relevé des mouvements de crédits côté joueur (transparence
-- « argent »). On trace UNIQUEMENT les earned_credits (crédits permanents = achats,
-- gains mini-jeux, parrainage, conversions de jauge) — PAS les crédits quotidiens
-- gratuits ni leur reset. Le débit d'un simple clic sur les crédits achetés (-1) est
-- ignoré pour ne pas exploser le volume (DB FREE). Trigger autonome (aucune RPC
-- money-path modifiée). Une RPC peut préciser la raison via set_config('app.ledger_reason').
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta         INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason        TEXT NOT NULL DEFAULT 'ajustement',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_ledger_own_read" ON public.credit_ledger;
CREATE POLICY "credit_ledger_own_read" ON public.credit_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON public.credit_ledger(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_credit_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_delta  INTEGER := COALESCE(NEW.earned_credits, 0) - COALESCE(OLD.earned_credits, 0);
  v_reason TEXT := NULLIF(current_setting('app.ledger_reason', true), '');
BEGIN
  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;
  -- Clic sur crédits achetés (-1) sans raison explicite : non tracé (volume).
  IF v_delta = -1 AND v_reason IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.credit_ledger (user_id, delta, balance_after, reason)
  VALUES (
    NEW.id,
    v_delta,
    COALESCE(NEW.earned_credits, 0),
    COALESCE(v_reason, CASE WHEN v_delta > 0 THEN 'credit' ELSE 'debit' END)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

DROP TRIGGER IF EXISTS trg_log_credit_movement ON public.profiles;
CREATE TRIGGER trg_log_credit_movement
  AFTER UPDATE OF earned_credits ON public.profiles
  FOR EACH ROW
  WHEN (COALESCE(OLD.earned_credits, 0) IS DISTINCT FROM COALESCE(NEW.earned_credits, 0))
  EXECUTE FUNCTION public.log_credit_movement();
