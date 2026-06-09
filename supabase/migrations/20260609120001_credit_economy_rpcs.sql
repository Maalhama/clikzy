-- ============================================================
-- Économie de crédits : RPC atomiques + alignées sur minuit Paris
-- Corrige : I1 (refund qui gonflait total_clicks), I2 (bonus VIP partageant
-- last_credits_reset), I3 (minuit UTC vs Paris), I4 (double-reset client/cron).
-- Toutes les RPC sont SECURITY DEFINER (prérequis du durcissement RLS profiles).
-- ============================================================

-- I2 : colonne dédiée au bonus VIP (séparée de last_credits_reset)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_vip_bonus_at TIMESTAMPTZ;

-- Source unique de vérité pour "minuit Paris" : instant UTC du dernier minuit Europe/Paris
CREATE OR REPLACE FUNCTION paris_midnight()
RETURNS TIMESTAMPTZ AS $$
  SELECT date_trunc('day', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
$$ LANGUAGE sql STABLE;

-- I3/I4 : reset quotidien ATOMIQUE + aligné Paris.
-- Le WHERE conditionnel garantit AU PLUS un reset par jour Paris, peu importe
-- combien de fois (client + cron) la fonction est appelée -> plus de double-crédit.
CREATE OR REPLACE FUNCTION reset_daily_credits(p_user_id UUID)
RETURNS TABLE(daily_credits INTEGER, earned INTEGER, was_reset BOOLEAN) AS $$
DECLARE
  v_was_reset BOOLEAN := false;
BEGIN
  UPDATE profiles
  SET credits = 10, last_credits_reset = now()
  WHERE id = p_user_id
    AND has_purchased_credits = false
    AND (last_credits_reset IS NULL OR last_credits_reset < paris_midnight());
  IF FOUND THEN v_was_reset := true; END IF;

  RETURN QUERY
    SELECT p.credits, p.earned_credits, v_was_reset
    FROM profiles p WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- I2 : bonus VIP quotidien ATOMIQUE, basé sur last_vip_bonus_at (plus de conflit avec le reset)
CREATE OR REPLACE FUNCTION collect_vip_bonus(p_user_id UUID, p_amount INTEGER DEFAULT 10)
RETURNS TABLE(ok BOOLEAN, earned INTEGER, reason TEXT) AS $$
DECLARE
  v_is_vip BOOLEAN;
  v_expires TIMESTAMPTZ;
  v_last TIMESTAMPTZ;
  v_earned INTEGER;
BEGIN
  SELECT is_vip, vip_expires_at, last_vip_bonus_at, earned_credits
    INTO v_is_vip, v_expires, v_last, v_earned
  FROM profiles WHERE id = p_user_id;

  IF v_is_vip IS NOT TRUE THEN RETURN QUERY SELECT false, v_earned, 'not_vip'::text; RETURN; END IF;
  IF v_expires IS NOT NULL AND v_expires < now() THEN RETURN QUERY SELECT false, v_earned, 'expired'::text; RETURN; END IF;
  IF v_last IS NOT NULL AND v_last >= paris_midnight() THEN RETURN QUERY SELECT false, v_earned, 'already'::text; RETURN; END IF;

  UPDATE profiles
  SET earned_credits = earned_credits + p_amount, last_vip_bonus_at = now()
  WHERE id = p_user_id
  RETURNING earned_credits INTO v_earned;

  RETURN QUERY SELECT true, v_earned, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- I1 : refund d'un clic échoué qui ne touche PAS total_clicks (contrairement à decrement_credits(-1))
CREATE OR REPLACE FUNCTION refund_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  UPDATE profiles SET credits = credits + p_amount WHERE id = p_user_id;
  SELECT credits + earned_credits INTO v_total FROM profiles WHERE id = p_user_id;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
