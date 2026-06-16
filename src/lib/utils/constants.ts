// Timer constants
export const INITIAL_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms
export const FINAL_PHASE_THRESHOLD = 90 * 1000 // 1min30 - matches timer reset
export const FINAL_PHASE_RESET = 90 * 1000 // Reset to 90s - safe margin for cron
export const CLICK_COOLDOWN = 1000 // 1 second between clicks

// Credits
export const INITIAL_CREDITS = 10
export const CREDITS_PER_CLICK = 1

// Jauge (feature EN EXPLORATION — voir cleekzy-gauge-pivot en mémoire).
// GAUGE_ENABLED : déclenche le remplissage côté app. Vit sur feat/shop-redesign,
// NE PAS mettre à true sur main avant validation juridique (sinon prod déclenche).
// GAUGE_MULTIPLIER : cible = valeur de l'item × ce facteur. ⚠️ LEVIER JURIDIQUE —
// 2 = l'user paie le double (PAS safe) ; 1 = plafond au prix réel (défendable).
// DOIT rester aligné avec v_multiplier de la RPC increment_item_gauge.
export const GAUGE_ENABLED = true
export const GAUGE_MULTIPLIER = 2
// GAUGE_ABANDON_DAYS : au-delà de N jours sans clic sur une jauge, la progression
// (jamais perdue) est convertie en avoir crédit permanent (earned_credits) via le
// cron convert-abandoned-gauges. DOIT rester aligné avec le défaut p_days de la RPC.
export const GAUGE_ABANDON_DAYS = 90

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
