-- Badges/Achievements system for CLIKZY

-- Badges definition table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL, -- 'clicks', 'wins', 'games', 'referrals', 'special'
  requirement_value INTEGER NOT NULL DEFAULT 1,
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  credits_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Insert default badges
INSERT INTO badges (id, name, description, icon, category, requirement_type, requirement_value, rarity, credits_reward) VALUES
  -- Click badges
  ('first_click', 'Premier Clic', 'Effectue ton premier clic', '👆', 'clicks', 'clicks', 1, 'common', 0),
  ('click_10', 'Cliqueur Débutant', 'Effectue 10 clics', '🖱️', 'clicks', 'clicks', 10, 'common', 2),
  ('click_50', 'Cliqueur Régulier', 'Effectue 50 clics', '⚡', 'clicks', 'clicks', 50, 'common', 5),
  ('click_100', 'Cliqueur Assidu', 'Effectue 100 clics', '🔥', 'clicks', 'clicks', 100, 'rare', 10),
  ('click_500', 'Cliqueur Expert', 'Effectue 500 clics', '💎', 'clicks', 'clicks', 500, 'epic', 25),
  ('click_1000', 'Cliqueur Légendaire', 'Effectue 1000 clics', '👑', 'clicks', 'clicks', 1000, 'legendary', 50),

  -- Win badges
  ('first_win', 'Première Victoire', 'Remporte ta première partie', '🏆', 'wins', 'wins', 1, 'rare', 10),
  ('win_5', 'Vainqueur', 'Remporte 5 parties', '🥇', 'wins', 'wins', 5, 'epic', 25),
  ('win_10', 'Champion', 'Remporte 10 parties', '🌟', 'wins', 'wins', 10, 'epic', 50),
  ('win_25', 'Maître du Clic', 'Remporte 25 parties', '💫', 'wins', 'wins', 25, 'legendary', 100),

  -- Games played badges
  ('games_5', 'Joueur Actif', 'Participe à 5 parties', '🎮', 'games', 'games', 5, 'common', 2),
  ('games_25', 'Habitué', 'Participe à 25 parties', '🎯', 'games', 'games', 25, 'rare', 10),
  ('games_100', 'Vétéran', 'Participe à 100 parties', '⭐', 'games', 'games', 100, 'epic', 25),

  -- Referral badges
  ('first_referral', 'Parrain', 'Parraine ton premier ami', '🤝', 'referrals', 'referrals', 1, 'rare', 5),
  ('referral_5', 'Ambassadeur', 'Parraine 5 amis', '📣', 'referrals', 'referrals', 5, 'epic', 20),
  ('referral_10', 'Influenceur', 'Parraine 10 amis', '🌐', 'referrals', 'referrals', 10, 'legendary', 50)

ON CONFLICT (id) DO NOTHING;
