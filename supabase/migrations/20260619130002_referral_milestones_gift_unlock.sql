-- ============================================================================
-- Lot F (viralité) #2 referral à paliers + #3 gift-to-unlock.
-- Défauts (ajustables) : paliers parrainage 3 filleuls -> 100 cr, 5 -> 250 cr,
-- 10 -> 600 cr (cumulés une fois). Gift-to-unlock : offrir son 1er cadeau -> 50 cr.
-- Idempotent.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_milestones_claimed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gift_unlock_claimed BOOLEAN NOT NULL DEFAULT false;

-- Réclame les récompenses de paliers de parrainage atteints et non encore versées.
CREATE OR REPLACE FUNCTION claim_referral_milestones(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_count INT;
  v_claimed INT;
  v_award INT := 0;
  v_new INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COALESCE(referral_count, 0), COALESCE(referral_milestones_claimed, 0)
    INTO v_count, v_claimed FROM profiles WHERE id = p_user_id FOR UPDATE;
  v_new := v_claimed;
  IF v_count >= 3  AND v_new < 1 THEN v_award := v_award + 100; v_new := 1; END IF;
  IF v_count >= 5  AND v_new < 2 THEN v_award := v_award + 250; v_new := 2; END IF;
  IF v_count >= 10 AND v_new < 3 THEN v_award := v_award + 600; v_new := 3; END IF;
  IF v_award = 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'nothing_to_claim'); END IF;
  UPDATE profiles
    SET earned_credits = earned_credits + v_award,
        referral_milestones_claimed = v_new
    WHERE id = p_user_id;
  RETURN jsonb_build_object('ok', true, 'awarded', v_award, 'claimed', v_new);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_referral_milestones(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_referral_milestones(uuid) TO authenticated;

-- Gift-to-unlock : bonus one-time au donneur de son 1er cadeau (appelé par le webhook
-- service_role à la création du gift_code). Idempotent via le flag gift_unlock_claimed.
CREATE OR REPLACE FUNCTION claim_gift_unlock_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE v_bonus CONSTANT INT := 50;
BEGIN
  UPDATE profiles
    SET earned_credits = earned_credits + v_bonus,
        gift_unlock_claimed = true
    WHERE id = p_user_id AND gift_unlock_claimed = false;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed'); END IF;
  RETURN jsonb_build_object('ok', true, 'bonus', v_bonus);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_gift_unlock_bonus(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_gift_unlock_bonus(uuid) TO service_role;
