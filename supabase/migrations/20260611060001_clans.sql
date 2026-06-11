-- ============================================================
-- CLANS : équipes de joueurs + classement collectif (somme des XP).
-- Un joueur = un seul clan (PK user_id). Écriture via RPC DEFINER only.
-- ============================================================

CREATE TABLE IF NOT EXISTS clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clans public read" ON clans;
CREATE POLICY "Clans public read" ON clans FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS clan_members (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'officer', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clan members public read" ON clan_members;
CREATE POLICY "Clan members public read" ON clan_members FOR SELECT TO anon, authenticated USING (true);

-- Créer un clan (le créateur devient owner). Refuse si déjà dans un clan.
CREATE OR REPLACE FUNCTION create_clan(p_name TEXT, p_tag TEXT, p_desc TEXT DEFAULT NULL)
RETURNS TABLE(ok BOOLEAN, reason TEXT, clan_id UUID) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_name TEXT := trim(p_name);
  v_tag TEXT := upper(trim(p_tag));
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text, NULL::uuid; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM clan_members WHERE user_id = v_user) THEN
    RETURN QUERY SELECT false, 'already_in_clan'::text, NULL::uuid; RETURN;
  END IF;
  IF char_length(v_name) < 3 OR char_length(v_name) > 24 THEN
    RETURN QUERY SELECT false, 'bad_name'::text, NULL::uuid; RETURN;
  END IF;
  IF v_tag !~ '^[A-Z0-9]{2,5}$' THEN
    RETURN QUERY SELECT false, 'bad_tag'::text, NULL::uuid; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM clans WHERE lower(name) = lower(v_name)) THEN
    RETURN QUERY SELECT false, 'name_taken'::text, NULL::uuid; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM clans WHERE tag = v_tag) THEN
    RETURN QUERY SELECT false, 'tag_taken'::text, NULL::uuid; RETURN;
  END IF;

  INSERT INTO clans(name, tag, description, owner_id) VALUES (v_name, v_tag, NULLIF(trim(p_desc), ''), v_user)
  RETURNING id INTO v_id;
  INSERT INTO clan_members(user_id, clan_id, role) VALUES (v_user, v_id, 'owner');
  RETURN QUERY SELECT true, 'ok'::text, v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION create_clan(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_clan(text, text, text) TO authenticated;

-- Rejoindre un clan
CREATE OR REPLACE FUNCTION join_clan(p_clan_id UUID)
RETURNS TABLE(ok BOOLEAN, reason TEXT) AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM clan_members WHERE user_id = v_user) THEN
    RETURN QUERY SELECT false, 'already_in_clan'::text; RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM clans WHERE id = p_clan_id) THEN
    RETURN QUERY SELECT false, 'not_found'::text; RETURN;
  END IF;
  INSERT INTO clan_members(user_id, clan_id, role) VALUES (v_user, p_clan_id, 'member');
  RETURN QUERY SELECT true, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION join_clan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_clan(uuid) TO authenticated;

-- Quitter son clan. Si owner : transfère au membre le plus ancien, sinon dissout.
CREATE OR REPLACE FUNCTION leave_clan()
RETURNS TABLE(ok BOOLEAN, reason TEXT) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_clan UUID;
  v_role TEXT;
  v_next UUID;
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text; RETURN; END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM clan_members WHERE user_id = v_user;
  IF v_clan IS NULL THEN RETURN QUERY SELECT false, 'not_in_clan'::text; RETURN; END IF;

  DELETE FROM clan_members WHERE user_id = v_user;

  IF v_role = 'owner' THEN
    SELECT user_id INTO v_next FROM clan_members WHERE clan_id = v_clan ORDER BY joined_at ASC LIMIT 1;
    IF v_next IS NULL THEN
      DELETE FROM clans WHERE id = v_clan;  -- plus personne : dissolution
    ELSE
      UPDATE clan_members SET role = 'owner' WHERE user_id = v_next;
      UPDATE clans SET owner_id = v_next WHERE id = v_clan;
    END IF;
  END IF;
  RETURN QUERY SELECT true, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION leave_clan() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION leave_clan() TO authenticated;

-- Classement des clans (somme des XP des membres)
CREATE OR REPLACE FUNCTION get_clan_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE(clan_id UUID, name TEXT, tag TEXT, member_count BIGINT, total_xp BIGINT, rank BIGINT) AS $$
  WITH agg AS (
    SELECT c.id, c.name, c.tag,
           COUNT(m.user_id) AS members,
           COALESCE(SUM(p.xp), 0) AS xp
    FROM clans c
    LEFT JOIN clan_members m ON m.clan_id = c.id
    LEFT JOIN profiles p ON p.id = m.user_id
    GROUP BY c.id, c.name, c.tag
  )
  SELECT id, name, tag, members, xp,
         ROW_NUMBER() OVER (ORDER BY xp DESC, members DESC, name ASC)
  FROM agg
  ORDER BY xp DESC, members DESC, name ASC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
GRANT EXECUTE ON FUNCTION get_clan_leaderboard(integer) TO anon, authenticated;
