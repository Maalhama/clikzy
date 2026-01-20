// Timer constants
export const INITIAL_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms
export const FINAL_PHASE_THRESHOLD = 60 * 1000 // 1 minute in ms
export const FINAL_PHASE_RESET = 70 * 1000 // Reset to 70s (10s buffer for cron)
export const CLICK_COOLDOWN = 1000 // 1 second between clicks

// Credits
export const INITIAL_CREDITS = 10
export const CREDITS_PER_CLICK = 1

// Game statuses
export const GAME_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINAL_PHASE: 'final_phase',
  ENDED: 'ended',
} as const

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS]

// Consolidated constants object for easier imports
export const GAME_CONSTANTS = {
  INITIAL_DURATION,
  FINAL_PHASE_THRESHOLD,
  TIMER_RESET_VALUE: FINAL_PHASE_RESET,
  CLICK_COOLDOWN,
  INITIAL_CREDITS,
  CREDIT_COST_PER_CLICK: CREDITS_PER_CLICK,
} as const
