-- ============================================================
-- PASSE D'ARÈNE — battle pass mensuel (piste premium 4,99 € one-shot)
-- Adossé au calendrier existant : la progression = jours réclamés
-- (calendar_claims) du mois en cours. Aucune récompense n'augmente
-- les chances de gagner un lot. Crédits premium plafonnés à 25/mois.
-- ============================================================

CREATE TABLE IF NOT EXISTS battle_passes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- 1er du mois (Europe/Paris)
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_session TEXT,
  PRIMARY KEY (user_id, month)
);
ALTER TABLE battle_passes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own pass readable" ON battle_passes;
CREATE POLICY "Own pass readable" ON battle_passes
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- aucune policy INSERT : écriture via webhook Stripe (service_role) uniquement

CREATE TABLE IF NOT EXISTS pass_tier_claims (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  tier INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, month, tier)
);
ALTER TABLE pass_tier_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own tier claims readable" ON pass_tier_claims;
CREATE POLICY "Own tier claims readable" ON pass_tier_claims
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- aucune policy INSERT : écriture via claim_pass_tier (DEFINER) uniquement

-- État du passe pour le mois en cours (Paris)
CREATE OR REPLACE FUNCTION get_pass_state(p_user_id UUID)
RETURNS TABLE(purchased BOOLEAN, days_claimed INTEGER, claimed_tiers INTEGER[]) AS $$
DECLARE
  v_month DATE := date_trunc('month', (now() AT TIME ZONE 'Europe/Paris'))::date;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT
    EXISTS(SELECT 1 FROM battle_passes b WHERE b.user_id = p_user_id AND b.month = v_month),
    (SELECT COUNT(*)::int FROM calendar_claims c
      WHERE c.user_id = p_user_id
        AND date_trunc('month', c.day)::date = v_month),
    COALESCE((SELECT array_agg(t.tier ORDER BY t.tier) FROM pass_tier_claims t
      WHERE t.user_id = p_user_id AND t.month = v_month), '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION get_pass_state(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_pass_state(uuid) TO authenticated;

-- Réclamer un palier premium. Paliers : 5, 10, 15, 20, 25 jours réclamés.
--   5  -> coffre rare
--   10 -> 25 crédits (earned, permanents) — plafond mensuel respecté par design
--   15 -> coffre épique
--   20 -> artefact exclusif (item épique/légendaire direct en inventaire)
--   25 -> coffre légendaire
CREATE OR REPLACE FUNCTION claim_pass_tier(p_user_id UUID, p_tier INTEGER)
RETURNS TABLE(reward_kind TEXT, reward_rarity TEXT, reward_amount INTEGER, reward_item_id TEXT, reward_item_name TEXT) AS $$
DECLARE
  v_month DATE := date_trunc('month', (now() AT TIME ZONE 'Europe/Paris'))::date;
  v_days INTEGER;
  v_item RECORD;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_tier NOT IN (5, 10, 15, 20, 25) THEN
    RAISE EXCEPTION 'invalid_tier';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM battle_passes b WHERE b.user_id = p_user_id AND b.month = v_month) THEN
    RAISE EXCEPTION 'pass_not_purchased';
  END IF;
  SELECT COUNT(*)::int INTO v_days FROM calendar_claims c
    WHERE c.user_id = p_user_id AND date_trunc('month', c.day)::date = v_month;
  IF v_days < p_tier THEN
    RAISE EXCEPTION 'tier_locked';
  END IF;

  -- idempotence : PK (user_id, month, tier)
  INSERT INTO pass_tier_claims(user_id, month, tier) VALUES (p_user_id, v_month, p_tier);

  IF p_tier = 5 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'rare', 'pass');
    RETURN QUERY SELECT 'chest'::text, 'rare'::text, NULL::int, NULL::text, NULL::text;
  ELSIF p_tier = 10 THEN
    UPDATE profiles SET earned_credits = earned_credits + 25 WHERE id = p_user_id;
    RETURN QUERY SELECT 'credits'::text, NULL::text, 25, NULL::text, NULL::text;
  ELSIF p_tier = 15 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'epic', 'pass');
    RETURN QUERY SELECT 'chest'::text, 'epic'::text, NULL::int, NULL::text, NULL::text;
  ELSIF p_tier = 20 THEN
    SELECT ic.id, ic.name, ic.rarity INTO v_item FROM items_catalog ic
      WHERE ic.slot = 'artefact' AND ic.rarity IN ('epic', 'legendary')
      ORDER BY md5(p_user_id::text || v_month::text || ic.id) LIMIT 1;
    INSERT INTO user_inventory(user_id, item_id, source) VALUES (p_user_id, v_item.id, 'pass');
    RETURN QUERY SELECT 'item'::text, v_item.rarity::text, NULL::int, v_item.id::text, v_item.name::text;
  ELSE
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'legendary', 'pass');
    RETURN QUERY SELECT 'chest'::text, 'legendary'::text, NULL::int, NULL::text, NULL::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_pass_tier(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_pass_tier(uuid, integer) TO authenticated;

-- Activation par le webhook Stripe (service_role) — idempotent
CREATE OR REPLACE FUNCTION grant_battle_pass(p_user_id UUID, p_session TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO battle_passes(user_id, month, stripe_session)
  VALUES (p_user_id, date_trunc('month', (now() AT TIME ZONE 'Europe/Paris'))::date, p_session)
  ON CONFLICT (user_id, month) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION grant_battle_pass(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION grant_battle_pass(uuid, text) TO service_role;

-- Samedi premium : coffre du rang +1 (le calendrier donne déjà le rang de base).
-- Géré côté claim_calendar_day ? Non — on garde la fonction existante intacte :
-- le bonus samedi premium est réclamé via les paliers (simplicité V1).
