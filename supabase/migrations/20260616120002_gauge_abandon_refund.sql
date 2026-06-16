-- ============================================================
-- Feature JAUGE — avoir crédit sur abandon (90 j d'inactivité).
-- Principe « rien n'est jamais perdu » : si l'user arrête de cliquer sur une jauge,
-- au bout de GAUGE_ABANDON_DAYS jours sans clic, sa progression (crédits accumulés)
-- est convertie en AVOIR CRÉDIT PERMANENT (profiles.earned_credits) — réutilisable
-- sur n'importe quel item. Le compteur part de la DERNIÈRE activité sur la jauge
-- (user_item_gauges.last_click_at), pas de l'inscription.
--
-- Appelé par le cron /api/cron/convert-abandoned-gauges (service_role).
-- earned_credits est protégé par le trigger protect_profile_sensitive_columns,
-- mais une fonction SECURITY DEFINER (owner = postgres) n'est jamais
-- 'authenticated'/'anon' → le trigger la laisse écrire (cf. harden_profiles_c3).
-- ============================================================

-- 1) Journal des avoirs (transparence / preuve « rien n'est perdu », jamais purgé)
CREATE TABLE IF NOT EXISTS public.gauge_credit_refunds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES public.items(id),
  credits     INTEGER NOT NULL,                 -- progression convertie en avoir
  reason      TEXT NOT NULL DEFAULT 'abandon_90j',
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gauge_credit_refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gauge_refunds_owner_read" ON public.gauge_credit_refunds;
CREATE POLICY "gauge_refunds_owner_read" ON public.gauge_credit_refunds
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_gauge_refunds_user ON public.gauge_credit_refunds(user_id);

-- 2) Conversion des jauges abandonnées en avoir — RÉSERVÉ service_role.
--    Idempotente par nature : on ne traite que les jauges progress>0 ET inactives ;
--    après conversion progress=0, donc un 2e passage ne les reprend pas.
CREATE OR REPLACE FUNCTION public.convert_abandoned_gauges(p_days INTEGER DEFAULT 90)
RETURNS TABLE(out_converted INTEGER, out_total_credits INTEGER) AS $$
DECLARE
  v_days      INTEGER := GREATEST(1, COALESCE(p_days, 90));
  v_converted INTEGER := 0;
  v_total     INTEGER := 0;
  r           RECORD;
BEGIN
  FOR r IN
    SELECT user_id, item_id, progress
    FROM public.user_item_gauges
    WHERE progress > 0
      AND last_click_at < now() - make_interval(days => v_days)
    FOR UPDATE
  LOOP
    -- a) créditer l'avoir PERMANENT (earned_credits, jamais reset)
    UPDATE public.profiles
      SET earned_credits = earned_credits + r.progress
      WHERE id = r.user_id;

    -- b) tracer l'avoir (preuve que rien n'est perdu)
    INSERT INTO public.gauge_credit_refunds (user_id, item_id, credits, reason)
      VALUES (r.user_id, r.item_id, r.progress, 'abandon_' || v_days || 'j');

    -- c) remettre la jauge à zéro (progression CONVERTIE, pas effacée)
    UPDATE public.user_item_gauges
      SET progress = 0, updated_at = now()
      WHERE user_id = r.user_id AND item_id = r.item_id;

    v_converted := v_converted + 1;
    v_total     := v_total + r.progress;
  END LOOP;

  RETURN QUERY SELECT v_converted, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.convert_abandoned_gauges(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_abandoned_gauges(INTEGER) TO service_role;
