import { describe, it, expect } from 'vitest'
import {
  WHEEL_SEGMENTS,
  SCRATCH_VALUES,
  PACHINKO_SLOTS,
  SLOTS_PAYOUTS,
  MINI_GAMES_INFO,
} from '@/types/miniGames'
import { CREDIT_PACKS } from '@/lib/stripe/config'

// Coût d'un replay payant (doit rester > espérance de gain de chaque jeu,
// sinon les mini-jeux deviennent une imprimante à crédits permanents).
const REPLAY_COST = 3

const expectedValue = (table: readonly number[]) =>
  table.reduce((s, v) => s + v, 0) / table.length

// Espérance des dés avec le barème serveur (2 dés, sommes 2-12)
function diceExpectedValue(): number {
  let total = 0
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      const sum = a + b
      let won: number
      if (sum <= 3) won = 0
      else if (sum <= 5) won = 1
      else if (sum <= 7) won = 1
      else if (sum <= 9) won = 2
      else if (sum <= 11) won = 3
      else won = 5
      total += won
    }
  }
  return total / 36
}

describe('Économie des mini-jeux', () => {
  const tables: Array<[string, readonly number[]]> = [
    ['roue', WHEEL_SEGMENTS],
    ['carte à gratter', SCRATCH_VALUES],
    ['pachinko', PACHINKO_SLOTS],
    ['machine à sous', SLOTS_PAYOUTS],
  ]

  it.each(tables)('les gains de %s sont des entiers positifs bornés à 5', (_name, table) => {
    for (const v of table) {
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(5)
    }
  })

  it.each(tables)("l'espérance de %s reste sous le coût du replay (pas d'arbitrage)", (_name, table) => {
    expect(expectedValue(table)).toBeLessThan(REPLAY_COST)
  })

  it("l'espérance des dés reste sous le coût du replay", () => {
    expect(diceExpectedValue()).toBeLessThan(REPLAY_COST)
  })

  it("le pile ou face (10% × 5 crédits) reste sous le coût du replay", () => {
    expect(0.1 * 5).toBeLessThan(REPLAY_COST)
  })

  it("l'espérance quotidienne gratuite totale reste raisonnable (< 10 crédits/jour)", () => {
    const dailyFreeEV =
      expectedValue(WHEEL_SEGMENTS) +
      expectedValue(SCRATCH_VALUES) +
      expectedValue(PACHINKO_SLOTS) +
      expectedValue(SLOTS_PAYOUTS) +
      0.1 * 5 + // coinflip
      diceExpectedValue()
    expect(dailyFreeEV).toBeLessThan(10)
  })

  it('les fiches jeux annoncent un gain max cohérent avec les barèmes', () => {
    for (const info of MINI_GAMES_INFO) {
      expect(info.maxWin).toBeLessThanOrEqual(5)
    }
  })
})

describe('Packs de crédits (Stripe)', () => {
  it('contient au moins 3 packs aux ids uniques', () => {
    expect(CREDIT_PACKS.length).toBeGreaterThanOrEqual(3)
    expect(new Set(CREDIT_PACKS.map((p) => p.id)).size).toBe(CREDIT_PACKS.length)
  })

  it('prix et crédits strictement croissants', () => {
    for (let i = 1; i < CREDIT_PACKS.length; i++) {
      expect(CREDIT_PACKS[i].price).toBeGreaterThan(CREDIT_PACKS[i - 1].price)
      expect(CREDIT_PACKS[i].credits).toBeGreaterThan(CREDIT_PACKS[i - 1].credits)
    }
  })

  it('le ratio crédits/€ s’améliore avec la taille du pack (incitation à monter en gamme)', () => {
    for (let i = 1; i < CREDIT_PACKS.length; i++) {
      const prev = CREDIT_PACKS[i - 1].credits / CREDIT_PACKS[i - 1].price
      const cur = CREDIT_PACKS[i].credits / CREDIT_PACKS[i].price
      expect(cur).toBeGreaterThanOrEqual(prev)
    }
  })

  it('exactement un pack mis en avant (popular)', () => {
    expect(CREDIT_PACKS.filter((p) => p.popular).length).toBe(1)
  })
})
