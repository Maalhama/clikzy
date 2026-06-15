import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

import { checkAndResetDailyCredits } from '@/actions/credits'

function mockProfileSelect(profile: Record<string, unknown> | null) {
  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile }),
  })
}

describe('Actions crédits (économie)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  describe('checkAndResetDailyCredits', () => {
    it('rejette les non-authentifiés', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const res = await checkAndResetDailyCredits()
      expect(res.success).toBe(false)
    })

    it('mappe correctement le résultat de la RPC (reset effectué)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ daily_credits: 10, earned: 42, was_reset: true }],
        error: null,
      })
      const res = await checkAndResetDailyCredits()
      expect(res.success).toBe(true)
      expect(res.data).toEqual({ credits: 10, earnedCredits: 42, totalCredits: 52, wasReset: true })
    })

    it('totalCredits = crédits quotidiens + earned (jamais autre chose)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ daily_credits: 3, earned: 7, was_reset: false }],
        error: null,
      })
      const res = await checkAndResetDailyCredits()
      expect(res.data?.totalCredits).toBe(10)
      expect(res.data?.wasReset).toBe(false)
    })

    it('échoue proprement si la RPC renvoie une erreur', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
      const res = await checkAndResetDailyCredits()
      expect(res.success).toBe(false)
    })
  })

})
