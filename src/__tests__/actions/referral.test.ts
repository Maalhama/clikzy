import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
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
    // NOTE : depuis le durcissement C3, toute la logique de parrainage (vérifs +
    // crédit du parrain) vit dans la RPC SECURITY DEFINER `apply_referral_code`.
    // Le code TS valide le format + l'auth, puis mappe le `reason` renvoyé par la
    // RPC vers un message. La garantie "earned_credits et non credits" est assurée
    // en SQL et couverte par le test E2E scripts/test-c3-trigger.mjs.

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
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockSupabase.rpc.mockResolvedValue({
        data: [{ ok: false, reason: 'already_referred', credits_awarded: 0 }],
        error: null,
      })

      const result = await applyReferralCode('NEWCODE')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('apply_referral_code', { p_code: 'NEWCODE' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Tu as déjà utilisé un code de parrainage')
    })

    it('should reject using own referral code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockSupabase.rpc.mockResolvedValue({
        data: [{ ok: false, reason: 'own_code', credits_awarded: 0 }],
        error: null,
      })

      const result = await applyReferralCode('MYCODE')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tu ne peux pas utiliser ton propre code')
    })

    it('should reject non-existent referral codes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockSupabase.rpc.mockResolvedValue({
        data: [{ ok: false, reason: 'not_found', credits_awarded: 0 }],
        error: null,
      })

      const result = await applyReferralCode('INVALID')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Code de parrainage introuvable')
    })

    it('should succeed and award bonus credits when code is valid', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockSupabase.rpc.mockResolvedValue({
        data: [{ ok: true, reason: 'ok', credits_awarded: 10 }],
        error: null,
      })

      const result = await applyReferralCode('VALIDCODE')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('apply_referral_code', { p_code: 'VALIDCODE' })
      expect(result.success).toBe(true)
      expect(result.creditsAwarded).toBe(10)
    })
  })
})
