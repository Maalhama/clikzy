import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

// --- Mock Supabase admin (service_role) ---
const mockRpc = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()

const mockAdmin = {
  rpc: mockRpc,
  from: vi.fn(() => ({
    update: mockUpdate.mockReturnValue({ eq: mockEq }),
  })),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdmin),
}))

// Évite l'init Stripe réelle (clés absentes en test)
vi.mock('stripe', () => ({ default: vi.fn(() => ({})) }))

// getSupabaseAdmin() exige ces variables d'env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

import { handleStripeEvent } from '@/app/api/stripe/webhook/route'

function evt(type: string, object: Record<string, unknown>): Stripe.Event {
  return { type, data: { object } } as unknown as Stripe.Event
}

describe('handleStripeEvent — logique métier des paiements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ error: null })
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
  })

  describe('checkout.session.completed — crédits', () => {
    it('crédite le montant exact issu de la metadata serveur', async () => {
      const res = await handleStripeEvent(
        evt('checkout.session.completed', {
          id: 'cs_pack',
          metadata: { userId: 'u-1', packId: 'popular', credits: '175', monthlyLimit: '0' },
        })
      )
      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('grant_pack_credits', {
        p_user_id: 'u-1',
        p_pack_id: 'popular',
        p_base_credits: 175,
        p_session: 'cs_pack',
        p_monthly_limit: false,
      })
    })

    it('rejette une session sans userId', async () => {
      const res = await handleStripeEvent(
        evt('checkout.session.completed', { metadata: { credits: '50' } })
      )
      expect(res.status).toBe(400)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('rejette un montant de crédits nul ou négatif', async () => {
      const res = await handleStripeEvent(
        evt('checkout.session.completed', { metadata: { userId: 'u-1', packId: 'starter', credits: '0' } })
      )
      expect(res.status).toBe(400)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('remonte une erreur 500 si le RPC de crédit échoue', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'db down' } })
      const res = await handleStripeEvent(
        evt('checkout.session.completed', { metadata: { userId: 'u-1', packId: 'starter', credits: '50', monthlyLimit: '0' } })
      )
      expect(res.status).toBe(500)
    })
  })

  describe('checkout.session.completed — Passe d’Arène', () => {
    it('active le pass via grant_battle_pass (idempotent côté SQL)', async () => {
      const res = await handleStripeEvent(
        evt('checkout.session.completed', {
          id: 'cs_123',
          metadata: { userId: 'u-1', type: 'battle_pass' },
        })
      )
      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('grant_battle_pass', {
        p_user_id: 'u-1',
        p_session: 'cs_123',
      })
      // Ne crédite PAS de crédits par erreur
      expect(mockRpc).not.toHaveBeenCalledWith('grant_pack_credits', expect.anything())
    })

    it('rejette un pass sans userId', async () => {
      const res = await handleStripeEvent(
        evt('checkout.session.completed', { id: 'cs_1', metadata: { type: 'battle_pass' } })
      )
      expect(res.status).toBe(400)
      expect(mockRpc).not.toHaveBeenCalled()
    })
  })

  describe('abonnement VIP', () => {
    it('active le VIP quand la souscription est active', async () => {
      const res = await handleStripeEvent(
        evt('customer.subscription.created', {
          id: 'sub_1',
          status: 'active',
          current_period_end: 1893456000,
          metadata: { type: 'vip_subscription', userId: 'u-1' },
        })
      )
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ is_vip: true, vip_subscription_id: 'sub_1' })
      )
    })

    it('ignore une souscription non-VIP (autre produit)', async () => {
      const res = await handleStripeEvent(
        evt('customer.subscription.created', {
          id: 'sub_2',
          status: 'active',
          metadata: { type: 'autre_chose', userId: 'u-1' },
        })
      )
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('n’active pas le VIP si la souscription n’est pas active', async () => {
      const res = await handleStripeEvent(
        evt('customer.subscription.created', {
          id: 'sub_3',
          status: 'incomplete',
          metadata: { type: 'vip_subscription', userId: 'u-1' },
        })
      )
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('désactive le VIP à la suppression de la souscription', async () => {
      const res = await handleStripeEvent(
        evt('customer.subscription.deleted', {
          id: 'sub_1',
          metadata: { type: 'vip_subscription', userId: 'u-1' },
        })
      )
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ is_vip: false })
      )
    })
  })

  it('ignore proprement un type d’événement non géré', async () => {
    const res = await handleStripeEvent(evt('charge.refunded', {}))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true })
  })
})
