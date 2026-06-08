-- Add earned_credits column for permanent credits (from mini-games, purchases)
-- These credits NEVER reset, unlike the daily free credits

ALTER TABLE profiles ADD COLUMN earned_credits INTEGER NOT NULL DEFAULT 0;

-- Update the add_mini_game_credits function to add to earned_credits instead of credits
CREATE OR REPLACE FUNCTION add_mini_game_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_earned INTEGER;
  total_credits INTEGER;
BEGIN
  -- Add to earned_credits (permanent, never reset)
  UPDATE profiles
  SET earned_credits = earned_credits + p_amount
  WHERE id = p_user_id
  RETURNING earned_credits INTO new_earned;

  -- Return total credits (daily + earned)
  SELECT credits + earned_credits INTO total_credits
  FROM profiles WHERE id = p_user_id;

  RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total credits (for display)
CREATE OR REPLACE FUNCTION get_total_credits(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(credits, 0) + COALESCE(earned_credits, 0)
  FROM profiles WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to deduct credits (uses daily first, then earned)
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_daily INTEGER;
  current_earned INTEGER;
  remaining INTEGER;
  new_total INTEGER;
BEGIN
  -- Get current credits
  SELECT credits, earned_credits INTO current_daily, current_earned
  FROM profiles WHERE id = p_user_id;

  -- Check if enough total credits
  IF (current_daily + current_earned) < p_amount THEN
    RETURN -1; -- Not enough credits
  END IF;

  remaining := p_amount;

  -- Deduct from daily credits first
  IF current_daily >= remaining THEN
    UPDATE profiles SET credits = credits - remaining WHERE id = p_user_id;
  ELSE
    -- Use all daily credits and some earned credits
    remaining := remaining - current_daily;
    UPDATE profiles
    SET credits = 0, earned_credits = earned_credits - remaining
    WHERE id = p_user_id;
  END IF;

  -- Return new total
  SELECT credits + earned_credits INTO new_total FROM profiles WHERE id = p_user_id;
  RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
