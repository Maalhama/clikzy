-- ============================================================
-- C3 — Durcissement RLS profiles
-- ------------------------------------------------------------
-- PROBLÈME : la policy "Users can update own profile" autorise un utilisateur
-- authentifié à modifier N'IMPORTE QUELLE colonne de SON profil via PostgREST,
-- y compris credits, earned_credits, is_admin, has_purchased_credits, total_wins,
-- total_clicks, is_vip, referral_count... => triche économie + élévation de
-- privilèges (is_admin = true).
--
-- SOLUTION :
--   1) Déplacer les écritures LÉGITIMES de colonnes sensibles (badges, parrainage,
--      actions admin) dans des RPC SECURITY DEFINER qui re-valident côté serveur
--      via auth.uid() (non spoofable, issu du JWT vérifié).
--   2) Trigger BEFORE UPDATE sur profiles qui REFUSE toute modif d'une colonne
--      protégée si l'appelant est un rôle PostgREST direct ('authenticated'/'anon').
--      Les RPC DEFINER (propriétaire postgres) et le cron (service_role) ne passent
--      jamais par ces deux rôles -> non bloqués.
--
-- La policy "Users can update own profile" est CONSERVÉE : l'utilisateur garde le
-- droit d'éditer ses colonnes non sensibles (username, avatar_url, adresse de
-- livraison...). Le trigger ne bloque QUE les colonnes protégées.
-- ============================================================

-- ------------------------------------------------------------
-- 1) RPC badges : attribue de façon AUTORITATIVE les badges éligibles + crédits
--    (toute la validation se fait en SQL, plus de confiance dans le client)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_eligible_badges()
RETURNS TABLE(badge_id UUID, credits_reward INTEGER) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_clicks INTEGER;
  v_wins INTEGER;
  v_referrals INTEGER;
  v_games INTEGER;
  v_total INTEGER := 0;
  b RECORD;
  v_stat INTEGER;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;

  SELECT total_clicks, total_wins, referral_count
    INTO v_clicks, v_wins, v_referrals
  FROM profiles WHERE id = v_user;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COUNT(DISTINCT game_id) INTO v_games FROM clicks WHERE user_id = v_user;

  FOR b IN
    SELECT bd.id, bd.requirement_type, bd.requirement_value, bd.credits_reward
    FROM badges bd
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub WHERE ub.user_id = v_user AND ub.badge_id = bd.id
    )
  LOOP
    v_stat := CASE b.requirement_type
      WHEN 'clicks'    THEN COALESCE(v_clicks, 0)
      WHEN 'wins'      THEN COALESCE(v_wins, 0)
      WHEN 'games'     THEN COALESCE(v_games, 0)
      WHEN 'referrals' THEN COALESCE(v_referrals, 0)
      ELSE 0
    END;

    IF v_stat >= b.requirement_value THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (v_user, b.id)
        ON CONFLICT DO NOTHING;
      v_total := v_total + COALESCE(b.credits_reward, 0);
      badge_id := b.id;
      credits_reward := COALESCE(b.credits_reward, 0);
      RETURN NEXT;
    END IF;
  END LOOP;

  IF v_total > 0 THEN
    UPDATE profiles SET earned_credits = earned_credits + v_total WHERE id = v_user;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 2) RPC parrainage : applique un code, crédite le PARRAIN (atomique + validé)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_referral_code(p_code TEXT)
RETURNS TABLE(ok BOOLEAN, reason TEXT, credits_awarded INTEGER) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_referred_by TEXT;
  v_my_code TEXT;
  v_ref_id UUID;
  v_ref_code TEXT;
  v_bonus INTEGER := 10; -- doit rester aligné avec REFERRAL_BONUS (referral.ts)
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text, 0; RETURN; END IF;

  SELECT referred_by, referral_code INTO v_referred_by, v_my_code
  FROM profiles WHERE id = v_user;

  IF v_referred_by IS NOT NULL THEN RETURN QUERY SELECT false, 'already_referred'::text, 0; RETURN; END IF;
  IF upper(COALESCE(v_my_code, '')) = upper(p_code) THEN RETURN QUERY SELECT false, 'own_code'::text, 0; RETURN; END IF;

  SELECT id, referral_code INTO v_ref_id, v_ref_code
  FROM profiles WHERE upper(referral_code) = upper(p_code)
  LIMIT 1;

  IF v_ref_id IS NULL THEN RETURN QUERY SELECT false, 'not_found'::text, 0; RETURN; END IF;

  UPDATE profiles SET referred_by = v_ref_code WHERE id = v_user;

  UPDATE profiles SET
    earned_credits = earned_credits + v_bonus,
    referral_count = COALESCE(referral_count, 0) + 1,
    referral_credits_earned = COALESCE(referral_credits_earned, 0) + v_bonus
  WHERE id = v_ref_id;

  RETURN QUERY SELECT true, 'ok'::text, v_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 3) RPC admin : set credits / toggle is_admin (re-vérifie is_admin du CALLER)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_set_credits(p_user_id UUID, p_credits INTEGER)
RETURNS BOOLEAN AS $$
DECLARE v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_caller AND is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  IF p_credits < 0 THEN RAISE EXCEPTION 'negative_credits'; END IF;
  UPDATE profiles SET credits = p_credits WHERE id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_set_admin(p_user_id UUID, p_is_admin BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_caller AND is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  UPDATE profiles SET is_admin = p_is_admin WHERE id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 4) Trigger : verrou des colonnes protégées contre les écritures client directes
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Les rôles privilégiés (RPC DEFINER owned by postgres, cron service_role,
  -- migrations) ne sont JAMAIS 'authenticated'/'anon' -> on les laisse passer.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin                IS DISTINCT FROM OLD.is_admin
     OR NEW.credits              IS DISTINCT FROM OLD.credits
     OR NEW.earned_credits       IS DISTINCT FROM OLD.earned_credits
     OR NEW.total_wins           IS DISTINCT FROM OLD.total_wins
     OR NEW.total_clicks         IS DISTINCT FROM OLD.total_clicks
     OR NEW.has_purchased_credits IS DISTINCT FROM OLD.has_purchased_credits
     OR NEW.is_vip               IS DISTINCT FROM OLD.is_vip
     OR NEW.vip_expires_at       IS DISTINCT FROM OLD.vip_expires_at
     OR NEW.referral_count       IS DISTINCT FROM OLD.referral_count
     OR NEW.referral_credits_earned IS DISTINCT FROM OLD.referral_credits_earned
     OR NEW.referred_by          IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code        IS DISTINCT FROM OLD.referral_code
     OR NEW.last_credits_reset   IS DISTINCT FROM OLD.last_credits_reset
     OR NEW.last_vip_bonus_at    IS DISTINCT FROM OLD.last_vip_bonus_at
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive ON profiles;
CREATE TRIGGER trg_protect_profile_sensitive
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_sensitive_columns();
