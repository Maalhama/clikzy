-- ============================================================
-- Feature JAUGE — passage au « CASH RÉEL PAYÉ » (au lieu d'un nombre de crédits).
-- Objectif : jauge pleine ⟺ l'user a réellement DÉBOURSÉ 2× la valeur de l'item,
-- en excluant les crédits gratuits (daily) ET les crédits earned non payés (badges,
-- mini-jeux, parrainage). Le x2 / le VIP -10% sont automatiquement pris en compte
-- car on enregistre le cash net réellement payé (Stripe amount_total).
--
-- Modèle : coût MOYEN pondéré. `profiles.purchased_value_cents` = cash (centimes)
-- restant attaché aux crédits earned détenus. Alimenté par add_purchased_value
-- (webhook Stripe, après grant). Chaque crédit earned dépensé (clic OU mini-jeu)
-- retire sa quote-part de cash ; la jauge avance de ce cash réel.
--
-- ⚠️ 100 % additif côté prod : le webhook prod (main) n'appelle PAS add_purchased_value
-- → purchased_value_cents reste 0 en prod → tous les décréments cash sont des no-op.
-- Aucun RPC critique existant n'est touché dans sa SIGNATURE (perform_click intact).
-- ============================================================

-- 1) Cost-basis cash sur le profil (additif)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS purchased_value_cents BIGINT NOT NULL DEFAULT 0;

-- 2) Protéger la colonne contre l'écriture client directe (on ré-applique le trigger
--    à l'identique + une ligne). DEFINER (postgres/service_role) reste autorisé.
CREATE OR REPLACE FUNCTION protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN RETURN NEW; END IF;
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.credits IS DISTINCT FROM OLD.credits
     OR NEW.earned_credits IS DISTINCT FROM OLD.earned_credits
     OR NEW.total_wins IS DISTINCT FROM OLD.total_wins
     OR NEW.total_clicks IS DISTINCT FROM OLD.total_clicks
     OR NEW.has_purchased_credits IS DISTINCT FROM OLD.has_purchased_credits
     OR NEW.is_vip IS DISTINCT FROM OLD.is_vip
     OR NEW.vip_expires_at IS DISTINCT FROM OLD.vip_expires_at
     OR NEW.referral_count IS DISTINCT FROM OLD.referral_count
     OR NEW.referral_credits_earned IS DISTINCT FROM OLD.referral_credits_earned
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.last_credits_reset IS DISTINCT FROM OLD.last_credits_reset
     OR NEW.last_vip_bonus_at IS DISTINCT FROM OLD.last_vip_bonus_at
     OR NEW.xp IS DISTINCT FROM OLD.xp
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.streak_count IS DISTINCT FROM OLD.streak_count
     OR NEW.streak_last_day IS DISTINCT FROM OLD.streak_last_day
     OR NEW.equip_bonus_pct IS DISTINCT FROM OLD.equip_bonus_pct
     OR NEW.equip_credit_bonus_pct IS DISTINCT FROM OLD.equip_credit_bonus_pct
     OR NEW.equip_daily_clicks IS DISTINCT FROM OLD.equip_daily_clicks
     OR NEW.equip_chest_luck IS DISTINCT FROM OLD.equip_chest_luck
     OR NEW.chest_last_claim_day IS DISTINCT FROM OLD.chest_last_claim_day
     OR NEW.fair_server_seed_hash IS DISTINCT FROM OLD.fair_server_seed_hash
     OR NEW.fair_nonce IS DISTINCT FROM OLD.fair_nonce
     OR NEW.purchased_value_cents IS DISTINCT FROM OLD.purchased_value_cents
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;

-- 3) add_purchased_value : enregistre le cash réellement payé (webhook après grant)
CREATE OR REPLACE FUNCTION public.add_purchased_value(p_user_id UUID, p_amount_cents INTEGER)
RETURNS void AS $$
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN RETURN; END IF;
  UPDATE public.profiles
    SET purchased_value_cents = purchased_value_cents + p_amount_cents
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION public.add_purchased_value(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_purchased_value(UUID, INTEGER) TO service_role;

-- 4) Reset des jauges existantes : l'ancienne version comptait des CRÉDITS, on passe en
--    CENTIMES. On repart de zéro (données d'exploration, aucune valeur réelle).
UPDATE public.user_item_gauges SET progress = 0, target = 0;

-- 5) increment_item_gauge → version CASH. Avance du coût réel (centimes) du crédit
--    payant dépensé. perform_click a déjà décrémenté earned_credits de 1 → on
--    reconstruit le coût moyen avant ce spend = value / (earned_actuel + 1).
DROP FUNCTION IF EXISTS public.increment_item_gauge(UUID, UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.increment_item_gauge(p_user_id UUID, p_item_id UUID)
RETURNS TABLE(out_progress INTEGER, out_target INTEGER, out_completed BOOLEAN, out_completed_count INTEGER) AS $$
DECLARE
  v_multiplier NUMERIC := 2;     -- jauge x2 de la VALEUR de l'item
  v_retail   NUMERIC;
  v_target   INTEGER;            -- cible en CENTIMES = valeur × mult × 100
  v_earned   INTEGER;
  v_value    BIGINT;             -- cost-basis cash restant (centimes)
  v_cost     INTEGER;            -- coût cash du crédit qui vient d'être dépensé
  v_progress INTEGER;
  v_completed BOOLEAN := false;
  v_count    INTEGER;
BEGIN
  SELECT retail_value INTO v_retail FROM public.items WHERE id = p_item_id;
  IF v_retail IS NULL THEN RETURN QUERY SELECT 0, 0, false, 0; RETURN; END IF;
  v_target := GREATEST(1, ROUND(v_retail * v_multiplier * 100))::INTEGER;

  SELECT earned_credits, purchased_value_cents INTO v_earned, v_value
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  -- Pas de cash dispo → crédit gratuit/non payé → la jauge n'avance pas.
  IF v_value IS NULL OR v_value <= 0 THEN
    SELECT progress, completed_count INTO v_progress, v_count
      FROM public.user_item_gauges WHERE user_id = p_user_id AND item_id = p_item_id;
    RETURN QUERY SELECT COALESCE(v_progress, 0), v_target, false, COALESCE(v_count, 0); RETURN;
  END IF;

  v_cost := LEAST(v_value, GREATEST(1, ROUND(v_value::numeric / (GREATEST(v_earned, 0) + 1))))::INTEGER;
  UPDATE public.profiles SET purchased_value_cents = purchased_value_cents - v_cost WHERE id = p_user_id;

  INSERT INTO public.user_item_gauges (user_id, item_id, progress, target, last_click_at, updated_at)
    VALUES (p_user_id, p_item_id, v_cost, v_target, now(), now())
  ON CONFLICT (user_id, item_id) DO UPDATE
    SET progress = public.user_item_gauges.progress + EXCLUDED.progress,
        target = v_target, last_click_at = now(), updated_at = now()
  RETURNING public.user_item_gauges.progress, public.user_item_gauges.completed_count
    INTO v_progress, v_count;

  IF v_progress >= v_target THEN
    v_completed := true;
    INSERT INTO public.gauge_wins (user_id, item_id, paid_credits) VALUES (p_user_id, p_item_id, v_target);
    UPDATE public.user_item_gauges
      SET progress = public.user_item_gauges.progress - v_target,
          completed_count = public.user_item_gauges.completed_count + 1, updated_at = now()
      WHERE user_id = p_user_id AND item_id = p_item_id
      RETURNING public.user_item_gauges.progress, public.user_item_gauges.completed_count
        INTO v_progress, v_count;
  END IF;

  RETURN QUERY SELECT v_progress, v_target, v_completed, v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION public.increment_item_gauge(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_item_gauge(UUID, UUID) TO service_role;

-- 6) deduct_credits : on garde la signature, on ajoute le retrait du cost-basis cash
--    au prorata des crédits PAYANTS dépensés (mini-jeux). No-op en prod (value=0).
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_daily INTEGER;
  current_earned INTEGER;
  remaining INTEGER;
  earned_spent INTEGER := 0;
  v_value BIGINT;
  v_dec BIGINT;
  new_total INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_amount < 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT credits, earned_credits, purchased_value_cents
    INTO current_daily, current_earned, v_value
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF (current_daily + current_earned) < p_amount THEN
    RETURN -1;
  END IF;

  remaining := p_amount;
  IF current_daily >= remaining THEN
    UPDATE profiles SET credits = credits - remaining WHERE id = p_user_id;
  ELSE
    earned_spent := remaining - current_daily;  -- part payée sur earned
    UPDATE profiles SET credits = 0, earned_credits = earned_credits - earned_spent
      WHERE id = p_user_id;
    -- retire la quote-part de cash des crédits payants dépensés
    IF current_earned > 0 AND earned_spent > 0 AND v_value > 0 THEN
      v_dec := LEAST(v_value, ROUND(v_value::numeric * earned_spent / current_earned))::bigint;
      UPDATE profiles SET purchased_value_cents = purchased_value_cents - v_dec
        WHERE id = p_user_id;
    END IF;
  END IF;

  SELECT credits + earned_credits INTO new_total FROM profiles WHERE id = p_user_id;
  RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
