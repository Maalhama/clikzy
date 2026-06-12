-- ============================================================
-- 1) JACKPOT — fenêtre de distribution élargie (8 → 10 du mois).
--    Si le cron du 8 échoue (service down, circuit breaker), le pot n'est
--    plus perdu : il est distribué au premier passage entre le 8 et le 10.
-- 2) COSMÉTIQUES PREMIUM — enfin obtenables : 3 exclusivités Passe d'Arène
--    accordées en bonus aux paliers 15/20/25 (INSERT user_cosmetics).
-- ============================================================

-- ---------- 1) Jackpot : fenêtre 8-10 ----------
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
  SELECT amount, last_distributed_month INTO v_pot, v_done FROM jackpot WHERE id = 1;
  -- Fenêtre de rattrapage : le 8 idéalement, jusqu'au 10 si un passage a été raté.
  IF v_day NOT BETWEEN 8 AND 10 OR v_done = v_month THEN
    RETURN QUERY SELECT false, NULL::text, 0; RETURN;
  END IF;

  -- Gagnant : un joueur actif au hasard (a déjà cliqué)
  SELECT id, username INTO v_winner_id, v_winner_name
  FROM profiles WHERE COALESCE(total_clicks, 0) > 0
  ORDER BY random() LIMIT 1;

  IF v_winner_id IS NULL THEN
    -- personne d'éligible : on marque le mois pour ne pas boucler, sans distribuer
    UPDATE jackpot SET last_distributed_month = v_month WHERE id = 1;
    RETURN QUERY SELECT false, NULL::text, 0; RETURN;
  END IF;

  UPDATE profiles SET earned_credits = earned_credits + v_pot WHERE id = v_winner_id;
  UPDATE jackpot SET
    amount = 500,                                  -- reset à la base
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

-- ---------- 2) Cosmétiques premium exclusifs Passe d'Arène ----------
INSERT INTO cosmetics_catalog (id, type, name, rarity, unlock_level, is_premium, sort_order) VALUES
  ('cursor_arena', 'cursor', 'Curseur d''Arène',   'epic',      1, true, 6),
  ('trail_arena',  'trail',  'Sillage d''Arène',   'legendary', 1, true, 6),
  ('frame_arena',  'frame',  'Aura d''Arène',      'mythic',    1, true, 6)
ON CONFLICT (id) DO NOTHING;

-- claim_pass_tier : mêmes récompenses qu'avant + cosmétique premium en bonus
-- aux paliers 15 (curseur), 20 (sillage) et 25 (aura). Idempotent (PK + DO NOTHING).
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
