-- ============================================================
-- GAMIFICATION Phase 2/3 — Coffres à drops (case-opening) + personnage équipable
-- CONTRAINTE : bonus = XP% / crédits% / cosmétique / collection — JAMAIS de bonus
-- sur les chances de gagner un lot réel. Drops serveur (random()).
-- Un coffre droppe SOIT des crédits, SOIT une pièce d'équipement.
-- Pièces : casque/anneau = bonus XP%, armure/artefact = bonus crédits%.
-- ============================================================

CREATE TABLE IF NOT EXISTS items_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('casque', 'armure', 'anneau', 'artefact')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  xp_bonus_pct INTEGER NOT NULL DEFAULT 0,
  credit_bonus_pct INTEGER NOT NULL DEFAULT 0,
  emoji TEXT NOT NULL DEFAULT '❔',
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO items_catalog (id, name, slot, rarity, xp_bonus_pct, credit_bonus_pct, emoji, sort_order) VALUES
  -- CASQUE (bonus XP)
  ('helm_c1','Casque de Bronze','casque','common',2,0,'🪖',1),
  ('helm_c2','Capuche Usée','casque','common',2,0,'🧢',2),
  ('helm_r1','Heaume d''Argent','casque','rare',4,0,'⛑️',3),
  ('helm_r2','Capuche de l''Ombre','casque','rare',4,0,'🥷',4),
  ('helm_e1','Couronne de Cuivre','casque','epic',7,0,'👑',5),
  ('helm_e2','Masque Spectral','casque','epic',7,0,'👹',6),
  ('helm_l1','Casque du Dragon','casque','legendary',12,0,'🐲',7),
  ('helm_m1','Diadème Mythique','casque','mythic',20,0,'🌌',8),
  -- ANNEAU (bonus XP)
  ('ring_c1','Anneau de Fer','anneau','common',2,0,'💍',1),
  ('ring_c2','Bague Gravée','anneau','common',2,0,'⭕',2),
  ('ring_r1','Anneau Saphir','anneau','rare',4,0,'🔵',3),
  ('ring_r2','Jonc d''Or','anneau','rare',4,0,'🟡',4),
  ('ring_e1','Bague d''Émeraude','anneau','epic',7,0,'💚',5),
  ('ring_l1','Anneau du Roi','anneau','legendary',12,0,'💎',6),
  ('ring_m1','Sceau Cosmique','anneau','mythic',20,0,'🪐',7),
  -- ARMURE (bonus crédits)
  ('arm_c1','Veste Renforcée','armure','common',0,2,'🦺',1),
  ('arm_c2','Tunique de Lin','armure','common',0,2,'👕',2),
  ('arm_r1','Cuirasse d''Acier','armure','rare',0,4,'🛡️',3),
  ('arm_r2','Maille Tissée','armure','rare',0,4,'🧶',4),
  ('arm_e1','Plastron Runique','armure','epic',0,7,'🥋',5),
  ('arm_l1','Armure de Phénix','armure','legendary',0,12,'🔥',6),
  ('arm_m1','Carapace Astrale','armure','mythic',0,20,'🌠',7),
  -- ARTEFACT (bonus crédits)
  ('arte_c1','Pierre Runique','artefact','common',0,2,'🪨',1),
  ('arte_c2','Trèfle Porte-Bonheur','artefact','common',0,2,'🍀',2),
  ('arte_r1','Sphère Arcanique','artefact','rare',0,4,'🔮',3),
  ('arte_r2','Amulette Solaire','artefact','rare',0,4,'☀️',4),
  ('arte_e1','Foudre Captive','artefact','epic',0,7,'⚡',5),
  ('arte_e2','Lanterne des Âmes','artefact','epic',0,7,'🏮',6),
  ('arte_l1','Clé des Abysses','artefact','legendary',0,12,'🗝️',7),
  ('arte_m1','Étoile Primordiale','artefact','mythic',0,20,'🌟',8)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items_catalog(id),
  source TEXT,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id, acquired_at DESC);

CREATE TABLE IF NOT EXISTS user_equipment (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('casque', 'armure', 'anneau', 'artefact')),
  inventory_id UUID NOT NULL REFERENCES user_inventory(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items_catalog(id),
  equipped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, slot)
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equip_bonus_pct INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equip_credit_bonus_pct INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_chests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  source TEXT,
  opened BOOLEAN NOT NULL DEFAULT false,
  dropped_item_id TEXT REFERENCES items_catalog(id),
  dropped_credits INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_chests_user ON user_chests(user_id, opened, created_at DESC);

ALTER TABLE items_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Items catalog readable" ON items_catalog;
CREATE POLICY "Items catalog readable" ON items_catalog FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Own inventory readable" ON user_inventory;
CREATE POLICY "Own inventory readable" ON user_inventory FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Own equipment readable" ON user_equipment;
CREATE POLICY "Own equipment readable" ON user_equipment FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Own chests readable" ON user_chests;
CREATE POLICY "Own chests readable" ON user_chests FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- ---------- award_xp : bonus XP d'équipement + coffre au level-up ----------
CREATE OR REPLACE FUNCTION award_xp(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(new_xp BIGINT, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE v_old_level INT; v_xp BIGINT; v_level INT; v_rarity TEXT; v_bonus INT; v_eff INT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    SELECT xp, level INTO v_xp, v_level FROM profiles WHERE id = p_user_id;
    RETURN QUERY SELECT v_xp, v_level, false; RETURN;
  END IF;
  SELECT level, COALESCE(equip_bonus_pct, 0) INTO v_old_level, v_bonus FROM profiles WHERE id = p_user_id FOR UPDATE;
  v_eff := floor(p_amount * (100 + COALESCE(v_bonus, 0)) / 100.0);
  UPDATE profiles SET xp = xp + v_eff, level = xp_to_level(xp + v_eff)
    WHERE id = p_user_id RETURNING xp, level INTO v_xp, v_level;
  IF v_level > COALESCE(v_old_level, 1) THEN
    v_rarity := CASE WHEN v_level % 10 = 0 THEN 'epic' WHEN v_level % 5 = 0 THEN 'rare' ELSE 'common' END;
    INSERT INTO user_chests(user_id, rarity, source) VALUES (p_user_id, v_rarity, 'level_up');
  END IF;
  RETURN QUERY SELECT v_xp, v_level, (v_level > COALESCE(v_old_level, 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION award_xp(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION award_xp(uuid, integer) TO service_role;

-- ---------- claim_daily_login : bonus crédits d'équipement + coffre de palier ----------
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
  v_credits := floor(LEAST(v_streak, 7) * 50 * (100 + v_cbonus) / 100.0);
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

-- ---------- open_chest : droppe SOIT des crédits SOIT un item ----------
CREATE OR REPLACE FUNCTION open_chest(p_chest_id UUID)
RETURNS TABLE(ok BOOLEAN, reason TEXT, reward_kind TEXT, credits INTEGER,
              item_id TEXT, item_name TEXT, slot TEXT, item_rarity TEXT, emoji TEXT,
              xp_bonus_pct INTEGER, credit_bonus_pct INTEGER) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_chest_rarity TEXT;
  v_cbonus INT;
  v_type_roll DOUBLE PRECISION := random();
  v_roll DOUBLE PRECISION := random();
  v_item_rarity TEXT;
  v_item RECORD;
  v_credits INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN QUERY SELECT false, 'unauthenticated'::text, NULL::text, 0, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, 0, 0; RETURN;
  END IF;

  SELECT c.rarity INTO v_chest_rarity FROM user_chests c
  WHERE c.id = p_chest_id AND c.user_id = v_user AND c.opened = false FOR UPDATE;
  IF v_chest_rarity IS NULL THEN
    RETURN QUERY SELECT false, 'not_found'::text, NULL::text, 0, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, 0, 0; RETURN;
  END IF;

  -- 35% crédits, 65% item
  IF v_type_roll < 0.35 THEN
    v_credits := CASE v_chest_rarity
      WHEN 'common'    THEN floor(random() * 21) + 10
      WHEN 'rare'      THEN floor(random() * 41) + 30
      WHEN 'epic'      THEN floor(random() * 81) + 70
      WHEN 'legendary' THEN floor(random() * 251) + 150
      ELSE 10 END;
    SELECT COALESCE(equip_credit_bonus_pct, 0) INTO v_cbonus FROM profiles WHERE id = v_user;
    v_credits := floor(v_credits * (100 + v_cbonus) / 100.0);
    UPDATE user_chests SET opened = true, opened_at = now(), dropped_credits = v_credits WHERE id = p_chest_id;
    UPDATE profiles SET earned_credits = earned_credits + v_credits WHERE id = v_user;
    RETURN QUERY SELECT true, 'ok'::text, 'credits'::text, v_credits, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, 0, 0;
    RETURN;
  END IF;

  -- sinon : item, rareté pondérée par le coffre
  v_item_rarity := CASE v_chest_rarity
    WHEN 'common'    THEN CASE WHEN v_roll < 0.70 THEN 'common' WHEN v_roll < 0.95 THEN 'rare' ELSE 'epic' END
    WHEN 'rare'      THEN CASE WHEN v_roll < 0.40 THEN 'common' WHEN v_roll < 0.80 THEN 'rare' WHEN v_roll < 0.98 THEN 'epic' ELSE 'legendary' END
    WHEN 'epic'      THEN CASE WHEN v_roll < 0.20 THEN 'common' WHEN v_roll < 0.55 THEN 'rare' WHEN v_roll < 0.90 THEN 'epic' WHEN v_roll < 0.99 THEN 'legendary' ELSE 'mythic' END
    WHEN 'legendary' THEN CASE WHEN v_roll < 0.05 THEN 'common' WHEN v_roll < 0.30 THEN 'rare' WHEN v_roll < 0.70 THEN 'epic' WHEN v_roll < 0.95 THEN 'legendary' ELSE 'mythic' END
    ELSE 'common'
  END;

  SELECT ic.id, ic.name, ic.slot, ic.rarity, ic.emoji, ic.xp_bonus_pct, ic.credit_bonus_pct INTO v_item
  FROM items_catalog ic WHERE ic.rarity = v_item_rarity ORDER BY random() LIMIT 1;
  IF v_item.id IS NULL THEN
    SELECT ic.id, ic.name, ic.slot, ic.rarity, ic.emoji, ic.xp_bonus_pct, ic.credit_bonus_pct INTO v_item
    FROM items_catalog ic WHERE ic.rarity = 'common' ORDER BY random() LIMIT 1;
  END IF;

  UPDATE user_chests SET opened = true, opened_at = now(), dropped_item_id = v_item.id WHERE id = p_chest_id;
  INSERT INTO user_inventory(user_id, item_id, source) VALUES (v_user, v_item.id, 'chest');

  RETURN QUERY SELECT true, 'ok'::text, 'item'::text, 0, v_item.id, v_item.name, v_item.slot, v_item.rarity, v_item.emoji, v_item.xp_bonus_pct, v_item.credit_bonus_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION open_chest(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION open_chest(uuid) TO authenticated, service_role;

-- ---------- equip / unequip (recalcul des deux bonus) ----------
CREATE OR REPLACE FUNCTION recompute_equip_bonus(p_user_id UUID) RETURNS VOID AS $$
  UPDATE profiles SET
    equip_bonus_pct = COALESCE((SELECT SUM(c.xp_bonus_pct) FROM user_equipment e JOIN items_catalog c ON c.id = e.item_id WHERE e.user_id = p_user_id), 0),
    equip_credit_bonus_pct = COALESCE((SELECT SUM(c.credit_bonus_pct) FROM user_equipment e JOIN items_catalog c ON c.id = e.item_id WHERE e.user_id = p_user_id), 0)
  WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public;

CREATE OR REPLACE FUNCTION equip_item(p_inventory_id UUID)
RETURNS TABLE(ok BOOLEAN, reason TEXT, slot TEXT) AS $$
DECLARE v_user UUID := auth.uid(); v_item_id TEXT; v_slot TEXT;
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text, NULL::text; RETURN; END IF;
  SELECT inv.item_id, c.slot INTO v_item_id, v_slot
  FROM user_inventory inv JOIN items_catalog c ON c.id = inv.item_id
  WHERE inv.id = p_inventory_id AND inv.user_id = v_user;
  IF v_item_id IS NULL THEN RETURN QUERY SELECT false, 'not_owned'::text, NULL::text; RETURN; END IF;
  INSERT INTO user_equipment(user_id, slot, inventory_id, item_id) VALUES (v_user, v_slot, p_inventory_id, v_item_id)
  ON CONFLICT (user_id, slot) DO UPDATE SET inventory_id = EXCLUDED.inventory_id, item_id = EXCLUDED.item_id, equipped_at = now();
  PERFORM recompute_equip_bonus(v_user);
  RETURN QUERY SELECT true, 'ok'::text, v_slot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION equip_item(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION equip_item(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION unequip_slot(p_slot TEXT)
RETURNS TABLE(ok BOOLEAN) AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false; RETURN; END IF;
  DELETE FROM user_equipment WHERE user_id = v_user AND slot = p_slot;
  PERFORM recompute_equip_bonus(v_user);
  RETURN QUERY SELECT true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION unequip_slot(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION unequip_slot(text) TO authenticated, service_role;

-- ---------- Protéger equip_bonus_pct + equip_credit_bonus_pct ----------
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
  THEN
    RAISE EXCEPTION 'Modification non autorisée de colonnes protégées du profil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;
