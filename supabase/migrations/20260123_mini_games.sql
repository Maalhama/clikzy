-- Mini-games table for tracking plays
CREATE TABLE mini_game_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('wheel', 'scratch', 'pachinko')),
  credits_won INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for checking daily plays efficiently
CREATE INDEX idx_mini_game_plays_user_date ON mini_game_plays(user_id, game_type, played_at);

-- RLS policies
ALTER TABLE mini_game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plays" ON mini_game_plays
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plays" ON mini_game_plays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to add credits from mini-game win
CREATE OR REPLACE FUNCTION add_mini_game_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO new_credits;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can play a specific game today
CREATE OR REPLACE FUNCTION can_play_mini_game(p_user_id UUID, p_game_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  last_play TIMESTAMPTZ;
  today_start TIMESTAMPTZ;
BEGIN
  -- Get today's start (midnight in UTC)
  today_start := date_trunc('day', NOW());

  -- Check for any play today
  SELECT played_at INTO last_play
  FROM mini_game_plays
  WHERE user_id = p_user_id
    AND game_type = p_game_type
    AND played_at >= today_start
  LIMIT 1;

  -- If no play found today, user can play
  RETURN last_play IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
