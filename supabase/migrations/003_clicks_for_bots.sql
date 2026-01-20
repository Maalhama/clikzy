-- ============================================
-- Migration: Support des clics de bots
-- ============================================

-- Rendre user_id nullable (les bots n'ont pas d'ID utilisateur)
ALTER TABLE clicks ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter username pour stocker le nom (bot ou joueur)
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS username TEXT;

-- Ajouter item_name pour le feed live (évite les joins)
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS item_name TEXT;

-- Ajouter is_bot pour différencier les clics
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- Index pour récupérer les clics récents (feed live)
CREATE INDEX IF NOT EXISTS idx_clicks_recent ON clicks(clicked_at DESC);

-- Mettre à jour la policy pour permettre les insertions de bots (via service role)
-- Les clics de bots seront insérés via SUPABASE_SERVICE_ROLE_KEY

-- Policy pour lecture publique (anon aussi, pour le feed public)
DROP POLICY IF EXISTS "Clicks are viewable by everyone" ON clicks;
CREATE POLICY "Clicks are viewable by everyone"
  ON clicks FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy pour insertion par authenticated (vrais joueurs)
DROP POLICY IF EXISTS "Authenticated users can insert own clicks" ON clicks;
CREATE POLICY "Authenticated users can insert clicks"
  ON clicks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);
