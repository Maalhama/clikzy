-- ============================================================
-- GAMIFICATION — Phase 1 : Socle progression (XP/niveaux, streak, quêtes)
-- ------------------------------------------------------------
-- CONTRAINTE PRODUIT ABSOLUE : rien ici n'augmente les chances de gagner un lot
-- réel. Les récompenses sont XP / earned_credits / progression / cosmétique.
-- SÉCURITÉ : tout est serveur-autoritatif. Les colonnes de progression sont
-- protégées (trigger) ; les écritures passent par des RPC DEFINER. La progression
-- des quêtes est RECALCULÉE côté serveur depuis les vraies données (anti-triche).
-- ============================================================

-- ---------- 1) Colonnes de progression sur profiles ----------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp BIGINT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_last_day DATE;

-- ---------- 2) Courbe de niveau (IMMUTABLE) ----------
-- Pour être niveau L il faut xp >= 50*L*(L-1) : L1=0, L2=100, L3=300, L5=1000,
-- L10=4500, L20=19000. Inverse : level = floor((50 + sqrt(2500 + 200*xp)) / 100).
CREATE OR REPLACE FUNCTION xp_to_level(p_xp BIGINT)
RETURNS INTEGER AS $$
  SELECT GREATEST(1, FLOOR((50 + sqrt(2500 + 200 * GREATEST(p_xp, 0))) / 100)::int);
$$ LANGUAGE sql IMMUTABLE SET search_path = pg_catalog, public;

-- ---------- 3) award_xp : ajoute de l'XP + recalcule le niveau (service_role) ----------
CREATE OR REPLACE FUNCTION award_xp(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(new_xp BIGINT, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE v_old_level INT; v_xp BIGINT; v_level INT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    SELECT xp, level INTO v_xp, v_level FROM profiles WHERE id = p_user_id;
    RETURN QUERY SELECT v_xp, v_level, false; RETURN;
  END IF;
  SELECT level INTO v_old_level FROM profiles WHERE id = p_user_id FOR UPDATE;
  UPDATE profiles SET xp = xp + p_amount, level = xp_to_level(xp + p_amount)
    WHERE id = p_user_id
    RETURNING xp, level INTO v_xp, v_level;
  RETURN QUERY SELECT v_xp, v_level, (v_level > COALESCE(v_old_level, 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION award_xp(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION award_xp(uuid, integer) TO service_role;

-- ---------- 4) claim_daily_login : streak + XP/credits du jour (self-guard, idempotent) ----------
CREATE OR REPLACE FUNCTION claim_daily_login(p_user_id UUID)
RETURNS TABLE(streak INTEGER, xp_gained INTEGER, credits_gained INTEGER, already BOOLEAN) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last DATE;
  v_streak INT;
  v_xp CONSTANT INT := 20;        -- XP de connexion (figé serveur)
  v_credits INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT streak_last_day, streak_count INTO v_last, v_streak
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_last = v_today THEN
    RETURN QUERY SELECT v_streak, 0, 0, true; RETURN;  -- déjà récupéré aujourd'hui
  END IF;

  IF v_last = v_today - 1 THEN
    v_streak := COALESCE(v_streak, 0) + 1;             -- série continue
  ELSE
    v_streak := 1;                                     -- 1er jour / série rompue
  END IF;

  -- récompense croissante, cap J7 (J1=50 ... J7=350), figée serveur
  v_credits := LEAST(v_streak, 7) * 50;

  UPDATE profiles SET
    streak_count = v_streak,
    streak_last_day = v_today,
    earned_credits = earned_credits + v_credits,
    xp = xp + v_xp,
    level = xp_to_level(xp + v_xp)
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_streak, v_xp, v_credits, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_daily_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_daily_login(uuid) TO authenticated, service_role;

-- ---------- 5) Quêtes quotidiennes ----------
CREATE TABLE IF NOT EXISTS daily_quests (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL,            -- 'clicks_today' | 'distinct_games_today' | 'mini_games_today' | 'login'
  target INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  credits_reward INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO daily_quests (key, title, description, metric, target, xp_reward, credits_reward, sort_order) VALUES
  ('login',     'Présent !',      'Connecte-toi aujourd''hui',          'login',                1, 20,  0, 1),
  ('clicks_5',  'Échauffement',   'Utilise 5 clics aujourd''hui',       'clicks_today',         5, 50, 10, 2),
  ('games_3',   'Touche-à-tout',  'Participe à 3 lots différents',      'distinct_games_today', 3, 75, 15, 3),
  ('minigame_1','Tente ta chance','Joue à un mini-jeu aujourd''hui',    'mini_games_today',     1, 40,  5, 4)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_quest_claims (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL REFERENCES daily_quests(key),
  quest_day DATE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_key, quest_day)
);

ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Daily quests readable" ON daily_quests;
CREATE POLICY "Daily quests readable" ON daily_quests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Own quest claims readable" ON user_quest_claims;
CREATE POLICY "Own quest claims readable" ON user_quest_claims FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- aucune policy INSERT -> claim via claim_quest (DEFINER) uniquement

-- claim_quest : valide la condition depuis les VRAIES données + crédite une fois/jour
CREATE OR REPLACE FUNCTION claim_quest(p_quest_key TEXT)
RETURNS TABLE(ok BOOLEAN, reason TEXT, xp_reward INTEGER, credits_reward INTEGER) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_q daily_quests%ROWTYPE;
  v_progress INTEGER;
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text, 0, 0; RETURN; END IF;

  SELECT * INTO v_q FROM daily_quests WHERE key = p_quest_key AND active = true;
  IF v_q.key IS NULL THEN RETURN QUERY SELECT false, 'unknown_quest'::text, 0, 0; RETURN; END IF;

  IF EXISTS (SELECT 1 FROM user_quest_claims WHERE user_id = v_user AND quest_key = p_quest_key AND quest_day = v_today) THEN
    RETURN QUERY SELECT false, 'already_claimed'::text, 0, 0; RETURN;
  END IF;

  v_progress := CASE v_q.metric
    WHEN 'clicks_today' THEN (
      SELECT COUNT(*) FROM clicks
      WHERE user_id = v_user AND is_bot = false
        AND (clicked_at AT TIME ZONE 'Europe/Paris')::date = v_today)
    WHEN 'distinct_games_today' THEN (
      SELECT COUNT(DISTINCT game_id) FROM clicks
      WHERE user_id = v_user AND is_bot = false
        AND (clicked_at AT TIME ZONE 'Europe/Paris')::date = v_today)
    WHEN 'mini_games_today' THEN (
      SELECT COUNT(*) FROM mini_game_plays WHERE user_id = v_user AND play_day = v_today)
    WHEN 'login' THEN 1
    ELSE 0
  END;

  IF v_progress < v_q.target THEN
    RETURN QUERY SELECT false, 'not_completed'::text, 0, 0; RETURN;
  END IF;

  INSERT INTO user_quest_claims (user_id, quest_key, quest_day) VALUES (v_user, p_quest_key, v_today);
  UPDATE profiles SET
    earned_credits = earned_credits + v_q.credits_reward,
    xp = xp + v_q.xp_reward,
    level = xp_to_level(xp + v_q.xp_reward)
  WHERE id = v_user;

  RETURN QUERY SELECT true, 'ok'::text, v_q.xp_reward, v_q.credits_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_quest(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_quest(text) TO authenticated, service_role;

-- ---------- 6) Succès : préparer badges pour XP + succès cachés (non câblé V1) ----------
ALTER TABLE badges ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS xp_reward INTEGER NOT NULL DEFAULT 0;

-- ---------- 7) perform_click : +5 XP par clic (intégré à l'écriture atomique) ----------
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
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT status, end_time INTO v_status, v_end_time
  FROM games WHERE id = p_game_id FOR UPDATE;
  IF v_status IS NULL OR v_status NOT IN ('active', 'final_phase') THEN
    RETURN QUERY SELECT false, 0, 0::bigint, 'game_not_active'::text; RETURN;
  END IF;

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

  -- +5 XP par clic (progression — n'affecte PAS les chances de gagner le lot)
  UPDATE profiles SET
    total_clicks = total_clicks + 1,
    xp = xp + 5,
    level = xp_to_level(xp + 5)
  WHERE id = p_user_id;

  SELECT credits + earned_credits INTO v_daily FROM profiles WHERE id = p_user_id;
  RETURN QUERY SELECT true, v_daily, v_new_end, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ---------- 8) Trigger : protéger aussi xp/level/streak (+ search_path) ----------
CREATE OR REPLACE FUNCTION protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
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
     OR NEW.xp                   IS DISTINCT FROM OLD.xp
     OR NEW.level                IS DISTINCT FROM OLD.level
     OR NEW.streak_count         IS DISTINCT FROM OLD.streak_count
     OR NEW.streak_last_day      IS DISTINCT FROM OLD.streak_last_day
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;
