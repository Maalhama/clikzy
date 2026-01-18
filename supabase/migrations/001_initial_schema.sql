-- ============================================
-- CLIKZY Database Schema
-- Version: 1.0.0
-- ============================================

-- ============================================
-- PROFILES (extension de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  credits INTEGER DEFAULT 10 CHECK (credits >= 0),
  total_wins INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Trigger pour créer un profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'player_' || LEFT(NEW.id::text, 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ITEMS (objets à gagner)
-- ============================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  retail_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les items actifs
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active) WHERE is_active = true;

-- ============================================
-- GAMES (parties)
-- ============================================
-- Créer le type ENUM pour le statut
DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('waiting', 'active', 'final_phase', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  status game_status DEFAULT 'waiting',

  -- Timer (source de vérité serveur)
  start_time TIMESTAMPTZ,
  end_time BIGINT,                    -- Timestamp en millisecondes
  initial_duration INTEGER DEFAULT 86400000, -- 24h en ms
  final_phase_duration INTEGER DEFAULT 60000, -- 1 min en ms

  -- Dernier clic
  last_click_user_id UUID REFERENCES profiles(id),
  last_click_username TEXT,
  last_click_at TIMESTAMPTZ,

  -- Résultat
  winner_id UUID REFERENCES profiles(id),
  total_clicks INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_active ON games(status, end_time) WHERE status IN ('active', 'final_phase');
CREATE INDEX IF NOT EXISTS idx_games_item ON games(item_id);

-- ============================================
-- CLICKS (historique des clics)
-- ============================================
CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  credits_spent INTEGER DEFAULT 1,

  -- Anti-triche : position dans la séquence
  sequence_number INTEGER NOT NULL
);

-- Index pour vérifier le dernier clic d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_clicks_game_user ON clicks(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_game_sequence ON clicks(game_id, sequence_number DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_user ON clicks(user_id);

-- ============================================
-- WINNERS (historique des gagnants)
-- ============================================
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID UNIQUE NOT NULL REFERENCES games(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  item_id UUID NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  item_value DECIMAL(10,2),
  total_clicks_in_game INTEGER,
  won_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour l'historique d'un joueur
CREATE INDEX IF NOT EXISTS idx_winners_user ON winners(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: PROFILES
-- ============================================

-- Lecture publique des profils
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Modification de son propre profil uniquement
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- POLICIES: ITEMS
-- ============================================

-- Lecture publique des items
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- POLICIES: GAMES
-- ============================================

-- Lecture publique des parties
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  TO authenticated
  USING (true);

-- Mise à jour des parties (sera restreint via Server Actions)
CREATE POLICY "Games can be updated by authenticated users"
  ON games FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- POLICIES: CLICKS
-- ============================================

-- Lecture publique des clics
CREATE POLICY "Clicks are viewable by everyone"
  ON clicks FOR SELECT
  TO authenticated
  USING (true);

-- Insertion de clics par l'utilisateur authentifié
CREATE POLICY "Authenticated users can insert own clicks"
  ON clicks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- POLICIES: WINNERS
-- ============================================

-- Lecture publique des gagnants
CREATE POLICY "Winners are viewable by everyone"
  ON winners FOR SELECT
  TO authenticated
  USING (true);

-- Insertion des gagnants (via Server Actions)
CREATE POLICY "Winners can be inserted by authenticated"
  ON winners FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour décrémenter les crédits de manière atomique
CREATE OR REPLACE FUNCTION decrement_credits(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  v_new_credits INTEGER;
BEGIN
  UPDATE profiles
  SET credits = credits - p_amount,
      total_clicks = total_clicks + 1
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO v_new_credits;

  RETURN COALESCE(v_new_credits, -1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le prochain numéro de séquence
CREATE OR REPLACE FUNCTION get_next_sequence(p_game_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_next
  FROM clicks
  WHERE game_id = p_game_id;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONNÉES DE TEST (optionnel)
-- ============================================

-- Insérer un item de test
INSERT INTO items (name, description, image_url, retail_value)
VALUES (
  'iPhone 15 Pro',
  'Le dernier iPhone avec puce A17 Pro',
  'https://placehold.co/400x400/9B5CFF/EDEDED?text=iPhone+15',
  1229.00
)
ON CONFLICT DO NOTHING;
