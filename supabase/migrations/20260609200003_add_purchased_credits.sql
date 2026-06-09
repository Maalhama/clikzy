-- ============================================================
-- add_purchased_credits : crédit d'achat ATOMIQUE (corrige le lost-update du
-- webhook Stripe checkout, qui faisait read-then-write). DEFINER, service_role only.
-- ============================================================

CREATE OR REPLACE FUNCTION add_purchased_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE v_credits INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  UPDATE profiles SET credits = credits + p_amount, has_purchased_credits = true
  WHERE id = p_user_id
  RETURNING credits INTO v_credits;
  RETURN v_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION add_purchased_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION add_purchased_credits(uuid, integer) TO service_role;
