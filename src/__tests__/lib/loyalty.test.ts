import { describe, it, expect } from 'vitest'
import { getLoyaltyRank, LOYALTY_RANKS } from '@/lib/loyalty'

describe('getLoyaltyRank', () => {
  it('starts everyone at Bronze', () => {
    const r = getLoyaltyRank(0)
    expect(r.current.key).toBe('bronze')
    expect(r.next?.key).toBe('argent')
  })

  it('promotes at each threshold (inclusive)', () => {
    expect(getLoyaltyRank(499).current.key).toBe('bronze')
    expect(getLoyaltyRank(500).current.key).toBe('argent')
    expect(getLoyaltyRank(2000).current.key).toBe('or')
    expect(getLoyaltyRank(8000).current.key).toBe('platine')
    expect(getLoyaltyRank(25000).current.key).toBe('diamant')
  })

  it('caps at Diamant with no next rank', () => {
    const r = getLoyaltyRank(999999)
    expect(r.current.key).toBe('diamant')
    expect(r.next).toBeNull()
    expect(r.progress).toBe(100)
    expect(r.clicksToNext).toBe(0)
  })

  it('computes progress and remaining clicks toward the next rank', () => {
    // Argent (500) -> Or (2000) : span 1500, à 1250 on est à 750/1500 = 50%
    const r = getLoyaltyRank(1250)
    expect(r.current.key).toBe('argent')
    expect(r.next?.key).toBe('or')
    expect(r.progress).toBe(50)
    expect(r.clicksToNext).toBe(750)
  })

  it('handles invalid input defensively', () => {
    expect(getLoyaltyRank(-100).current.key).toBe('bronze')
    expect(getLoyaltyRank(Number.NaN).current.key).toBe('bronze')
  })

  it('keeps ranks in ascending threshold order', () => {
    for (let i = 1; i < LOYALTY_RANKS.length; i++) {
      expect(LOYALTY_RANKS[i].min).toBeGreaterThan(LOYALTY_RANKS[i - 1].min)
    }
  })
})
