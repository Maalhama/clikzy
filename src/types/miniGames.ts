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

// Barèmes mini-jeux — Phase 2 (2026-06) : −50% pour rendre les crédits rares
// et faire des packs la vraie source (espérance ~0,6-0,8 crédit << coût replay 3).
// Longueurs inchangées (les visuels roue/slots dépendent du nombre de segments).

// Wheel segments (8 segments, espérance ~0,75)
export const WHEEL_SEGMENTS = [0, 0, 0, 0, 1, 1, 1, 3] as const

// Scratch card (10 valeurs, espérance ~0,7)
export const SCRATCH_VALUES = [0, 0, 0, 0, 0, 0, 1, 1, 2, 3] as const

// Pachinko (9 slots, espérance ~0,56)
export const PACHINKO_SLOTS = [0, 0, 0, 1, 3, 1, 0, 0, 0] as const

// Slot machine (symboles + gains, espérance ~0,8)
export const SLOTS_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'] as const
export const SLOTS_PAYOUTS = [0, 0, 0, 0, 0, 1, 1, 1, 2, 3] as const

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
    description: 'Faites tourner la roue et tentez de gagner jusqu\'à 5 crédits !',
    icon: '🎡',
    maxWin: 5,
  },
  {
    type: 'scratch',
    name: 'Carte à Gratter',
    description: 'Grattez la carte pour révéler votre gain !',
    icon: '🎴',
    maxWin: 5,
  },
  {
    type: 'pachinko',
    name: 'Pachinko',
    description: 'Lancez la bille et regardez-la tomber vers votre récompense !',
    icon: '🎰',
    maxWin: 5,
  },
  {
    type: 'slots',
    name: 'Machine à Sous',
    description: 'Alignez les symboles et décrochez le jackpot !',
    icon: '🎰',
    maxWin: 5,
  },
  {
    type: 'coinflip',
    name: 'Pile ou Face',
    description: 'Lancez la pièce et tentez votre chance !',
    icon: '🪙',
    maxWin: 5,
  },
  {
    type: 'dice',
    name: 'Lancer de Dés',
    description: 'Lancez les dés et voyez ce que le destin vous réserve !',
    icon: '🎲',
    maxWin: 5,
  },
]
