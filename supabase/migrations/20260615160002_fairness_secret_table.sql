-- ============================================================================
-- P1.1 — Fermer l'exploit provably-fair (mint de crédits) + fuite PII
-- ----------------------------------------------------------------------------
-- `GRANT SELECT ON profiles TO authenticated` (table entière) ré-exposait
-- fair_server_seed (SECRET) -> un joueur lisait son seed et prédisait les
-- mini-jeux. On déplace le SECRET dans user_fairness (service_role only) et on
-- DROP la colonne de profiles. Le hash/client_seed/nonce (non secrets) restent
-- lisibles dans profiles -> les select('*') existants continuent de marcher.
-- ============================================================================

-- ---------- 1) Table dédiée au secret (default-deny) ----------
CREATE TABLE IF NOT EXISTS user_fairness (
  user_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  server_seed TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_fairness ENABLE ROW LEVEL SECURITY;
-- Aucune policy => seul service_role / DEFINER accède. Jamais lisible client.
REVOKE ALL ON user_fairness FROM anon, authenticated;

-- ---------- 2) Migrer les seeds existants ----------
INSERT INTO user_fairness (user_id, server_seed)
SELECT id, fair_server_seed FROM profiles WHERE fair_server_seed IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- ---------- 3) RPC provably-fair : le secret vit dans user_fairness ----------
CREATE OR REPLACE FUNCTION ensure_fairness(p_user UUID) RETURNS void AS $$
DECLARE v_seed TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_fairness WHERE user_id = p_user) THEN
    v_seed := encode(extensions.gen_random_bytes(32), 'hex');
    INSERT INTO user_fairness (user_id, server_seed) VALUES (p_user, v_seed)
      ON CONFLICT (user_id) DO NOTHING;
    UPDATE profiles SET
      fair_server_seed_hash = encode(extensions.digest(v_seed, 'sha256'), 'hex'),
      fair_client_seed = COALESCE(fair_client_seed, encode(extensions.gen_random_bytes(8), 'hex')),
      fair_nonce = 0
    WHERE id = p_user;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions;

CREATE OR REPLACE FUNCTION consume_fairness(p_user UUID)
RETURNS TABLE(server_seed TEXT, client_seed TEXT, nonce INTEGER) AS $$
DECLARE v_nonce INTEGER;
BEGIN
  PERFORM ensure_fairness(p_user);
  UPDATE profiles SET fair_nonce = fair_nonce + 1 WHERE id = p_user
    RETURNING fair_nonce - 1 INTO v_nonce;
  RETURN QUERY
    SELECT uf.server_seed, p.fair_client_seed, v_nonce
    FROM user_fairness uf JOIN profiles p ON p.id = uf.user_id
    WHERE uf.user_id = p_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION consume_fairness(uuid) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION consume_fairness(uuid) TO service_role;

CREATE OR REPLACE FUNCTION rotate_fairness(p_client_seed TEXT)
RETURNS TABLE(old_server_seed TEXT, old_hash TEXT, new_hash TEXT) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_old_seed TEXT; v_old_hash TEXT; v_new_seed TEXT; v_new_hash TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM ensure_fairness(v_user);
  SELECT server_seed INTO v_old_seed FROM user_fairness WHERE user_id = v_user;
  SELECT fair_server_seed_hash INTO v_old_hash FROM profiles WHERE id = v_user;
  v_new_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_new_hash := encode(extensions.digest(v_new_seed, 'sha256'), 'hex');
  UPDATE user_fairness SET server_seed = v_new_seed, updated_at = now() WHERE user_id = v_user;
  UPDATE profiles SET
    fair_server_seed_hash = v_new_hash,
    fair_client_seed = COALESCE(NULLIF(trim(p_client_seed), ''), fair_client_seed),
    fair_nonce = 0
  WHERE id = v_user;
  RETURN QUERY SELECT v_old_seed, v_old_hash, v_new_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions;
REVOKE EXECUTE ON FUNCTION rotate_fairness(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rotate_fairness(text) TO authenticated;

-- ---------- 4) Recréer le trigger SANS fair_server_seed (sinon DROP casse tout UPDATE) ----------
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
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;

-- ---------- 5) Fermer l'exploit : retirer le secret de profiles ----------
ALTER TABLE profiles DROP COLUMN IF EXISTS fair_server_seed;
