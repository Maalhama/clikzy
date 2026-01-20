-- ============================================
-- Migration: Support des gagnants bots
-- ============================================

-- Rendre user_id nullable pour permettre les gagnants bots
ALTER TABLE winners ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter le username directement (pour bots et backup)
ALTER TABLE winners ADD COLUMN IF NOT EXISTS username TEXT;

-- Ajouter flag is_bot
ALTER TABLE winners ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- Index pour les requêtes sur les gagnants récents
CREATE INDEX IF NOT EXISTS idx_winners_won_at ON winners(won_at DESC);

-- Mettre à jour les winners existants avec le username du profile
UPDATE winners w
SET username = p.username
FROM profiles p
WHERE w.user_id = p.id AND w.username IS NULL;
