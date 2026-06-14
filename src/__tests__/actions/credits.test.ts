import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

import { checkAndResetDailyCredits, collectVIPDailyBonus, canCollectVIPBonus } from '@/actions/credits'

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

  describe('collectVIPDailyBonus', () => {
    it('refuse les non-VIP avec le bon message', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [{ ok: false, reason: 'not_vip' }], error: null })
      const res = await collectVIPDailyBonus()
      expect(res.success).toBe(false)
      expect(res.error).toContain('V.I.P')
    })

    it('refuse un abonnement expiré', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [{ ok: false, reason: 'expired' }], error: null })
      const res = await collectVIPDailyBonus()
      expect(res.success).toBe(false)
      expect(res.error?.toLowerCase()).toContain('expiré')
    })

    it('refuse un double claim le même jour', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [{ ok: false, reason: 'already' }], error: null })
      const res = await collectVIPDailyBonus()
      expect(res.success).toBe(false)
      expect(res.error?.toLowerCase()).toContain('demain')
    })

    it('crédite exactement +10 (montant figé serveur) en cas de succès', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [{ ok: true, earned: 60 }], error: null })
      mockProfileSelect({ credits: 10, earned_credits: 60 })
      const res = await collectVIPDailyBonus()
      expect(res.success).toBe(true)
      expect(res.data?.creditsAdded).toBe(10)
      expect(res.data?.newTotal).toBe(70)
    })
  })

  describe('canCollectVIPBonus (frontière de jour Europe/Paris)', () => {
    it('non-VIP → jamais collectable', async () => {
      mockProfileSelect({ is_vip: false, vip_expires_at: null, last_vip_bonus_at: null })
      const res = await canCollectVIPBonus()
      expect(res.data?.canCollect).toBe(false)
    })

    it('VIP expiré → non collectable', async () => {
      mockProfileSelect({
        is_vip: true,
        vip_expires_at: new Date(Date.now() - 86_400_000).toISOString(),
        last_vip_bonus_at: null,
      })
      const res = await canCollectVIPBonus()
      expect(res.data?.canCollect).toBe(false)
    })

    it('VIP jamais collecté → NON collectable (bonus déprécié : 20/j auto)', async () => {
      mockProfileSelect({ is_vip: true, vip_expires_at: null, last_vip_bonus_at: null })
      const res = await canCollectVIPBonus()
      expect(res.data?.canCollect).toBe(false)
    })

    it('déjà collecté il y a un instant (même jour Paris) → non collectable', async () => {
      mockProfileSelect({
        is_vip: true,
        vip_expires_at: null,
        last_vip_bonus_at: new Date(Date.now() - 60_000).toISOString(),
      })
      const res = await canCollectVIPBonus()
      expect(res.data?.canCollect).toBe(false)
    })

    it('collecté il y a 48h → toujours NON collectable (bonus déprécié)', async () => {
      mockProfileSelect({
        is_vip: true,
        vip_expires_at: null,
        last_vip_bonus_at: new Date(Date.now() - 48 * 3600_000).toISOString(),
      })
      const res = await canCollectVIPBonus()
      expect(res.data?.canCollect).toBe(false)
    })
  })
})
