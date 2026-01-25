import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Import après les mocks
import { applyReferralCode } from '@/actions/referral'

describe('Referral System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('applyReferralCode', () => {
    it('should reject invalid referral codes', async () => {
      const result = await applyReferralCode('')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Code invalide')

      const result2 = await applyReferralCode('ABC')
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('Code invalide')
    })

    it('should reject unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      const result = await applyReferralCode('TESTCODE')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Non authentifié')
    })

    it('should reject if user already has a referrer', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { referred_by: 'EXISTING_CODE' },
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      const result = await applyReferralCode('NEWCODE')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tu as déjà utilisé un code de parrainage')
    })

    it('should reject using own referral code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({
          data: { referred_by: null, referral_code: 'MYCODE' },
        })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      const result = await applyReferralCode('MYCODE')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tu ne peux pas utiliser ton propre code')
    })

    it('should reject non-existent referral codes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({
          data: { referred_by: null, referral_code: 'MYCODE' },
        })
        .mockResolvedValueOnce({
          data: null,
        })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      const result = await applyReferralCode('INVALID')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Code de parrainage introuvable')
    })

    it('should add bonus to earned_credits (permanent), not daily credits', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({
          data: { referred_by: null, referral_code: 'MYCODE' },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'referrer-id',
            referral_code: 'VALIDCODE',
            referral_count: 5,
            referral_credits_earned: 50,
            credits: 20,
            earned_credits: 100,
          },
        })

      const mockUpdate = vi.fn().mockReturnThis()

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await applyReferralCode('VALIDCODE')

      expect(result.success).toBe(true)
      expect(result.creditsAwarded).toBe(10)

      // Vérifier que earned_credits est bien mis à jour (CRITIQUE - bug fix)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          earned_credits: 110, // 100 + 10 bonus
          referral_count: 6,
          referral_credits_earned: 60,
        })
      )

      // Vérifier que credits (daily reset) n'est PAS modifié
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          credits: expect.any(Number),
        })
      )
    })
  })
})
