-- ============================================================
-- ÉCONOMIE — Rééquilibrage des récompenses crédits + coffre quotidien
-- ------------------------------------------------------------
-- Objectif business : les crédits s'achètent (packs). Les récompenses
-- gratuites restent symboliques (1-2 crédits) — la progression donne de
-- l'XP, des coffres et du cosmétique, jamais un revenu de crédits.
--   - Quêtes quotidiennes : 10/15/5 -> 1/2/1 crédits
--   - Streak connexion : J1=50..J7=350 -> J1=1..J7=7 crédits
--   - Drops crédits des coffres : 10-400 -> 1-50 selon rareté
--   - NOUVEAU : 1 coffre commun gratuit par jour (reset minuit Europe/Paris),
--     claim idempotent type claim_daily_login (pas de cron nécessaire).
-- ============================================================

-- ---------- 1) Quêtes : récompenses crédits symboliques ----------
UPDATE daily_quests SET credits_reward = 1 WHERE key = 'clicks_5';
UPDATE daily_quests SET credits_reward = 2 WHERE key = 'games_3';
UPDATE daily_quests SET credits_reward = 1 WHERE key = 'minigame_1';
UPDATE daily_quests SET credits_reward = 0 WHERE key = 'login';

-- ---------- 2) Streak connexion : 1..7 crédits (au lieu de 50..350) ----------
CREATE OR REPLACE FUNCTION claim_daily_login(p_user_id UUID)
RETURNS TABLE(streak INTEGER, xp_gained INTEGER, credits_gained INTEGER, already BOOLEAN) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last DATE; v_streak INT; v_xp CONSTANT INT := 20; v_credits INT; v_cbonus INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT streak_last_day, streak_count, COALESCE(equip_credit_bonus_pct, 0)
    INTO v_last, v_streak, v_cbonus FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_last = v_today THEN RETURN QUERY SELECT v_streak, 0, 0, true; RETURN; END IF;
  IF v_last = v_today - 1 THEN v_streak := COALESCE(v_streak, 0) + 1; ELSE v_streak := 1; END IF;
  -- récompense symbolique : J1=1 ... J7=7 crédits (cap J7), bonus équipement inclus
  v_credits := floor(LEAST(v_streak, 7) * (100 + v_cbonus) / 100.0);
  UPDATE profiles SET streak_count = v_streak, streak_last_day = v_today,
    earned_credits = earned_credits + v_credits, xp = xp + v_xp, level = xp_to_level(xp + v_xp)
  WHERE id = p_user_id;
  IF v_streak > 0 AND v_streak % 30 = 0 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'legendary', 'streak_30');
  ELSIF v_streak > 0 AND v_streak % 7 = 0 THEN
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'rare', 'streak_7');
  END IF;
  RETURN QUERY SELECT v_streak, v_xp, v_credits, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_daily_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_daily_login(uuid) TO authenticated, service_role;

-- ---------- 3) open_chest : drops crédits réduits (1-50 selon rareté) ----------
DROP FUNCTION IF EXISTS open_chest(uuid);
CREATE OR REPLACE FUNCTION open_chest(p_chest_id UUID)
RETURNS TABLE(ok BOOLEAN, reason TEXT, reward_kind TEXT, credits INTEGER, xp INTEGER,
              item_id TEXT, item_name TEXT, slot TEXT, item_rarity TEXT, emoji TEXT,
              xp_bonus_pct INTEGER, credit_bonus_pct INTEGER, bonus_kind TEXT, bonus_value INTEGER) AS $$
#variable_conflict use_column
DECLARE
  v_user UUID := auth.uid();
  v_chest_rarity TEXT;
  v_luck INT; v_cbonus INT;
  v_type_roll DOUBLE PRECISION := random();
  v_roll DOUBLE PRECISION := random();
  v_item_rarity TEXT;
  v_item RECORD;
  v_credits INT; v_xp INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN QUERY SELECT false,'unauthenticated'::text,NULL::text,0,0,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,0,0,NULL::text,0; RETURN;
  END IF;

  SELECT c.rarity INTO v_chest_rarity FROM user_chests c
  WHERE c.id = p_chest_id AND c.user_id = v_user AND c.opened = false FOR UPDATE;
  IF v_chest_rarity IS NULL THEN
    RETURN QUERY SELECT false,'not_found'::text,NULL::text,0,0,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,0,0,NULL::text,0; RETURN;
  END IF;

  SELECT COALESCE(equip_chest_luck,0), COALESCE(equip_credit_bonus_pct,0) INTO v_luck, v_cbonus FROM profiles WHERE id = v_user;

  IF v_type_roll < 0.25 THEN
    -- crédits symboliques : l'achat de packs reste la seule vraie source
    v_credits := CASE v_chest_rarity
      WHEN 'common' THEN floor(random()*3)+1 WHEN 'rare' THEN floor(random()*6)+3
      WHEN 'epic' THEN floor(random()*13)+8 WHEN 'legendary' THEN floor(random()*31)+20 ELSE 1 END;
    v_credits := floor(v_credits * (100 + v_cbonus) / 100.0);
    UPDATE user_chests SET opened=true, opened_at=now(), dropped_credits=v_credits WHERE id=p_chest_id;
    UPDATE profiles SET earned_credits = earned_credits + v_credits WHERE id = v_user;
    RETURN QUERY SELECT true,'ok'::text,'credits'::text,v_credits,0,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,0,0,NULL::text,0; RETURN;
  ELSIF v_type_roll < 0.45 THEN
    v_xp := CASE v_chest_rarity
      WHEN 'common' THEN floor(random()*31)+20 WHEN 'rare' THEN floor(random()*71)+50
      WHEN 'epic' THEN floor(random()*131)+120 WHEN 'legendary' THEN floor(random()*251)+250 ELSE 20 END;
    UPDATE user_chests SET opened=true, opened_at=now() WHERE id=p_chest_id;
    UPDATE profiles SET xp = xp + v_xp, level = xp_to_level(xp + v_xp) WHERE id = v_user;
    RETURN QUERY SELECT true,'ok'::text,'xp'::text,0,v_xp,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,0,0,NULL::text,0; RETURN;
  END IF;

  v_roll := LEAST(0.999, v_roll + v_luck / 100.0);
  v_item_rarity := CASE v_chest_rarity
    WHEN 'common'    THEN CASE WHEN v_roll < 0.70 THEN 'common' WHEN v_roll < 0.95 THEN 'rare' ELSE 'epic' END
    WHEN 'rare'      THEN CASE WHEN v_roll < 0.40 THEN 'common' WHEN v_roll < 0.80 THEN 'rare' WHEN v_roll < 0.98 THEN 'epic' ELSE 'legendary' END
    WHEN 'epic'      THEN CASE WHEN v_roll < 0.20 THEN 'common' WHEN v_roll < 0.55 THEN 'rare' WHEN v_roll < 0.90 THEN 'epic' WHEN v_roll < 0.99 THEN 'legendary' ELSE 'mythic' END
    WHEN 'legendary' THEN CASE WHEN v_roll < 0.05 THEN 'common' WHEN v_roll < 0.30 THEN 'rare' WHEN v_roll < 0.70 THEN 'epic' WHEN v_roll < 0.95 THEN 'legendary' ELSE 'mythic' END
    ELSE 'common'
  END;

  SELECT ic.id, ic.name, ic.slot, ic.rarity, ic.emoji, ic.xp_bonus_pct, ic.credit_bonus_pct, ic.bonus_kind, ic.bonus_value INTO v_item
  FROM items_catalog ic WHERE ic.rarity = v_item_rarity ORDER BY random() LIMIT 1;
  IF v_item.id IS NULL THEN
    SELECT ic.id, ic.name, ic.slot, ic.rarity, ic.emoji, ic.xp_bonus_pct, ic.credit_bonus_pct, ic.bonus_kind, ic.bonus_value INTO v_item
    FROM items_catalog ic WHERE ic.rarity = 'common' ORDER BY random() LIMIT 1;
  END IF;

  UPDATE user_chests SET opened=true, opened_at=now(), dropped_item_id=v_item.id WHERE id=p_chest_id;
  INSERT INTO user_inventory(user_id, item_id, source) VALUES (v_user, v_item.id, 'chest');

  RETURN QUERY SELECT true,'ok'::text,'item'::text,0,0,v_item.id,v_item.name,v_item.slot,v_item.rarity,v_item.emoji,v_item.xp_bonus_pct,v_item.credit_bonus_pct,v_item.bonus_kind,v_item.bonus_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION open_chest(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION open_chest(uuid) TO authenticated, service_role;

-- ---------- 4) Coffre quotidien : 1 coffre commun / jour (minuit Paris) ----------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chest_last_claim_day DATE;

-- Colonne protégée contre l'écriture client directe (même liste + la nouvelle)
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
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;

-- Claim idempotent (self-guard) : 1 coffre commun par jour Paris, pas de cron
CREATE OR REPLACE FUNCTION claim_daily_chest(p_user_id UUID)
RETURNS TABLE(ok BOOLEAN, already BOOLEAN, chest_id UUID) AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  v_last DATE;
  v_chest UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT chest_last_claim_day INTO v_last FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_last IS NULL AND NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::uuid; RETURN;
  END IF;
  IF v_last = v_today THEN
    RETURN QUERY SELECT true, true, NULL::uuid; RETURN;  -- déjà récupéré aujourd'hui
  END IF;

  UPDATE profiles SET chest_last_claim_day = v_today WHERE id = p_user_id;
  INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, 'common', 'daily')
  RETURNING id INTO v_chest;

  RETURN QUERY SELECT true, false, v_chest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION claim_daily_chest(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_daily_chest(uuid) TO authenticated, service_role;
