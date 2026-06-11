-- ============================================================
-- Parrainage BILATÉRAL : le filleul reçoit aussi un bonus de bienvenue.
-- Parrain : +10 (sous cap 50, anti-mint). Filleul : +5 (bienvenue, une fois).
-- credits_awarded retourné = bonus FILLEUL (c'est lui qui voit le message).
-- ============================================================

CREATE OR REPLACE FUNCTION apply_referral_code(p_code TEXT)
RETURNS TABLE(ok BOOLEAN, reason TEXT, credits_awarded INTEGER) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_referred_by TEXT;
  v_my_code TEXT;
  v_ref_id UUID;
  v_ref_code TEXT;
  v_ref_count INTEGER;
  v_bonus INTEGER := 10;     -- parrain (aligné REFERRAL_BONUS)
  v_welcome INTEGER := 5;    -- filleul (bienvenue)
  v_cap INTEGER := 50;
  v_award INTEGER;
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text, 0; RETURN; END IF;

  SELECT referred_by, referral_code INTO v_referred_by, v_my_code
  FROM profiles WHERE id = v_user;

  IF v_referred_by IS NOT NULL THEN RETURN QUERY SELECT false, 'already_referred'::text, 0; RETURN; END IF;
  IF upper(COALESCE(v_my_code, '')) = upper(p_code) THEN RETURN QUERY SELECT false, 'own_code'::text, 0; RETURN; END IF;

  SELECT id, referral_code, COALESCE(referral_count, 0)
    INTO v_ref_id, v_ref_code, v_ref_count
  FROM profiles WHERE upper(referral_code) = upper(p_code)
  LIMIT 1;

  IF v_ref_id IS NULL THEN RETURN QUERY SELECT false, 'not_found'::text, 0; RETURN; END IF;

  v_award := CASE WHEN v_ref_count < v_cap THEN v_bonus ELSE 0 END;

  -- Filleul : marque le parrainage + bonus de bienvenue
  UPDATE profiles SET
    referred_by = v_ref_code,
    earned_credits = earned_credits + v_welcome
  WHERE id = v_user;

  -- Parrain : récompense (sous cap)
  UPDATE profiles SET
    earned_credits = earned_credits + v_award,
    referral_count = COALESCE(referral_count, 0) + 1,
    referral_credits_earned = COALESCE(referral_credits_earned, 0) + v_award
  WHERE id = v_ref_id;

  RETURN QUERY SELECT true, 'ok'::text, v_welcome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
