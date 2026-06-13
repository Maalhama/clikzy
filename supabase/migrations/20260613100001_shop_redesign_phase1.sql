-- ============================================================
-- REFONTE BOUTIQUE 2026-06 — Phase 1 (monétisation)
-- 1) pack_purchases : x2 sur le 1er achat de CHAQUE pack/mois + Mini 1×/mois
-- 2) Crédits achetés -> earned_credits (permanents), sans couper le reset gratuit
-- 3) VIP repensé : allocation quotidienne 20 (vs 10), NON cumulable ;
--    fin du bonus +10 bankable (anti-cannibalisation des packs)
-- Aucune récompense ici n'augmente les chances de gagner un lot.
-- ============================================================

-- ---------- 1) Table des achats de packs (limites mensuelles + historique) ----------
CREATE TABLE IF NOT EXISTS pack_purchases (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,                 -- 1er du mois (Europe/Paris)
  pack_id TEXT NOT NULL,
  doubled BOOLEAN NOT NULL DEFAULT false,
  credits_granted INTEGER NOT NULL DEFAULT 0,
  stripe_session TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, month, pack_id)
);
ALTER TABLE pack_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own pack purchases readable" ON pack_purchases;
CREATE POLICY "Own pack purchases readable" ON pack_purchases
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- aucune policy INSERT : écriture via grant_pack_credits (DEFINER, service_role)

-- État mensuel pour l'UI : quels packs ont déjà eu leur x2 ce mois / Mini déjà pris
CREATE OR REPLACE FUNCTION get_pack_month_state(p_user_id UUID)
RETURNS TABLE(pack_id TEXT, doubled BOOLEAN) AS $$
DECLARE v_month DATE := date_trunc('month', (now() AT TIME ZONE 'Europe/Paris'))::date;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT pp.pack_id, pp.doubled FROM pack_purchases pp
    WHERE pp.user_id = p_user_id AND pp.month = v_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_pack_month_state(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_pack_month_state(uuid) TO authenticated;

-- ---------- 2) Octroi des crédits d'un pack (webhook Stripe, service_role) ----------
-- x2 sur le 1er achat de CE pack ce mois (claim atomique de la ligne PK).
-- Crédits -> earned_credits (permanents). p_monthly_limit : si déjà acheté ce mois -> refus.
CREATE OR REPLACE FUNCTION grant_pack_credits(
  p_user_id UUID, p_pack_id TEXT, p_base_credits INTEGER,
  p_session TEXT, p_monthly_limit BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_month DATE := date_trunc('month', (now() AT TIME ZONE 'Europe/Paris'))::date;
  v_rows INTEGER;
  v_doubled BOOLEAN := false;
  v_credits INTEGER;
BEGIN
  IF p_base_credits IS NULL OR p_base_credits <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  -- 1er achat de ce pack ce mois ? -> claim atomique + x2
  INSERT INTO pack_purchases(user_id, month, pack_id, doubled, credits_granted, stripe_session)
  VALUES (p_user_id, v_month, p_pack_id, true, p_base_credits * 2, p_session)
  ON CONFLICT (user_id, month, pack_id) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows > 0 THEN
    v_doubled := true; v_credits := p_base_credits * 2;
  ELSE
    -- déjà acheté ce mois : Mini (monthly_limit) = refus ; sinon tarif normal
    IF p_monthly_limit THEN
      RETURN jsonb_build_object('granted', 0, 'doubled', false, 'error', 'monthly_limit_reached');
    END IF;
    v_doubled := false; v_credits := p_base_credits;
    -- on log quand même l'achat normal (sans écraser la ligne x2)
    UPDATE pack_purchases SET credits_granted = credits_granted + v_credits
      WHERE user_id = p_user_id AND month = v_month AND pack_id = p_pack_id;
  END IF;

  UPDATE profiles SET earned_credits = earned_credits + v_credits WHERE id = p_user_id;
  RETURN jsonb_build_object('granted', v_credits, 'doubled', v_doubled);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION grant_pack_credits(uuid, text, integer, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_pack_credits(uuid, text, integer, text, boolean) TO service_role;

-- ---------- 3) Migration des acheteurs existants vers le modèle earned_credits ----------
-- Leurs crédits achetés vivaient dans `credits` (protégés par has_purchased_credits).
-- On les déplace vers earned_credits (permanents) et on leur rend le reset quotidien.
UPDATE profiles
SET earned_credits = earned_credits + credits,
    credits = CASE WHEN is_vip THEN 20 ELSE 10 END,
    has_purchased_credits = false,
    last_credits_reset = now()
WHERE has_purchased_credits = true;

-- ---------- 4) reset_daily_credits : 20/j VIP, 10/j sinon, pour TOUS ----------
-- (les crédits achetés sont désormais dans earned_credits, jamais reset)
CREATE OR REPLACE FUNCTION reset_daily_credits(p_user_id UUID)
RETURNS TABLE(daily_credits INTEGER, earned INTEGER, was_reset BOOLEAN) AS $$
DECLARE v_was_reset BOOLEAN := false;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE profiles
  SET credits = CASE WHEN is_vip THEN 20 ELSE 10 END, last_credits_reset = now()
  WHERE id = p_user_id
    AND (last_credits_reset IS NULL OR last_credits_reset < paris_midnight());
  IF FOUND THEN v_was_reset := true; END IF;

  RETURN QUERY SELECT p.credits, p.earned_credits, v_was_reset FROM profiles p WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 5) collect_vip_bonus : DÉSACTIVÉ (le VIP a 20/j non cumulable maintenant) ----------
-- No-op pour compat frontend ; le bouton « récolter » sera retiré de l'UI VIP.
CREATE OR REPLACE FUNCTION collect_vip_bonus(p_user_id UUID, p_amount INTEGER DEFAULT 10)
RETURNS TABLE(ok BOOLEAN, earned INTEGER, reason TEXT) AS $$
DECLARE v_earned INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT earned_credits INTO v_earned FROM profiles WHERE id = p_user_id;
  -- Bonus VIP bankable supprimé (refonte 2026-06) : le VIP reçoit 20 crédits/jour
  -- NON cumulables via reset_daily_credits, pour ne pas cannibaliser les packs.
  RETURN QUERY SELECT false, v_earned, 'deprecated'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
