export type MiniGameType = 'wheel' | 'scratch' | 'pachinko' | 'slots' | 'coinflip' | 'dice'

export interface MiniGamePlay {
  id: string
  user_id: string
  game_type: MiniGameType
  credits_won: number
  played_at: string
  is_free_play: boolean
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
  slots: {
    canPlay: boolean
    lastPlayedAt: string | null
    nextPlayAt: string | null
  }
  coinflip: {
    canPlay: boolean
    lastPlayedAt: string | null
    nextPlayAt: string | null
  }
  dice: {
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

// Slot machine symbols and payouts (moyenne: 2.1 crédits)
export const SLOTS_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'] as const
export const SLOTS_PAYOUTS = [0, 0, 1, 1, 2, 2, 3, 3, 5, 10] as const

// Coin flip payouts (moyenne: 2.0 crédits)
export const COINFLIP_PAYOUTS = [0, 0, 1, 2, 3, 4, 5, 10] as const

// Dice roll payouts based on sum (moyenne: 2.2 crédits)
export const DICE_PAYOUTS = [0, 0, 1, 1, 2, 2, 3, 3, 5, 10] as const

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
  {
    type: 'slots',
    name: 'Machine à Sous',
    description: 'Alignez les symboles et décrochez le jackpot !',
    icon: '🎰',
    maxWin: 10,
  },
  {
    type: 'coinflip',
    name: 'Pile ou Face',
    description: 'Lancez la pièce et tentez votre chance !',
    icon: '🪙',
    maxWin: 10,
  },
  {
    type: 'dice',
    name: 'Lancer de Dés',
    description: 'Lancez les dés et voyez ce que le destin vous réserve !',
    icon: '🎲',
    maxWin: 10,
  },
]
