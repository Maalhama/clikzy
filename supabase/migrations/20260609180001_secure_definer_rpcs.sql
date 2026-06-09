-- ============================================================
-- DURCISSEMENT 2 (post-audit) — sécuriser les RPC SECURITY DEFINER
-- ------------------------------------------------------------
-- FAILLE CRITIQUE : les RPC DEFINER de crédits/clic étaient GRANT EXECUTE TO PUBLIC
-- et acceptaient un p_user_id arbitraire sans valider auth.uid(). Comme elles
-- s'exécutent en tant que postgres, elles BYPASSENT la RLS ET le trigger C3 ->
-- un client (clé anon) pouvait appeler directement supabase.rpc('...', {p_user_id, p_amount})
-- pour minter des crédits / IDOR sur n'importe quel compte.
--
-- Correctifs :
--   1) DROP des RPC DEFINER mortes (refund_credits, decrement_credits,
--      get_next_sequence, get_total_credits) -> réduction de surface.
--   2) Garde d'identité : "IF auth.uid() IS NOT NULL AND p_user_id <> auth.uid()
--      THEN RAISE 'forbidden'" -> un client ne peut agir que sur LUI-MÊME ;
--      le cron (service_role, auth.uid() NULL) garde l'accès complet.
--   3) collect_vip_bonus : montant FIGÉ en dur (ignore p_amount).
--   4) SET search_path = pg_catalog, public sur toutes les DEFINER (anti-injection).
--   5) REVOKE EXECUTE FROM PUBLIC, anon ; GRANT au juste nécessaire.
--   6) Régression C3 corrigée : claim_eligible_badges renvoie badge_id TEXT
--      (badges.id et user_badges.badge_id sont TEXT, pas UUID).
--   7) RLS sur badges/user_badges (écriture uniquement via DEFINER).
--   8) Unicité free-play/jour Paris (anti-TOCTOU mint).
--   9) Désinscription du pg_cron simulate_bot_clicks (2e moteur de fin conflictuel).
-- ============================================================

-- ---------- 1) DROP des RPC DEFINER mortes ----------
DROP FUNCTION IF EXISTS refund_credits(uuid, integer);
DROP FUNCTION IF EXISTS decrement_credits(uuid, integer);
DROP FUNCTION IF EXISTS get_next_sequence(uuid);
DROP FUNCTION IF EXISTS get_total_credits(uuid);

-- ---------- 2) perform_click : garde self + verrou profil + username dérivé ----------
CREATE OR REPLACE FUNCTION perform_click(
  p_game_id UUID, p_user_id UUID, p_username TEXT, p_item_name TEXT
)
RETURNS TABLE(ok BOOLEAN, new_total INTEGER, new_end_time BIGINT, reason TEXT) AS $$
DECLARE
  v_status TEXT;
  v_end_time BIGINT;
  v_daily INTEGER;
  v_earned INTEGER;
  v_username TEXT;
  v_seq INTEGER;
  v_now BIGINT := (EXTRACT(EPOCH FROM now()) * 1000)::bigint;
  v_new_end BIGINT;
  v_new_status TEXT;
BEGIN
  -- Garde IDOR : un client authentifié ne peut cliquer que pour lui-même.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT status, end_time INTO v_status, v_end_time
  FROM games WHERE id = p_game_id FOR UPDATE;
  IF v_status IS NULL OR v_status NOT IN ('active', 'final_phase') THEN
    RETURN QUERY SELECT false, 0, 0::bigint, 'game_not_active'::text; RETURN;
  END IF;

  -- Verrou du profil -> sérialise les clics concurrents sur des parties différentes
  -- + username dérivé du profil (plus de spoof via p_username).
  SELECT credits, earned_credits, username INTO v_daily, v_earned, v_username
  FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_daily IS NULL THEN
    RETURN QUERY SELECT false, 0, 0::bigint, 'no_profile'::text; RETURN;
  END IF;
  IF (v_daily + v_earned) < 1 THEN
    RETURN QUERY SELECT false, (v_daily + v_earned), 0::bigint, 'insufficient_credits'::text; RETURN;
  END IF;

  IF v_daily >= 1 THEN
    UPDATE profiles SET credits = credits - 1 WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET credits = 0, earned_credits = earned_credits - 1 WHERE id = p_user_id;
  END IF;

  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq FROM clicks WHERE game_id = p_game_id;
  INSERT INTO clicks (game_id, user_id, username, item_name, is_bot, sequence_number, credits_spent)
  VALUES (p_game_id, p_user_id, v_username, p_item_name, false, v_seq, 1);

  IF (v_end_time - v_now) <= 90000 THEN
    v_new_end := v_now + 90000;
    v_new_status := 'final_phase';
  ELSE
    v_new_end := v_end_time;
    v_new_status := v_status;
  END IF;

  UPDATE games SET
    last_click_user_id = p_user_id,
    last_click_username = v_username,
    last_click_at = now(),
    total_clicks = total_clicks + 1,
    end_time = v_new_end,
    status = v_new_status::game_status,
    battle_start_time = CASE
      WHEN v_new_status = 'final_phase' AND battle_start_time IS NULL THEN now()
      ELSE battle_start_time END
  WHERE id = p_game_id;

  UPDATE profiles SET total_clicks = total_clicks + 1 WHERE id = p_user_id;

  SELECT credits + earned_credits INTO v_daily FROM profiles WHERE id = p_user_id;
  RETURN QUERY SELECT true, v_daily, v_new_end, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 2b) deduct_credits : garde self ----------
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_daily INTEGER;
  current_earned INTEGER;
  remaining INTEGER;
  new_total INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_amount < 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT credits, earned_credits INTO current_daily, current_earned
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF (current_daily + current_earned) < p_amount THEN
    RETURN -1;
  END IF;

  remaining := p_amount;
  IF current_daily >= remaining THEN
    UPDATE profiles SET credits = credits - remaining WHERE id = p_user_id;
  ELSE
    remaining := remaining - current_daily;
    UPDATE profiles SET credits = 0, earned_credits = earned_credits - remaining WHERE id = p_user_id;
  END IF;

  SELECT credits + earned_credits INTO new_total FROM profiles WHERE id = p_user_id;
  RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 2c) add_mini_game_credits : garde self (REVOKE authenticated en migration suivante) ----------
CREATE OR REPLACE FUNCTION add_mini_game_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE total_credits INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_amount < 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  UPDATE profiles SET earned_credits = earned_credits + p_amount WHERE id = p_user_id;
  SELECT credits + earned_credits INTO total_credits FROM profiles WHERE id = p_user_id;
  RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 3) reset_daily_credits : garde self ----------
CREATE OR REPLACE FUNCTION reset_daily_credits(p_user_id UUID)
RETURNS TABLE(daily_credits INTEGER, earned INTEGER, was_reset BOOLEAN) AS $$
DECLARE v_was_reset BOOLEAN := false;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE profiles
  SET credits = 10, last_credits_reset = now()
  WHERE id = p_user_id
    AND has_purchased_credits = false
    AND (last_credits_reset IS NULL OR last_credits_reset < paris_midnight());
  IF FOUND THEN v_was_reset := true; END IF;

  RETURN QUERY SELECT p.credits, p.earned_credits, v_was_reset FROM profiles p WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 4) collect_vip_bonus : garde self + montant FIGÉ (ignore p_amount) ----------
CREATE OR REPLACE FUNCTION collect_vip_bonus(p_user_id UUID, p_amount INTEGER DEFAULT 10)
RETURNS TABLE(ok BOOLEAN, earned INTEGER, reason TEXT) AS $$
DECLARE
  v_is_vip BOOLEAN;
  v_expires TIMESTAMPTZ;
  v_last TIMESTAMPTZ;
  v_earned INTEGER;
  v_bonus CONSTANT INTEGER := 10; -- montant figé côté serveur, p_amount ignoré
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT is_vip, vip_expires_at, last_vip_bonus_at, earned_credits
    INTO v_is_vip, v_expires, v_last, v_earned
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_is_vip IS NOT TRUE THEN RETURN QUERY SELECT false, v_earned, 'not_vip'::text; RETURN; END IF;
  IF v_expires IS NOT NULL AND v_expires < now() THEN RETURN QUERY SELECT false, v_earned, 'expired'::text; RETURN; END IF;
  IF v_last IS NOT NULL AND v_last >= paris_midnight() THEN RETURN QUERY SELECT false, v_earned, 'already'::text; RETURN; END IF;

  UPDATE profiles
  SET earned_credits = earned_credits + v_bonus, last_vip_bonus_at = now()
  WHERE id = p_user_id
  RETURNING earned_credits INTO v_earned;

  RETURN QUERY SELECT true, v_earned, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 6) claim_eligible_badges : badge_id TEXT (régression C3) + search_path ----------
-- DROP requis : on change le type de retour (UUID -> TEXT).
DROP FUNCTION IF EXISTS claim_eligible_badges();
CREATE OR REPLACE FUNCTION claim_eligible_badges()
RETURNS TABLE(badge_id TEXT, credits_reward INTEGER) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 4b) search_path sur les autres DEFINER (anti-injection) ----------
ALTER FUNCTION apply_referral_code(text) SET search_path = pg_catalog, public;
ALTER FUNCTION admin_set_credits(uuid, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION admin_set_admin(uuid, boolean) SET search_path = pg_catalog, public;
ALTER FUNCTION paris_midnight() SET search_path = pg_catalog, public;
ALTER FUNCTION log_player_event(uuid, text, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION can_play_mini_game(uuid, text) SET search_path = pg_catalog, public;
ALTER FUNCTION handle_new_user() SET search_path = pg_catalog, public;

-- ---------- 5) REVOKE PUBLIC/anon + GRANT au juste nécessaire ----------
-- RPC à identité auto (auth.uid()) ou garde self : appelables par authenticated + cron.
REVOKE EXECUTE ON FUNCTION perform_click(uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION deduct_credits(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION reset_daily_credits(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION collect_vip_bonus(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION claim_eligible_badges() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION apply_referral_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_set_credits(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_set_admin(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION perform_click(uuid, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION deduct_credits(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reset_daily_credits(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION collect_vip_bonus(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION claim_eligible_badges() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION apply_referral_code(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_set_credits(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_set_admin(uuid, boolean) TO authenticated, service_role;
-- add_mini_game_credits : REVOKE total de authenticated dans la migration suivante
-- (après bascule du code mini-jeux sur service_role). Ici on retire au moins anon.
REVOKE EXECUTE ON FUNCTION add_mini_game_credits(uuid, integer) FROM PUBLIC, anon;

-- ---------- 7) RLS badges / user_badges (écriture via DEFINER uniquement) ----------
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON user_badges;
CREATE POLICY "User badges are viewable by everyone" ON user_badges FOR SELECT TO anon, authenticated USING (true);
-- Aucune policy INSERT/UPDATE/DELETE -> écriture uniquement via claim_eligible_badges (DEFINER) + service_role.

-- ---------- 8) Anti-TOCTOU mini-jeux : play_day (jour Paris) + unicité free-play/jour ----------
ALTER TABLE mini_game_plays ADD COLUMN IF NOT EXISTS play_day date;
UPDATE mini_game_plays SET play_day = (played_at AT TIME ZONE 'Europe/Paris')::date WHERE play_day IS NULL;

CREATE OR REPLACE FUNCTION set_mini_game_play_day()
RETURNS TRIGGER AS $$
BEGIN
  NEW.play_day := (COALESCE(NEW.played_at, now()) AT TIME ZONE 'Europe/Paris')::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;
DROP TRIGGER IF EXISTS trg_set_play_day ON mini_game_plays;
CREATE TRIGGER trg_set_play_day BEFORE INSERT ON mini_game_plays
  FOR EACH ROW EXECUTE FUNCTION set_mini_game_play_day();

-- dédupe d'éventuels doublons free-play (anomalies) avant l'index unique
DELETE FROM mini_game_plays a USING mini_game_plays b
WHERE a.is_free_play = true AND b.is_free_play = true
  AND a.user_id = b.user_id AND a.game_type = b.game_type AND a.play_day = b.play_day
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS ux_free_play_per_day
  ON mini_game_plays(user_id, game_type, play_day) WHERE is_free_play = true;

-- ---------- 9) Désinscrire le pg_cron simulate_bot_clicks (moteur de fin conflictuel) ----------
DO $$
DECLARE j TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOREACH j IN ARRAY ARRAY['bot_clicks_0','bot_clicks_15','bot_clicks_30','bot_clicks_45'] LOOP
      IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = j) THEN
        PERFORM cron.unschedule(j);
      END IF;
    END LOOP;
  END IF;
END $$;
DROP FUNCTION IF EXISTS simulate_bot_clicks();
DROP FUNCTION IF EXISTS generate_bot_username(text);

-- ---------- 10) Anti-collision referral_code (boucle) ----------
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      NEW.referral_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = NEW.referral_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;
