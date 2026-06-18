import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock Supabase (server client) ---
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Auto-exclusion (jeu responsable) : on contrôle la date renvoyée par test.
const { mockSelfExcludedUntil } = vi.hoisted(() => ({ mockSelfExcludedUntil: vi.fn() }))
vi.mock('@/lib/selfExclusion', () => ({
  selfExcludedUntil: mockSelfExcludedUntil,
  selfExclusionError: (until: Date) => `Compte en pause jusqu'au ${until.toLocaleDateString('fr-FR')}.`,
}))

// Rate-limit : mocké directement pour des tests déterministes (le redeem appelle
// checkRateLimit('gift-redeem:...', 20, 60_000) AVANT redeem_gift_code).
const { mockCheckRateLimit } = vi.hoisted(() => ({ mockCheckRateLimit: vi.fn() }))
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

// getClientIP lit les headers (mockés globalement -> new Headers()) ; on neutralise.
vi.mock('@/lib/security/audit', () => ({
  getClientIP: vi.fn(() => 'test-ip'),
}))

import { redeemGift } from '@/actions/gift'

describe('redeemGift — réclamation d’un code cadeau (chemin argent)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Par défaut : utilisateur connecté, non exclu, rate-limit OK.
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSelfExcludedUntil.mockResolvedValue(null)
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 19, resetIn: 60_000 })
  })

  it('rejette un utilisateur non authentifié (redeem_gift_code NON appelé)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await redeemGift('GIFT1234')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Connecte-toi pour réclamer ton cadeau.')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('rejette un code vide (redeem_gift_code NON appelé)', async () => {
    const res = await redeemGift('   ')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Entre un code cadeau.')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('refuse un compte auto-exclu — redeem_gift_code NON appelé', async () => {
    const until = new Date('2030-01-01T00:00:00Z')
    mockSelfExcludedUntil.mockResolvedValue(until)
    const res = await redeemGift('GIFT1234')
    expect(res.success).toBe(false)
    expect(res.error).toContain('Compte en pause')
    // Garde jeu responsable : aucune réclamation tentée.
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('refuse si le rate-limit est dépassé — redeem_gift_code NON appelé', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0, resetIn: 60_000 })
    const res = await redeemGift('GIFT1234')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Trop de tentatives. Réessaie dans une minute.')
    // Le rate-limit est vérifié AVANT la RPC.
    expect(mockCheckRateLimit).toHaveBeenCalledWith('gift-redeem:test-ip', 20, 60_000)
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('succès nominal (crédits) ⇒ { success:true, data:{kind,credits} }', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: { ok: true, kind: 'credits', credits: 175 },
      error: null,
    })
    const res = await redeemGift(' giftcode ')
    expect(res.success).toBe(true)
    expect(res.data).toEqual({ kind: 'credits', credits: 175, vipDays: undefined })
    // Code trimmé + user id transmis à la RPC.
    expect(mockSupabase.rpc).toHaveBeenCalledWith('redeem_gift_code', {
      p_code: 'giftcode',
      p_user_id: 'user-1',
    })
  })

  it('succès nominal (VIP) ⇒ data.kind=vip + vipDays', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: { ok: true, kind: 'vip', vip_days: 30 },
      error: null,
    })
    const res = await redeemGift('VIPCODE')
    expect(res.success).toBe(true)
    expect(res.data).toEqual({ kind: 'vip', credits: undefined, vipDays: 30 })
  })

  it('mappe l’erreur already_redeemed', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { ok: false, error: 'already_redeemed' }, error: null })
    const res = await redeemGift('USEDCODE')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Ce cadeau a déjà été réclamé.')
  })

  it('mappe l’erreur own_gift', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { ok: false, error: 'own_gift' }, error: null })
    const res = await redeemGift('MYOWNCODE')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Tu ne peux pas réclamer ton propre cadeau.')
  })

  it('mappe l’erreur expired', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { ok: false, error: 'expired' }, error: null })
    const res = await redeemGift('OLDCODE')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Ce cadeau a expiré.')
  })

  it('fallback sur un reason inconnu ⇒ « Code invalide. »', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { ok: false, error: 'wat' }, error: null })
    const res = await redeemGift('WEIRDCODE')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Code invalide.')
  })

  it('erreur SQL de la RPC ⇒ échec propre (pas de crash)', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'db down' } })
    const res = await redeemGift('GIFT1234')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Erreur lors de la réclamation.')
  })
})
