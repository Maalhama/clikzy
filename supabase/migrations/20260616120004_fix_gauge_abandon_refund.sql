-- ============================================================
-- FIX P0 (audit 2026-06-16) : convert_abandoned_gauges traitait user_item_gauges.progress
-- (passé en CENTIMES de cash réel par 20260616120003) comme un NOMBRE DE CRÉDITS, et faisait
-- `earned_credits += progress` -> auto-mint de crédits permanents x16 à x100.
--
-- Correctif : on convertit les centimes de progression en CRÉDITS au tarif de référence
-- (16 cts/crédit = pack Boost 7,99€/50), et on RESTAURE le cost-basis cash (purchased_value_cents)
-- pour que l'avoir reste ré-utilisable sur une autre jauge sans rien minter (le cash rendu
-- redevient dépensable, et chaque crédit rendu vaut ~16 cts -> conservation de valeur).
-- gauge_credit_refunds.credits stocke désormais des CRÉDITS (pas des centimes).
-- ============================================================

CREATE OR REPLACE FUNCTION public.convert_abandoned_gauges(p_days INTEGER DEFAULT 90)
RETURNS TABLE(out_converted INTEGER, out_total_credits INTEGER) AS $$
DECLARE
  v_days        INTEGER := GREATEST(1, COALESCE(p_days, 90));
  -- Tarif de référence d'un crédit (centimes). Aligné sur le pack de base (Boost = 7,99€/50 = 16 cts).
  -- Choix conservateur (le crédit le plus cher) -> ne sur-rend jamais de crédits.
  v_cents_per_credit CONSTANT NUMERIC := 16;
  v_converted   INTEGER := 0;
  v_total       INTEGER := 0;
  v_credits     INTEGER;
  r             RECORD;
BEGIN
  FOR r IN
    SELECT user_id, item_id, progress
    FROM public.user_item_gauges
    WHERE progress > 0
      AND last_click_at < now() - make_interval(days => v_days)
    FOR UPDATE
  LOOP
    -- centimes -> crédits (au moins 1 si progress>0)
    v_credits := GREATEST(1, FLOOR(r.progress / v_cents_per_credit))::INTEGER;

    -- a) avoir en crédits permanents + restauration du cost-basis cash (ré-utilisable sur une autre jauge)
    UPDATE public.profiles
      SET earned_credits         = earned_credits + v_credits,
          purchased_value_cents  = purchased_value_cents + r.progress
      WHERE id = r.user_id;

    -- b) trace l'avoir EN CRÉDITS (plus en centimes)
    INSERT INTO public.gauge_credit_refunds (user_id, item_id, credits, reason)
      VALUES (r.user_id, r.item_id, v_credits, 'abandon_' || v_days || 'j');

    -- c) remet la jauge à zéro (progression convertie, pas perdue)
    UPDATE public.user_item_gauges
      SET progress = 0, updated_at = now()
      WHERE user_id = r.user_id AND item_id = r.item_id;

    v_converted := v_converted + 1;
    v_total     := v_total + v_credits;
  END LOOP;

  RETURN QUERY SELECT v_converted, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.convert_abandoned_gauges(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_abandoned_gauges(INTEGER) TO service_role;
