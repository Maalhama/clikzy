-- ============================================
-- Migration: Flag pour crédits achetés
-- ============================================

-- Ajouter le flag pour savoir si l'utilisateur a acheté des crédits
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_purchased_credits BOOLEAN DEFAULT false;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_purchased ON profiles(has_purchased_credits);
