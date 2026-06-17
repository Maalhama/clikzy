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

const { mockSessionsList, mockChargesRetrieve, mockSubsCancel } = vi.hoisted(() => ({
  mockSessionsList: vi.fn(),
  mockChargesRetrieve: vi.fn(),
  mockSubsCancel: vi.fn(),
}))
// Évite l'init Stripe réelle (clés absentes en test) ; classe constructible (getStripeInstance
// fait `new Stripe(...)`) exposant checkout.sessions.list + charges.retrieve (détection VIP
// chargeback) + subscriptions.cancel pour le handler de remboursement.
vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = { sessions: { list: mockSessionsList } }
    refunds = { create: vi.fn() }
    charges = { retrieve: mockChargesRetrieve }
    subscriptions = { cancel: mockSubsCancel }
  },
}))

// getSupabaseAdmin()/getStripeInstance() exigent ces variables d'env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'

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
    // Par défaut : charge sans invoice (= pack/cadeau one-shot, pas un abo VIP).
    mockChargesRetrieve.mockResolvedValue({ invoice: null })
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

    it('retire le VIP si la souscription passe en statut non-payant (past_due)', async () => {
      const res = await handleStripeEvent(
        evt('customer.subscription.updated', {
          id: 'sub_3',
          status: 'past_due',
          metadata: { type: 'vip_subscription', userId: 'u-1' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true, downgraded: true })
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_vip: false }))
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
    const res = await handleStripeEvent(evt('payment_intent.succeeded', {}))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true })
  })

  describe('remboursement / litige — reprise des crédits (anti-fraude)', () => {
    it('charge.refunded TOTAL : retrouve la session et reprend les crédits', async () => {
      mockSessionsList.mockResolvedValue({ data: [{ id: 'cs_pack' }] })
      // Pas un cadeau -> clawback_gift_code répond not_a_gift, puis le pack est repris.
      mockRpc.mockImplementation((fn: string) =>
        fn === 'clawback_gift_code'
          ? Promise.resolve({ data: { ok: false, reason: 'not_a_gift' } })
          : Promise.resolve({ data: { ok: true, amount: 175 } })
      )
      const res = await handleStripeEvent(
        evt('charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 1999, amount_refunded: 1999, refunded: true })
      )
      expect(res.status).toBe(200)
      expect(mockSessionsList).toHaveBeenCalledWith({ payment_intent: 'pi_1', limit: 1 })
      expect(mockRpc).toHaveBeenCalledWith('clawback_gift_code', { p_session: 'cs_pack' })
      expect(mockRpc).toHaveBeenCalledWith('clawback_pack_credits', { p_session: 'cs_pack' })
      expect(res.body).toEqual({ received: true, clawed_back: 175 })
    })

    it('charge.refunded PARTIEL : pas de reprise auto (alerte admin manuelle)', async () => {
      const res = await handleStripeEvent(
        evt('charge.refunded', { id: 'ch_2', payment_intent: 'pi_2', amount: 1999, amount_refunded: 500, refunded: false })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true, partial_refund: true })
      expect(mockSessionsList).not.toHaveBeenCalled()
    })

    it('charge.dispute.created : reprise des crédits (chargeback)', async () => {
      mockSessionsList.mockResolvedValue({ data: [{ id: 'cs_disp' }] })
      mockRpc.mockImplementation((fn: string) =>
        fn === 'clawback_gift_code'
          ? Promise.resolve({ data: { ok: false, reason: 'not_a_gift' } })
          : Promise.resolve({ data: { ok: true, amount: 50 } })
      )
      const res = await handleStripeEvent(
        evt('charge.dispute.created', { id: 'dp_1', payment_intent: 'pi_3' })
      )
      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('clawback_pack_credits', { p_session: 'cs_disp' })
      expect(res.body).toEqual({ received: true, clawed_back: 50 })
    })

    it('#101 — chargeback d’un abonnement VIP : retire le statut + coupe l’abo', async () => {
      // La charge porte un invoice d’abonnement VIP -> on remonte aux metadata.
      mockChargesRetrieve.mockResolvedValue({
        invoice: {
          subscription: 'sub_vip',
          subscription_details: { metadata: { type: 'vip_subscription', userId: 'u-9' } },
        },
      })
      const res = await handleStripeEvent(
        evt('charge.refunded', { id: 'ch_vip', payment_intent: 'pi_vip', amount: 1299, amount_refunded: 1299, refunded: true })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true, vip_revoked: true })
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_vip: false }))
      expect(mockSubsCancel).toHaveBeenCalledWith('sub_vip')
      // VIP traité en amont : pas de lookup de session pack/cadeau.
      expect(mockSessionsList).not.toHaveBeenCalled()
    })

    it('#102 — remboursement d’un cadeau : géré par clawback_gift_code, pas le pack', async () => {
      mockSessionsList.mockResolvedValue({ data: [{ id: 'cs_gift' }] })
      mockRpc.mockImplementation((fn: string) =>
        fn === 'clawback_gift_code'
          ? Promise.resolve({ data: { ok: true, voided: true, code: 'ABCD' } })
          : Promise.resolve({ data: { ok: true, amount: 999 } })
      )
      const res = await handleStripeEvent(
        evt('charge.refunded', { id: 'ch_gift', payment_intent: 'pi_gift', amount: 500, amount_refunded: 500, refunded: true })
      )
      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('clawback_gift_code', { p_session: 'cs_gift' })
      // C’était un cadeau -> on n’enchaîne PAS sur le clawback de pack.
      expect(mockRpc).not.toHaveBeenCalledWith('clawback_pack_credits', { p_session: 'cs_gift' })
      expect(res.body).toEqual({ received: true, gift: { ok: true, voided: true, code: 'ABCD' } })
    })
  })

  // Régressions des correctifs de l'audit 2026-06-15
  describe('régressions audit 2026-06-15', () => {
    it('P1.2 — replay idempotent (already_processed) : succès SANS remboursement', async () => {
      mockRpc.mockResolvedValue({ data: { granted: 0, error: 'already_processed' } })
      const res = await handleStripeEvent(
        evt('checkout.session.completed', {
          id: 'cs_replay',
          metadata: { userId: 'u-1', packId: 'starter', credits: '50', monthlyLimit: '0' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true, duplicate: true })
    })

    it('crédit réussi : 200, ni remboursement ni duplicate', async () => {
      mockRpc.mockResolvedValue({ data: { granted: 175 } })
      const res = await handleStripeEvent(
        evt('checkout.session.completed', {
          id: 'cs_ok',
          metadata: { userId: 'u-1', packId: 'popular', credits: '175', monthlyLimit: '0' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true })
    })

    it('P1.3 — Buy It Now non enregistré (ok:false) : remboursement auto', async () => {
      mockRpc.mockResolvedValue({ data: { ok: false, error: 'game_not_found' } })
      const res = await handleStripeEvent(
        evt('checkout.session.completed', {
          id: 'cs_bin',
          metadata: { type: 'buy_it_now', userId: 'u-1', gameId: 'g-1', price: '25.00' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ refunded: true, reason: 'game_not_found' })
    })

    it('Buy It Now enregistré (ok:true) : 200 sans remboursement', async () => {
      mockRpc.mockResolvedValue({ data: { ok: true, recorded: true } })
      const res = await handleStripeEvent(
        evt('checkout.session.completed', {
          id: 'cs_bin_ok',
          metadata: { type: 'buy_it_now', userId: 'u-1', gameId: 'g-1', price: '25.00' },
        })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true })
    })

    it('P0 — VIP : lit current_period_end au niveau de l’item d’abonnement', async () => {
      const res = await handleStripeEvent(
        evt('customer.subscription.updated', {
          id: 'sub_item',
          status: 'active',
          items: { data: [{ current_period_end: 1893456000 }] },
          metadata: { type: 'vip_subscription', userId: 'u-1' },
        })
      )
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_vip: true,
          vip_expires_at: new Date(1893456000 * 1000).toISOString(),
        })
      )
    })
  })
})
