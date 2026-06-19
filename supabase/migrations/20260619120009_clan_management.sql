-- ============================================================================
-- Audit 2026-06-19 (#4) : gestion avancée des clans par le chef (owner) :
-- exclure un membre, transférer la propriété, dissoudre le clan. RPC DEFINER
-- owner-only. Idempotent. Conventions de retour alignées sur create/join/leave
-- (jsonb { ok, reason }).
-- ============================================================================

-- Exclure un membre (owner-only, pas soi-même)
CREATE OR REPLACE FUNCTION kick_clan_member(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE v_caller UUID := auth.uid(); v_clan UUID; v_target_clan UUID;
BEGIN
  IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated'); END IF;
  SELECT clan_id INTO v_clan FROM clan_members WHERE user_id = v_caller AND role = 'owner';
  IF v_clan IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_owner'); END IF;
  IF p_user_id = v_caller THEN RETURN jsonb_build_object('ok', false, 'reason', 'cannot_kick_self'); END IF;
  SELECT clan_id INTO v_target_clan FROM clan_members WHERE user_id = p_user_id;
  IF v_target_clan IS DISTINCT FROM v_clan THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_in_your_clan'); END IF;
  DELETE FROM clan_members WHERE user_id = p_user_id AND clan_id = v_clan;
  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION kick_clan_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION kick_clan_member(uuid) TO authenticated;

-- Transférer la propriété à un membre du clan (owner-only)
CREATE OR REPLACE FUNCTION transfer_clan_ownership(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE v_caller UUID := auth.uid(); v_clan UUID; v_target_clan UUID;
BEGIN
  IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated'); END IF;
  SELECT clan_id INTO v_clan FROM clan_members WHERE user_id = v_caller AND role = 'owner';
  IF v_clan IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_owner'); END IF;
  IF p_user_id = v_caller THEN RETURN jsonb_build_object('ok', false, 'reason', 'already_owner'); END IF;
  SELECT clan_id INTO v_target_clan FROM clan_members WHERE user_id = p_user_id;
  IF v_target_clan IS DISTINCT FROM v_clan THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_in_your_clan'); END IF;
  UPDATE clan_members SET role = 'member' WHERE user_id = v_caller AND clan_id = v_clan;
  UPDATE clan_members SET role = 'owner' WHERE user_id = p_user_id AND clan_id = v_clan;
  UPDATE clans SET owner_id = p_user_id WHERE id = v_clan;
  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION transfer_clan_ownership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION transfer_clan_ownership(uuid) TO authenticated;

-- Dissoudre le clan (owner-only)
CREATE OR REPLACE FUNCTION disband_clan()
RETURNS JSONB AS $$
DECLARE v_caller UUID := auth.uid(); v_clan UUID;
BEGIN
  IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated'); END IF;
  SELECT clan_id INTO v_clan FROM clan_members WHERE user_id = v_caller AND role = 'owner';
  IF v_clan IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_owner'); END IF;
  DELETE FROM clan_members WHERE clan_id = v_clan;
  DELETE FROM clans WHERE id = v_clan;
  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION disband_clan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION disband_clan() TO authenticated;
