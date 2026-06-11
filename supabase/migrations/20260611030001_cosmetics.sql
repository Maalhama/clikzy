-- ============================================================
-- COSMÉTIQUES : curseur, traînée de clic, cadre d'avatar.
-- Pur prestige (zéro impact sur l'équité de jeu). Débloqués par niveau
-- (gratuit) ou marqués premium (achat futur). Le RPC fait autorité :
-- impossible d'équiper un cosmétique non débloqué via PostgREST direct.
-- ============================================================

CREATE TABLE IF NOT EXISTS cosmetics_catalog (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('cursor', 'trail', 'frame')),
  name TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  unlock_level INTEGER NOT NULL DEFAULT 1,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE cosmetics_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cosmetics catalog public" ON cosmetics_catalog;
CREATE POLICY "Cosmetics catalog public" ON cosmetics_catalog FOR SELECT TO anon, authenticated USING (true);

-- Cosmétiques premium possédés (achat). Les gratuits ne sont PAS listés ici :
-- la possession se déduit du niveau.
CREATE TABLE IF NOT EXISTS user_cosmetics (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL REFERENCES cosmetics_catalog(id),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cosmetic_id)
);
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own cosmetics readable" ON user_cosmetics;
CREATE POLICY "Own cosmetics readable" ON user_cosmetics
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- Cosmétiques équipés (un par type)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cosmetic_cursor TEXT NOT NULL DEFAULT 'cursor_default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cosmetic_trail TEXT NOT NULL DEFAULT 'trail_none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cosmetic_frame TEXT NOT NULL DEFAULT 'frame_default';

-- Lecture publique des cosmétiques équipés (cadre visible sur profils publics)
GRANT SELECT (cosmetic_cursor, cosmetic_trail, cosmetic_frame) ON public.profiles TO anon, authenticated;

-- Seed du catalogue (gratuit = unlock_level, premium = achat)
INSERT INTO cosmetics_catalog (id, type, name, rarity, unlock_level, is_premium, sort_order) VALUES
  -- CURSEURS
  ('cursor_default', 'cursor', 'Flèche standard',     'common',    1,  false, 1),
  ('cursor_pink',    'cursor', 'Curseur rose néon',   'rare',      3,  false, 2),
  ('cursor_cyan',    'cursor', 'Curseur cyan',        'rare',      6,  false, 3),
  ('cursor_gold',    'cursor', 'Curseur doré',        'epic',      12, false, 4),
  ('cursor_void',    'cursor', 'Curseur du Vide',     'legendary', 20, false, 5),
  -- TRAÎNÉES DE CLIC
  ('trail_none',     'trail',  'Aucune',              'common',    1,  false, 1),
  ('trail_spark',    'trail',  'Étincelles roses',    'rare',      4,  false, 2),
  ('trail_cyan',     'trail',  'Comète cyan',         'rare',      8,  false, 3),
  ('trail_gold',     'trail',  'Poussière dorée',     'epic',      15, false, 4),
  ('trail_rainbow',  'trail',  'Spectre néon',        'legendary', 25, false, 5),
  -- CADRES D'AVATAR
  ('frame_default',  'frame',  'Anneau violet',       'common',    1,  false, 1),
  ('frame_cyan',     'frame',  'Anneau cyan',         'rare',      5,  false, 2),
  ('frame_gold',     'frame',  'Couronne dorée',      'epic',      10, false, 3),
  ('frame_flames',   'frame',  'Flammes légendaires', 'legendary', 18, false, 4),
  ('frame_cosmic',   'frame',  'Halo cosmique',       'mythic',    30, false, 5)
ON CONFLICT (id) DO NOTHING;

-- Équiper un cosmétique : vérifie type, déblocage (niveau atteint OU possédé
-- si premium). Met à jour la bonne colonne. Fait autorité (DEFINER).
CREATE OR REPLACE FUNCTION equip_cosmetic(p_id TEXT)
RETURNS TABLE(ok BOOLEAN, reason TEXT) AS $$
DECLARE
  v_user UUID := auth.uid();
  v_type TEXT;
  v_unlock INTEGER;
  v_premium BOOLEAN;
  v_level INTEGER;
BEGIN
  IF v_user IS NULL THEN RETURN QUERY SELECT false, 'unauthenticated'::text; RETURN; END IF;

  SELECT type, unlock_level, is_premium INTO v_type, v_unlock, v_premium
  FROM cosmetics_catalog WHERE id = p_id;
  IF v_type IS NULL THEN RETURN QUERY SELECT false, 'not_found'::text; RETURN; END IF;

  SELECT level INTO v_level FROM profiles WHERE id = v_user;

  -- Premium : doit être possédé. Gratuit : niveau requis atteint.
  IF v_premium THEN
    IF NOT EXISTS (SELECT 1 FROM user_cosmetics WHERE user_id = v_user AND cosmetic_id = p_id) THEN
      RETURN QUERY SELECT false, 'locked'::text; RETURN;
    END IF;
  ELSIF COALESCE(v_level, 1) < v_unlock THEN
    RETURN QUERY SELECT false, 'locked'::text; RETURN;
  END IF;

  IF v_type = 'cursor' THEN
    UPDATE profiles SET cosmetic_cursor = p_id WHERE id = v_user;
  ELSIF v_type = 'trail' THEN
    UPDATE profiles SET cosmetic_trail = p_id WHERE id = v_user;
  ELSE
    UPDATE profiles SET cosmetic_frame = p_id WHERE id = v_user;
  END IF;

  RETURN QUERY SELECT true, 'ok'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION equip_cosmetic(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION equip_cosmetic(text) TO authenticated;

-- Protège les colonnes cosmétiques d'une écriture PostgREST directe :
-- on étend le trigger existant en bloquant aussi ces colonnes pour les
-- rôles non-DEFINER. (Le trigger protect_profile_sensitive_columns gère
-- déjà credits/xp/etc ; on ajoute la garde cosmétique.)
CREATE OR REPLACE FUNCTION protect_cosmetic_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) NOT IN ('service_role', 'supabase_admin')
     AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    IF NEW.cosmetic_cursor IS DISTINCT FROM OLD.cosmetic_cursor
       OR NEW.cosmetic_trail IS DISTINCT FROM OLD.cosmetic_trail
       OR NEW.cosmetic_frame IS DISTINCT FROM OLD.cosmetic_frame THEN
      RAISE EXCEPTION 'cosmetic columns are managed via equip_cosmetic()';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;
DROP TRIGGER IF EXISTS trg_protect_cosmetic ON profiles;
CREATE TRIGGER trg_protect_cosmetic BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_cosmetic_columns();
