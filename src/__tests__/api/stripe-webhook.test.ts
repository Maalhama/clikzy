import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

// --- Mock Supabase admin (service_role) ---
const mockRpc = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
// Claim d'idempotence (POST) : insert dans `stripe_events` + delete de relâchement.
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockDeleteEq = vi.fn()

const mockAdmin = {
  rpc: mockRpc,
  from: vi.fn(() => ({
    update: mockUpdate.mockReturnValue({ eq: mockEq }),
    insert: mockInsert,
    delete: mockDelete.mockReturnValue({ eq: mockDeleteEq }),
  })),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdmin),
}))

const { mockSessionsList, mockChargesRetrieve, mockSubsCancel, mockConstructEvent } = vi.hoisted(() => ({
  mockSessionsList: vi.fn(),
  mockChargesRetrieve: vi.fn(),
  mockSubsCancel: vi.fn(),
  mockConstructEvent: vi.fn(),
}))
// Évite l'init Stripe réelle (clés absentes en test) ; classe constructible (getStripeInstance
// fait `new Stripe(...)`) exposant checkout.sessions.list + charges.retrieve (détection VIP
// chargeback) + subscriptions.cancel pour le handler de remboursement + webhooks.constructEvent
// (vérif signature au niveau POST).
vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = { sessions: { list: mockSessionsList } }
    refunds = { create: vi.fn() }
    charges = { retrieve: mockChargesRetrieve }
    subscriptions = { cancel: mockSubsCancel }
    webhooks = { constructEvent: mockConstructEvent }
  },
}))

// getSupabaseAdmin()/getStripeInstance() exigent ces variables d'env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy'

import { handleStripeEvent, POST } from '@/app/api/stripe/webhook/route'

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
      // Ni cadeau, ni rachat malin, ni passe -> on enchaîne jusqu'au clawback de pack.
      mockRpc.mockImplementation((fn: string) => {
        if (fn === 'clawback_gift_code') return Promise.resolve({ data: { ok: false, reason: 'not_a_gift' } })
        if (fn === 'clawback_buy_it_now') return Promise.resolve({ data: { ok: false, reason: 'not_a_bin' } })
        if (fn === 'clawback_battle_pass') return Promise.resolve({ data: { ok: false, reason: 'not_a_pass' } })
        return Promise.resolve({ data: { ok: true, amount: 175 } })
      })
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
      mockRpc.mockImplementation((fn: string) => {
        if (fn === 'clawback_gift_code') return Promise.resolve({ data: { ok: false, reason: 'not_a_gift' } })
        if (fn === 'clawback_buy_it_now') return Promise.resolve({ data: { ok: false, reason: 'not_a_bin' } })
        if (fn === 'clawback_battle_pass') return Promise.resolve({ data: { ok: false, reason: 'not_a_pass' } })
        return Promise.resolve({ data: { ok: true, amount: 50 } })
      })
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

    it('#P0-6 — remboursement d’un Rachat malin (buy-it-now) : géré par clawback_buy_it_now, PAS le pack', async () => {
      mockSessionsList.mockResolvedValue({ data: [{ id: 'cs_bin' }] })
      // gift -> not_a_gift, puis buy_it_now -> ok:true (cancelled) => court-circuit.
      mockRpc.mockImplementation((fn: string) => {
        if (fn === 'clawback_gift_code') return Promise.resolve({ data: { ok: false, reason: 'not_a_gift' } })
        if (fn === 'clawback_buy_it_now') return Promise.resolve({ data: { ok: true, cancelled: true } })
        return Promise.resolve({ data: { ok: true, amount: 999 } })
      })
      const res = await handleStripeEvent(
        evt('charge.refunded', { id: 'ch_bin', payment_intent: 'pi_bin', amount: 2500, amount_refunded: 2500, refunded: true })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true, buy_it_now: { ok: true, cancelled: true } })
      // Ordre des RPC respecté : gift -> buy_it_now, puis on s’arrête.
      expect(mockRpc).toHaveBeenCalledWith('clawback_gift_code', { p_session: 'cs_bin' })
      expect(mockRpc).toHaveBeenCalledWith('clawback_buy_it_now', { p_session: 'cs_bin' })
      // Court-circuit : ni passe ni pack ne sont touchés.
      expect(mockRpc).not.toHaveBeenCalledWith('clawback_battle_pass', { p_session: 'cs_bin' })
      expect(mockRpc).not.toHaveBeenCalledWith('clawback_pack_credits', { p_session: 'cs_bin' })
    })

    it('#P1 — chargeback d’une Passe d’Arène : géré par clawback_battle_pass, PAS le pack', async () => {
      mockSessionsList.mockResolvedValue({ data: [{ id: 'cs_pass' }] })
      // gift -> not_a_gift, bin -> not_a_bin, pass -> ok:true => court-circuit avant le pack.
      mockRpc.mockImplementation((fn: string) => {
        if (fn === 'clawback_gift_code') return Promise.resolve({ data: { ok: false, reason: 'not_a_gift' } })
        if (fn === 'clawback_buy_it_now') return Promise.resolve({ data: { ok: false, reason: 'not_a_bin' } })
        if (fn === 'clawback_battle_pass') return Promise.resolve({ data: { ok: true, cancelled: true } })
        return Promise.resolve({ data: { ok: true, amount: 500 } })
      })
      const res = await handleStripeEvent(
        evt('charge.dispute.created', { id: 'dp_pass', payment_intent: 'pi_pass' })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true, battle_pass: { ok: true, cancelled: true } })
      // Ordre attendu : gift -> bin -> pass.
      expect(mockRpc).toHaveBeenCalledWith('clawback_gift_code', { p_session: 'cs_pass' })
      expect(mockRpc).toHaveBeenCalledWith('clawback_buy_it_now', { p_session: 'cs_pass' })
      expect(mockRpc).toHaveBeenCalledWith('clawback_battle_pass', { p_session: 'cs_pass' })
      // La passe a court-circuité : le pack n’est jamais réclamé.
      expect(mockRpc).not.toHaveBeenCalledWith('clawback_pack_credits', { p_session: 'cs_pass' })
    })

    it('aucune session liée au paiement : acquittement sans clawback', async () => {
      mockSessionsList.mockResolvedValue({ data: [] })
      const res = await handleStripeEvent(
        evt('charge.refunded', { id: 'ch_none', payment_intent: 'pi_none', amount: 999, amount_refunded: 999, refunded: true })
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ received: true, no_session: true })
      expect(mockRpc).not.toHaveBeenCalledWith('clawback_gift_code', expect.anything())
    })

    it('clawback_pack_credits en erreur SQL : 500 (Stripe rejouera)', async () => {
      mockSessionsList.mockResolvedValue({ data: [{ id: 'cs_err' }] })
      mockRpc.mockImplementation((fn: string) => {
        if (fn === 'clawback_pack_credits') return Promise.resolve({ data: null, error: { message: 'boom' } })
        return Promise.resolve({ data: { ok: false, reason: `not_a_${fn.replace('clawback_', '')}` } })
      })
      const res = await handleStripeEvent(
        evt('charge.refunded', { id: 'ch_err', payment_intent: 'pi_err', amount: 999, amount_refunded: 999, refunded: true })
      )
      expect(res.status).toBe(500)
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

// Niveau ROUTE (POST) : signature Stripe + claim d'idempotence `stripe_events`.
// On construit une requête minimale (text() + headers) ; constructEvent et l'insert
// du claim sont mockés, donc pas de réseau ni de vraie crypto/DB.
describe('POST /api/stripe/webhook — signature & idempotence', () => {
  function req(opts: { body?: string; signature?: string | null } = {}) {
    const headers = new Headers()
    if (opts.signature !== null) headers.set('stripe-signature', opts.signature ?? 'sig_ok')
    return {
      text: () => Promise.resolve(opts.body ?? '{}'),
      headers,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: { granted: 50 } })
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockChargesRetrieve.mockResolvedValue({ invoice: null })
    // Claim libre par défaut + delete de relâchement OK.
    mockInsert.mockResolvedValue({ error: null })
    mockDeleteEq.mockResolvedValue({ error: null })
    mockDelete.mockReturnValue({ eq: mockDeleteEq })
    // Event valide par défaut.
    mockConstructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_post', metadata: { userId: 'u-1', packId: 'starter', credits: '50', monthlyLimit: '0' } } },
    })
  })

  it('400 si la signature est absente (pas d’appel constructEvent)', async () => {
    const res = await POST(req({ signature: null }))
    expect(res.status).toBe(400)
    expect(mockConstructEvent).not.toHaveBeenCalled()
  })

  it('400 si la signature est invalide (constructEvent jette)', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('bad signature')
    })
    const res = await POST(req({ signature: 'sig_bad' }))
    expect(res.status).toBe(400)
    // Échec de vérif -> on n’a pas touché à l’idempotence ni au métier.
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('claim d’idempotence : insert dans stripe_events avec {id, type}', async () => {
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(mockAdmin.from).toHaveBeenCalledWith('stripe_events')
    expect(mockInsert).toHaveBeenCalledWith({ id: 'evt_1', type: 'checkout.session.completed' })
  })

  it('replay au niveau route : conflit 23505 -> { received:true, duplicate:true } sans traiter le métier', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })
    const res = await POST(req())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ received: true, duplicate: true })
    // Event déjà traité -> on ne recrédite PAS.
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('erreur de claim non-conflit -> 500 (Idempotency error)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '08006', message: 'connection error' } })
    const res = await POST(req())
    expect(res.status).toBe(500)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('échec du traitement (>=400) -> relâche le claim (delete) pour permettre un retry Stripe', async () => {
    // metadata invalide -> handler renvoie 400.
    mockConstructEvent.mockReturnValue({
      id: 'evt_bad',
      type: 'checkout.session.completed',
      data: { object: { metadata: { credits: '50' } } }, // pas de userId/packId
    })
    const res = await POST(req())
    expect(res.status).toBe(400)
    // Le claim est relâché : delete().eq('id', 'evt_bad').
    expect(mockDelete).toHaveBeenCalled()
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'evt_bad')
  })

  it('succès complet : insert claim conservé (pas de delete de relâchement)', async () => {
    const res = await POST(req())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ received: true })
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
