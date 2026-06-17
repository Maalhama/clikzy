-- ============================================================
-- FIX P0 (audit 2026-06-16, run de complétion) : la migration 120004 restituait DEUX fois
-- la même valeur lors de la conversion d'une jauge abandonnée :
--   (a) earned_credits += FLOOR(progress/16)  (crédits dépensables)  ET
--   (b) purchased_value_cents += progress      (restauration du cost-basis cash)
-- Or cette progression a DÉJÀ été payée (earned_credits −1/clic + cost-basis vidé). Restituer
-- les deux = double-création de valeur -> recyclage à l'infini (buy → clic → abandon → ~tout
-- récupéré gratuitement, items physiques gagnables sans payer).
--
-- Correctif : UNE seule restitution. On rend la valeur en CRÉDITS dépensables (l'« avoir »,
-- cohérent avec « rien n'est perdu ») et on NE restaure PAS le cost-basis. Conséquence voulue :
-- ces crédits d'avoir ne re-remplissent pas une jauge (cost-basis nul -> increment_item_gauge
-- n'avance pas), donc impossible de re-gagner un item gratuitement. Borné, non recyclable.
-- ============================================================
CREATE OR REPLACE FUNCTION public.convert_abandoned_gauges(p_days INTEGER DEFAULT 90)
RETURNS TABLE(out_converted INTEGER, out_total_credits INTEGER) AS $$
DECLARE
  v_days        INTEGER := GREATEST(1, COALESCE(p_days, 90));
  v_cents_per_credit CONSTANT NUMERIC := 16;  -- réf Boost 7,99€/50
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
    v_credits := GREATEST(1, FLOOR(r.progress / v_cents_per_credit))::INTEGER;

    -- UNE seule restitution : crédits d'avoir. PAS de restauration du cost-basis
    -- (sinon double-création de valeur -> exploit de recyclage).
    UPDATE public.profiles
      SET earned_credits = earned_credits + v_credits
      WHERE id = r.user_id;

    INSERT INTO public.gauge_credit_refunds (user_id, item_id, credits, reason)
      VALUES (r.user_id, r.item_id, v_credits, 'abandon_' || v_days || 'j');

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
