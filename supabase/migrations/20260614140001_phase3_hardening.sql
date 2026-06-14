-- ============================================================
-- PHASE 3 — Durcissement (audit 2026-06-13/14)
-- Corrections SQL groupées, toutes idempotentes (CREATE OR REPLACE /
-- IF NOT EXISTS / DROP IF EXISTS). Sûr à ré-appliquer.
--   1) reset_daily_credits : restaure le bonus +equip_daily_clicks (régression shop)
--   2) grant_pack_credits  : idempotente par stripe_session (ledger anti double-crédit)
--   3) apply_referral_code : FOR UPDATE (anti double-apply filleul + cap 50 fiable)
--   4) distribute_jackpot  : FOR UPDATE (anti double-distribution crons concurrents)
--   5) protect_profile_sensitive_columns : couvre fair_server_seed/hash/nonce
--   6) mini_game_plays     : DROP policy INSERT client (écriture via service_role)
--   7) log_badge_earned / log_win_recorded : search_path fixe (sécurité DEFINER)
--   8) cosmétiques premium Passe obtenables (catalogue + claim_pass_tier)
--   9) index manquants (comments.user_id, pack_purchases.stripe_session)
-- ============================================================

-- ---------- 1) reset_daily_credits : 20/10 + clics d'équipement ----------
-- Régression introduite par la refonte boutique : le bonus +equip_daily_clicks
-- (items équipés bonus_kind='daily_clicks') avait disparu du reset quotidien.
CREATE OR REPLACE FUNCTION reset_daily_credits(p_user_id UUID)
RETURNS TABLE(daily_credits INTEGER, earned INTEGER, was_reset BOOLEAN) AS $$
DECLARE v_was_reset BOOLEAN := false;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE profiles
  SET credits = (CASE WHEN is_vip THEN 20 ELSE 10 END) + COALESCE(equip_daily_clicks, 0),
      last_credits_reset = now()
  WHERE id = p_user_id
    AND (last_credits_reset IS NULL OR last_credits_reset < paris_midnight());
  IF FOUND THEN v_was_reset := true; END IF;

  RETURN QUERY SELECT p.credits, p.earned_credits, v_was_reset FROM profiles p WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 2) grant_pack_credits : idempotence par session Stripe ----------
-- Sans garde, un retry du webhook sur le 1er achat (x2 déjà claim) repassait par
-- la branche « achat normal » -> crédit en double. Le ledger ci-dessous garantit
-- qu'une session Stripe ne crédite qu'une seule fois (defense in depth vs stripe_events).
CREATE TABLE IF NOT EXISTS credit_grant_sessions (
  stripe_session TEXT PRIMARY KEY,
  user_id        UUID NOT NULL,
  pack_id        TEXT NOT NULL,
  credits_granted INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE credit_grant_sessions ENABLE ROW LEVEL SECURITY;
-- aucune policy : accès réservé au service_role (DEFINER), invisible au client

CREATE OR REPLACE FUNCTION grant_pack_credits(
  p_user_id UUID, p_pack_id TEXT, p_base_credits INTEGER,
  p_session TEXT, p_monthly_limit BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_month   DATE := date_trunc('month', (now() AT TIME ZONE 'Europe/Paris'))::date;
  v_rows    INTEGER;
  v_sess    INTEGER;
  v_doubled BOOLEAN := false;
  v_credits INTEGER;
BEGIN
  IF p_base_credits IS NULL OR p_base_credits <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  -- Idempotence : une session déjà traitée ne crédite plus rien (retries webhook).
  IF p_session IS NOT NULL AND p_session <> '' THEN
    INSERT INTO credit_grant_sessions(stripe_session, user_id, pack_id)
    VALUES (p_session, p_user_id, p_pack_id)
    ON CONFLICT (stripe_session) DO NOTHING;
    GET DIAGNOSTICS v_sess = ROW_COUNT;
    IF v_sess = 0 THEN
      RETURN jsonb_build_object('granted', 0, 'doubled', false, 'error', 'already_processed');
    END IF;
  END IF;

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
    UPDATE pack_purchases SET credits_granted = credits_granted + v_credits
      WHERE user_id = p_user_id AND month = v_month AND pack_id = p_pack_id;
  END IF;

  UPDATE profiles SET earned_credits = earned_credits + v_credits WHERE id = p_user_id;

  IF p_session IS NOT NULL AND p_session <> '' THEN
    UPDATE credit_grant_sessions SET credits_granted = v_credits WHERE stripe_session = p_session;
  END IF;

  RETURN jsonb_build_object('granted', v_credits, 'doubled', v_doubled);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION grant_pack_credits(uuid, text, integer, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_pack_credits(uuid, text, integer, text, boolean) TO service_role;

-- ---------- 3) apply_referral_code : verrous FOR UPDATE ----------
-- Sans verrou : (a) deux requêtes concurrentes du même filleul pouvaient appliquer
-- le parrainage deux fois ; (b) le cap 50 du parrain pouvait être dépassé (lecture
-- de referral_count hors verrou).
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

  -- Verrou filleul : sérialise les requêtes concurrentes (anti double-apply)
  SELECT referred_by, referral_code INTO v_referred_by, v_my_code
  FROM profiles WHERE id = v_user FOR UPDATE;

  IF v_referred_by IS NOT NULL THEN RETURN QUERY SELECT false, 'already_referred'::text, 0; RETURN; END IF;
  IF upper(COALESCE(v_my_code, '')) = upper(p_code) THEN RETURN QUERY SELECT false, 'own_code'::text, 0; RETURN; END IF;

  -- Verrou parrain : le cap 50 est évalué et incrémenté sous verrou (anti-dépassement)
  SELECT id, referral_code, COALESCE(referral_count, 0)
    INTO v_ref_id, v_ref_code, v_ref_count
  FROM profiles WHERE upper(referral_code) = upper(p_code)
  LIMIT 1
  FOR UPDATE;

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

-- ---------- 4) distribute_jackpot : verrou FOR UPDATE (fenêtre 8-10) ----------
-- Sans verrou, deux crons concurrents (cron-job.org + Vercel) pouvaient lire
-- last_distributed_month != mois courant simultanément et distribuer deux fois.
CREATE OR REPLACE FUNCTION distribute_jackpot()
RETURNS TABLE(distributed BOOLEAN, winner TEXT, won INTEGER) AS $$
DECLARE
  v_month TEXT := to_char((now() AT TIME ZONE 'Europe/Paris'), 'YYYY-MM');
  v_day INTEGER := EXTRACT(DAY FROM (now() AT TIME ZONE 'Europe/Paris'))::int;
  v_pot INTEGER;
  v_done TEXT;
  v_winner_id UUID;
  v_winner_name TEXT;
BEGIN
  -- Verrou de la ligne pot : la 2e exécution concurrente bloque puis voit le mois marqué.
  SELECT amount, last_distributed_month INTO v_pot, v_done FROM jackpot WHERE id = 1 FOR UPDATE;
  IF v_day NOT BETWEEN 8 AND 10 OR v_done = v_month THEN
    RETURN QUERY SELECT false, NULL::text, 0; RETURN;
  END IF;

  SELECT id, username INTO v_winner_id, v_winner_name
  FROM profiles WHERE COALESCE(total_clicks, 0) > 0
  ORDER BY random() LIMIT 1;

  IF v_winner_id IS NULL THEN
    UPDATE jackpot SET last_distributed_month = v_month WHERE id = 1;
    RETURN QUERY SELECT false, NULL::text, 0; RETURN;
  END IF;

  UPDATE profiles SET earned_credits = earned_credits + v_pot WHERE id = v_winner_id;
  UPDATE jackpot SET
    amount = 500,
    last_distributed_month = v_month,
    last_winner_username = v_winner_name,
    last_winner_amount = v_pot,
    updated_at = now()
  WHERE id = 1;

  RETURN QUERY SELECT true, v_winner_name, v_pot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION distribute_jackpot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION distribute_jackpot() TO service_role;

-- ---------- 5) protect_profile_sensitive_columns : + colonnes provably-fair ----------
-- fair_server_seed (secret), fair_server_seed_hash (commit) et fair_nonce (compteur)
-- doivent être inviolables côté client, sinon un joueur peut casser l'équité.
-- (fair_client_seed reste modifiable : c'est prévu par le protocole commit-reveal.)
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
     OR NEW.fair_server_seed IS DISTINCT FROM OLD.fair_server_seed
     OR NEW.fair_server_seed_hash IS DISTINCT FROM OLD.fair_server_seed_hash
     OR NEW.fair_nonce IS DISTINCT FROM OLD.fair_nonce
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;

-- ---------- 6) mini_game_plays : plus d'écriture client directe ----------
-- Les parties sont désormais insérées via le service_role (cf. actions/miniGames.ts).
-- La lecture (« view own plays ») reste autorisée pour l'historique/éligibilité.
DROP POLICY IF EXISTS "Users can insert own plays" ON mini_game_plays;

-- ---------- 7) Triggers de log : search_path fixe (durcissement DEFINER) ----------
ALTER FUNCTION log_badge_earned() SET search_path = pg_catalog, public;
ALTER FUNCTION log_win_recorded() SET search_path = pg_catalog, public;

-- ---------- 8) Cosmétiques premium Passe d'Arène : obtenables ----------
INSERT INTO cosmetics_catalog (id, type, name, rarity, unlock_level, is_premium, sort_order) VALUES
  ('cursor_arena', 'cursor', 'Curseur d''Arène',   'epic',      1, true, 6),
  ('trail_arena',  'trail',  'Sillage d''Arène',   'legendary', 1, true, 6),
  ('frame_arena',  'frame',  'Aura d''Arène',      'mythic',    1, true, 6)
ON CONFLICT (id) DO NOTHING;

-- claim_pass_tier : récompenses + cosmétique premium en bonus aux paliers
-- 15 (curseur), 20 (sillage) et 25 (aura). Idempotent (PK pass_tier_claims).
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

  INSERT INTO pass_tier_claims(user_id, month, tier) VALUES (p_user_id, v_month, p_tier);

  IF p_tier = 5 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'rare', 'pass');
    RETURN QUERY SELECT 'chest'::text, 'rare'::text, NULL::int, NULL::text, NULL::text;
  ELSIF p_tier = 10 THEN
    UPDATE profiles SET earned_credits = earned_credits + 25 WHERE id = p_user_id;
    RETURN QUERY SELECT 'credits'::text, NULL::text, 25, NULL::text, NULL::text;
  ELSIF p_tier = 15 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'epic', 'pass');
    INSERT INTO user_cosmetics(user_id, cosmetic_id) VALUES (p_user_id, 'cursor_arena')
      ON CONFLICT (user_id, cosmetic_id) DO NOTHING;
    RETURN QUERY SELECT 'chest'::text, 'epic'::text, NULL::int, NULL::text, NULL::text;
  ELSIF p_tier = 20 THEN
    SELECT ic.id, ic.name, ic.rarity INTO v_item FROM items_catalog ic
      WHERE ic.slot = 'artefact' AND ic.rarity IN ('epic', 'legendary')
      ORDER BY md5(p_user_id::text || v_month::text || ic.id) LIMIT 1;
    INSERT INTO user_inventory(user_id, item_id, source) VALUES (p_user_id, v_item.id, 'pass');
    INSERT INTO user_cosmetics(user_id, cosmetic_id) VALUES (p_user_id, 'trail_arena')
      ON CONFLICT (user_id, cosmetic_id) DO NOTHING;
    RETURN QUERY SELECT 'item'::text, v_item.rarity::text, NULL::int, v_item.id::text, v_item.name::text;
  ELSE
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'legendary', 'pass');
    INSERT INTO user_cosmetics(user_id, cosmetic_id) VALUES (p_user_id, 'frame_arena')
      ON CONFLICT (user_id, cosmetic_id) DO NOTHING;
    RETURN QUERY SELECT 'chest'::text, 'legendary'::text, NULL::int, NULL::text, NULL::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_pass_tier(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_pass_tier(uuid, integer) TO authenticated;

-- ---------- 9) Index manquants ----------
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_purchases_stripe_session ON pack_purchases(stripe_session);
