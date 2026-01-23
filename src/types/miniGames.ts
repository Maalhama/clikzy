export type MiniGameType = 'wheel' | 'scratch' | 'pachinko'

export interface MiniGamePlay {
  id: string
  user_id: string
  game_type: MiniGameType
  credits_won: number
  played_at: string
}

export interface MiniGameEligibility {
  wheel: {
    canPlay: boolean
    lastPlayedAt: string | null
    nextPlayAt: string | null
  }
  scratch: {
    canPlay: boolean
    lastPlayedAt: string | null
    nextPlayAt: string | null
  }
  pachinko: {
    canPlay: boolean
    lastPlayedAt: string | null
    nextPlayAt: string | null
  }
}

export interface MiniGameResult {
  creditsWon: number
  newTotalCredits: number
}

// Wheel segments configuration (8 segments, moyenne: 2.25 crédits)
export const WHEEL_SEGMENTS = [0, 0, 1, 1, 2, 3, 3, 10] as const

// Scratch card possible values weighted (10 valeurs, moyenne: 2.2 crédits)
export const SCRATCH_VALUES = [0, 0, 1, 1, 1, 2, 2, 3, 3, 10] as const

// Pachinko slots configuration (9 slots, moyenne: 2.0 crédits)
export const PACHINKO_SLOTS = [0, 0, 1, 3, 10, 3, 1, 0, 0] as const

// Game info for display
export interface MiniGameInfo {
  type: MiniGameType
  name: string
  description: string
  icon: string
  maxWin: number
}

export const MINI_GAMES_INFO: MiniGameInfo[] = [
  {
    type: 'wheel',
    name: 'Roue de la Fortune',
    description: 'Faites tourner la roue et tentez de gagner jusqu\'à 10 crédits !',
    icon: '🎡',
    maxWin: 10,
  },
  {
    type: 'scratch',
    name: 'Carte à Gratter',
    description: 'Grattez la carte pour révéler votre gain !',
    icon: '🎴',
    maxWin: 10,
  },
  {
    type: 'pachinko',
    name: 'Pachinko',
    description: 'Lancez la bille et regardez-la tomber vers votre récompense !',
    icon: '🎰',
    maxWin: 10,
  },
]
