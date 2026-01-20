-- ============================================
-- Migration: Add battle_start_time to games
-- Description: Tracks when the final phase battle started
--              Used by the bot system to determine battle duration
-- ============================================

-- Add battle_start_time column to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS battle_start_time TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN games.battle_start_time IS 'Timestamp when the final phase battle started. Used by bots to determine when to let someone win.';
