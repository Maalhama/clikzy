import { createHmac, createHash } from 'crypto'
import {
  WHEEL_SEGMENTS, SCRATCH_VALUES, PACHINKO_SLOTS, SLOTS_PAYOUTS, SLOTS_SYMBOLS,
  type MiniGameType,
} from '@/types/miniGames'

/** Float déterministe [0,1) = HMAC-SHA256(server_seed, client_seed:nonce:cursor). */
export function fairFloat(serverSeed: string, clientSeed: string, nonce: number, cursor: number): number {
  const hex = createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}:${cursor}`)
    .digest('hex')
    .slice(0, 13) // 52 bits
  return parseInt(hex, 16) / 0x10000000000000
}

export function sha256Hex(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

export type MiniGameOutcome = {
  creditsWon: number
  segmentIndex?: number
  slotIndex?: number
  slotsSymbols?: number[]
  coinResult?: 'heads' | 'tails'
  diceResults?: [number, number]
}

/**
 * Calcule le résultat d'un mini-jeu à partir d'un générateur de float.
 * Source UNIQUE de vérité (utilisée par play gratuit ET payant) — la
 * distribution sur chaque table reste uniforme, donc l'EV est inchangée.
 */
export function computeMiniGameOutcome(gameType: MiniGameType, next: () => number): MiniGameOutcome {
  switch (gameType) {
    case 'wheel': {
      const segmentIndex = Math.floor(next() * WHEEL_SEGMENTS.length)
      return { creditsWon: WHEEL_SEGMENTS[segmentIndex], segmentIndex }
    }
    case 'scratch': {
      const i = Math.floor(next() * SCRATCH_VALUES.length)
      return { creditsWon: SCRATCH_VALUES[i] }
    }
    case 'pachinko': {
      const slotIndex = Math.floor(next() * PACHINKO_SLOTS.length)
      return { creditsWon: PACHINKO_SLOTS[slotIndex], slotIndex }
    }
    case 'slots': {
      const slotsSymbols = [
        Math.floor(next() * SLOTS_SYMBOLS.length),
        Math.floor(next() * SLOTS_SYMBOLS.length),
        Math.floor(next() * SLOTS_SYMBOLS.length),
      ]
      const payoutIndex = Math.floor(next() * SLOTS_PAYOUTS.length)
      return { creditsWon: SLOTS_PAYOUTS[payoutIndex], slotsSymbols }
    }
    case 'coinflip': {
      const isWin = next() < 0.1
      return { creditsWon: isWin ? 3 : 0, coinResult: isWin ? 'heads' : 'tails' }
    }
    case 'dice': {
      const diceResults: [number, number] = [
        Math.floor(next() * 6) + 1,
        Math.floor(next() * 6) + 1,
      ]
      const sum = diceResults[0] + diceResults[1]
      let creditsWon: number
      // Phase 2 (−50%) : seuils relevés, top réduit
      if (sum <= 6) creditsWon = 0
      else if (sum <= 9) creditsWon = 1
      else if (sum <= 11) creditsWon = 2
      else creditsWon = 3
      return { creditsWon, diceResults }
    }
    default:
      return { creditsWon: 0 }
  }
}

/** Générateur de float séquentiel (curseur auto-incrémenté par tirage). */
export function makeFairGenerator(serverSeed: string, clientSeed: string, nonce: number): () => number {
  let cursor = 0
  return () => fairFloat(serverSeed, clientSeed, nonce, cursor++)
}
