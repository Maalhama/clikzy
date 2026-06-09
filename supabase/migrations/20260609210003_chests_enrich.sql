-- ============================================================
-- GAMIFICATION — Enrichissement coffres/équipement (variété cohérente)
-- Avantages d'items (un par item) : xp_pct, credit_pct, daily_clicks (+clics
-- gratuits/jour), chest_luck (+% de meilleur loot), cosmetic. AUCUN n'augmente
-- les chances de gagner un lot réel. Coffres droppent : item / crédits / XP.
-- ============================================================

-- ---------- 1) Modèle de bonus unifié sur le catalogue ----------
ALTER TABLE items_catalog ADD COLUMN IF NOT EXISTS bonus_kind TEXT;
ALTER TABLE items_catalog ADD COLUMN IF NOT EXISTS bonus_value INTEGER NOT NULL DEFAULT 0;

-- baseline depuis les colonnes existantes
UPDATE items_catalog SET
  bonus_kind = CASE WHEN xp_bonus_pct > 0 THEN 'xp_pct' WHEN credit_bonus_pct > 0 THEN 'credit_pct' ELSE 'cosmetic' END,
  bonus_value = GREATEST(xp_bonus_pct, credit_bonus_pct)
WHERE bonus_kind IS NULL;

-- variété : quelques items deviennent clics gratuits / chance de loot / cosmétique
UPDATE items_catalog SET bonus_kind = 'chest_luck',  bonus_value = 5  WHERE id = 'helm_e2';
UPDATE items_catalog SET bonus_kind = 'chest_luck',  bonus_value = 4  WHERE id = 'ring_r2';
UPDATE items_catalog SET bonus_kind = 'chest_luck',  bonus_value = 3  WHERE id = 'arte_c2'; -- Trèfle Porte-Bonheur
UPDATE items_catalog SET bonus_kind = 'chest_luck',  bonus_value = 6  WHERE id = 'arte_e2';
UPDATE items_catalog SET bonus_kind = 'daily_clicks', bonus_value = 1 WHERE id = 'arm_r2';
UPDATE items_catalog SET bonus_kind = 'daily_clicks', bonus_value = 2 WHERE id = 'arm_l1';
UPDATE items_catalog SET bonus_kind = 'cosmetic',    bonus_value = 0  WHERE id = 'arte_m1'; -- Étoile = pur prestige

ALTER TABLE items_catalog ALTER COLUMN bonus_kind SET NOT NULL;
ALTER TABLE items_catalog ADD CONSTRAINT items_bonus_kind_chk
  CHECK (bonus_kind IN ('xp_pct', 'credit_pct', 'daily_clicks', 'chest_luck', 'cosmetic'));

-- ---------- 2) Nouveaux agrégats de bonus sur profiles ----------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equip_daily_clicks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equip_chest_luck INTEGER NOT NULL DEFAULT 0;

-- ---------- 3) recompute : agrège les 4 familles de bonus ----------
CREATE OR REPLACE FUNCTION recompute_equip_bonus(p_user_id UUID) RETURNS VOID AS $$
  UPDATE profiles p SET
    equip_bonus_pct = COALESCE((SELECT SUM(c.bonus_value) FROM user_equipment e JOIN items_catalog c ON c.id = e.item_id WHERE e.user_id = p_user_id AND c.bonus_kind = 'xp_pct'), 0),
    equip_credit_bonus_pct = COALESCE((SELECT SUM(c.bonus_value) FROM user_equipment e JOIN items_catalog c ON c.id = e.item_id WHERE e.user_id = p_user_id AND c.bonus_kind = 'credit_pct'), 0),
    equip_daily_clicks = COALESCE((SELECT SUM(c.bonus_value) FROM user_equipment e JOIN items_catalog c ON c.id = e.item_id WHERE e.user_id = p_user_id AND c.bonus_kind = 'daily_clicks'), 0),
    equip_chest_luck = COALESCE((SELECT SUM(c.bonus_value) FROM user_equipment e JOIN items_catalog c ON c.id = e.item_id WHERE e.user_id = p_user_id AND c.bonus_kind = 'chest_luck'), 0)
  WHERE p.id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public;

-- recalcule pour les profils existants (au cas où)
UPDATE profiles SET equip_daily_clicks = 0, equip_chest_luck = 0 WHERE equip_daily_clicks IS NULL OR equip_chest_luck IS NULL;

-- ---------- 4) reset_daily_credits : +clics gratuits d'équipement ----------
CREATE OR REPLACE FUNCTION reset_daily_credits(p_user_id UUID)
RETURNS TABLE(daily_credits INTEGER, earned INTEGER, was_reset BOOLEAN) AS $$
DECLARE v_was_reset BOOLEAN := false; v_clicks INT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COALESCE(equip_daily_clicks, 0) INTO v_clicks FROM profiles WHERE id = p_user_id;
  UPDATE profiles
  SET credits = 10 + COALESCE(v_clicks, 0), last_credits_reset = now()
  WHERE id = p_user_id
    AND has_purchased_credits = false
    AND (last_credits_reset IS NULL OR last_credits_reset < paris_midnight());
  IF FOUND THEN v_was_reset := true; END IF;
  RETURN QUERY SELECT p.credits, p.earned_credits, v_was_reset FROM profiles p WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION reset_daily_credits(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION reset_daily_credits(uuid) TO authenticated, service_role;

-- ---------- 5) open_chest : drop item / crédits / XP (+ chest_luck) ----------
DROP FUNCTION IF EXISTS open_chest(uuid);
CREATE OR REPLACE FUNCTION open_chest(p_chest_id UUID)
RETURNS TABLE(ok BOOLEAN, reason TEXT, reward_kind TEXT, credits INTEGER, xp INTEGER,
              item_id TEXT, item_name TEXT, slot TEXT, item_rarity TEXT, emoji TEXT,
              xp_bonus_pct INTEGER, credit_bonus_pct INTEGER, bonus_kind TEXT, bonus_value INTEGER) AS $$
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

  -- type de drop : 55% item, 25% crédits, 20% XP
  IF v_type_roll < 0.25 THEN
    v_credits := CASE v_chest_rarity
      WHEN 'common' THEN floor(random()*21)+10 WHEN 'rare' THEN floor(random()*41)+30
      WHEN 'epic' THEN floor(random()*81)+70 WHEN 'legendary' THEN floor(random()*251)+150 ELSE 10 END;
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

  -- item, rareté pondérée par le coffre + chest_luck (pousse le tirage vers le haut)
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

-- ---------- 6) Protéger les nouveaux agrégats ----------
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
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;
