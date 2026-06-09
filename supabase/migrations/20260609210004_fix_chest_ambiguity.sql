-- ============================================================
-- Fix : "column reference xp/slot is ambiguous" dans open_chest / equip_item
-- (les noms de colonnes OUT du RETURNS TABLE entraient en conflit avec les colonnes
-- de la table dans les UPDATE/INSERT). Directive #variable_conflict use_column.
-- ============================================================

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

DROP FUNCTION IF EXISTS equip_item(uuid);
CREATE OR REPLACE FUNCTION equip_item(p_inventory_id UUID)
RETURNS TABLE(ok BOOLEAN, reason TEXT, slot TEXT) AS $$
#variable_conflict use_column
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
