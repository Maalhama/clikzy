-- Add new mini-game types: slots, coinflip, dice
-- Drop and recreate the CHECK constraint to include new game types

ALTER TABLE mini_game_plays
DROP CONSTRAINT IF EXISTS mini_game_plays_game_type_check;

ALTER TABLE mini_game_plays
ADD CONSTRAINT mini_game_plays_game_type_check
CHECK (game_type IN ('wheel', 'scratch', 'pachinko', 'slots', 'coinflip', 'dice'));
