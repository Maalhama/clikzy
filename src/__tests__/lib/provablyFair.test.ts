import { describe, it, expect } from 'vitest'
import { fairFloat, computeMiniGameOutcome, makeFairGenerator, sha256Hex } from '@/lib/provablyFair'
import { WHEEL_SEGMENTS, PACHINKO_SLOTS, SCRATCH_VALUES, SLOTS_PAYOUTS } from '@/types/miniGames'

describe('Provably-fair — déterminisme', () => {
  it('fairFloat est déterministe (mêmes entrées → même sortie) et dans [0,1)', () => {
    const a = fairFloat('srv', 'cli', 3, 0)
    const b = fairFloat('srv', 'cli', 3, 0)
    expect(a).toBe(b)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(1)
  })

  it('un seed/nonce/cursor différent change la sortie', () => {
    expect(fairFloat('srv', 'cli', 3, 0)).not.toBe(fairFloat('srv', 'cli', 3, 1))
    expect(fairFloat('srv', 'cli', 3, 0)).not.toBe(fairFloat('srv', 'cli', 4, 0))
    expect(fairFloat('srv', 'cli', 3, 0)).not.toBe(fairFloat('srv2', 'cli', 3, 0))
  })

  it('sha256Hex est stable (commit vérifiable)', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('le même (server, client, nonce) reproduit exactement le résultat (vérifiabilité)', () => {
    const r1 = computeMiniGameOutcome('wheel', makeFairGenerator('s', 'c', 7))
    const r2 = computeMiniGameOutcome('wheel', makeFairGenerator('s', 'c', 7))
    expect(r1).toEqual(r2)
  })
})

describe('computeMiniGameOutcome — invariant gain = table[index]', () => {
  it('roue : index = floor(float * len), gain = WHEEL_SEGMENTS[index]', () => {
    // float fixé à 0 -> index 0 ; à 0.99 -> dernier index
    expect(computeMiniGameOutcome('wheel', () => 0)).toMatchObject({ segmentIndex: 0, creditsWon: WHEEL_SEGMENTS[0] })
    const last = WHEEL_SEGMENTS.length - 1
    expect(computeMiniGameOutcome('wheel', () => 0.999)).toMatchObject({ segmentIndex: last, creditsWon: WHEEL_SEGMENTS[last] })
  })

  it('pachinko : gain = PACHINKO_SLOTS[slotIndex]', () => {
    const last = PACHINKO_SLOTS.length - 1
    expect(computeMiniGameOutcome('pachinko', () => 0.999)).toMatchObject({ slotIndex: last, creditsWon: PACHINKO_SLOTS[last] })
  })

  it('aucun gain ne dépasse le plafond serveur (5)', () => {
    for (const t of [WHEEL_SEGMENTS, SCRATCH_VALUES, PACHINKO_SLOTS, SLOTS_PAYOUTS]) {
      expect(Math.max(...t)).toBeLessThanOrEqual(5)
    }
  })

  it('coinflip : <0.1 gagne 5, sinon 0', () => {
    expect(computeMiniGameOutcome('coinflip', () => 0.05)).toMatchObject({ creditsWon: 5, coinResult: 'heads' })
    expect(computeMiniGameOutcome('coinflip', () => 0.5)).toMatchObject({ creditsWon: 0, coinResult: 'tails' })
  })
})
