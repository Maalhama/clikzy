-- Add is_free_play column to distinguish free vs paid plays
ALTER TABLE mini_game_plays ADD COLUMN is_free_play BOOLEAN NOT NULL DEFAULT true;

-- Update index to include is_free_play for efficient eligibility checks
DROP INDEX IF EXISTS idx_mini_game_plays_user_date;
CREATE INDEX idx_mini_game_plays_user_date ON mini_game_plays(user_id, game_type, played_at, is_free_play);

-- Update the can_play_mini_game function to only check free plays
CREATE OR REPLACE FUNCTION can_play_mini_game(p_user_id UUID, p_game_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  last_play TIMESTAMPTZ;
  today_start TIMESTAMPTZ;
BEGIN
  -- Get today's start (midnight in UTC)
  today_start := date_trunc('day', NOW());

  -- Check for any FREE play today (ignore paid plays)
  SELECT played_at INTO last_play
  FROM mini_game_plays
  WHERE user_id = p_user_id
    AND game_type = p_game_type
    AND played_at >= today_start
    AND is_free_play = true
  LIMIT 1;

  -- If no free play found today, user can play
  RETURN last_play IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
