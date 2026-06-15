'use server'

import { getServerStripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKS, GIFT_VIP_DAYS, GIFT_VIP_PRICE, type GiftCheckoutInput } from '@/lib/stripe/config'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rateLimit'
import { getClientIP } from '@/lib/security/audit'

type ActionResult<T = void> = { success: boolean; data?: T; error?: string }

/**
 * Crée la session Stripe pour OFFRIR un cadeau. Aucun crédit n'est attribué à
 * l'achat : le webhook génère un code que le destinataire réclamera. Pas de
 * remise VIP ni de x2 (le cadeau est un produit distinct).
 */
export async function createGiftCheckout(input: GiftCheckoutInput): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const stripe = getServerStripe()
  if (!stripe) return { success: false, error: 'Service de paiement non configuré' }

  const { data: profileData } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  const gifterUsername = (profileData as { username: string } | null)?.username || 'Un joueur'

  // Construction de la ligne + métadonnées selon le type de cadeau.
  let productName: string
  let unitAmount: number
  const metadata: Record<string, string> = {
    type: 'gift',
    gifterId: user.id,
    gifterUsername,
  }

  if (input.kind === 'vip') {
    productName = `Cadeau — VIP ${GIFT_VIP_DAYS} jours`
    unitAmount = Math.round(GIFT_VIP_PRICE * 100)
    metadata.giftKind = 'vip'
    metadata.vipDays = String(GIFT_VIP_DAYS)
    metadata.credits = '0'
  } else {
    const pack = CREDIT_PACKS.find((p) => p.id === input.packId)
    if (!pack) return { success: false, error: 'Pack invalide' }
    productName = `Cadeau — ${pack.credits} crédits (${pack.name})`
    unitAmount = Math.round(pack.price * 100)
    metadata.giftKind = 'credits'
    metadata.credits = String(pack.credits)
    metadata.vipDays = '0'
    metadata.packId = pack.id
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: productName, description: 'Carte cadeau Cleekzy — à offrir' },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: { statement_descriptor: 'CLEEKZY' },
      success_url: `${baseUrl}/cadeau/merci?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cadeau/offrir?cancelled=1`,
      customer_email: user.email,
      metadata,
    })
    if (!session.url) return { success: false, error: 'Erreur lors de la création de la session' }
    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('[GIFT] checkout error:', error)
    return { success: false, error: 'Erreur Stripe' }
  }
}

export interface GiftDetails {
  found: boolean
  kind?: 'credits' | 'vip'
  credits?: number
  vipDays?: number
  gifterUsername?: string | null
  redeemed?: boolean
  expired?: boolean
}

/** Détails publics (non-PII) d'un code cadeau pour la page de réclamation. */
export async function getGiftInfo(code: string): Promise<GiftDetails> {
  if (!code || !code.trim()) return { found: false }
  // Rate-limit anti-brute-force (durcissement ; l'espace de codes est déjà énorme).
  const rl = await checkRateLimit(`gift-lookup:${getClientIP(await headers())}`, 30, 60_000)
  if (!rl.success) return { found: false }
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_gift_code', { p_code: code.trim() })
  if (error || !data) return { found: false }
  const r = data as {
    found: boolean
    kind?: 'credits' | 'vip'
    credits?: number
    vip_days?: number
    gifter_username?: string | null
    redeemed?: boolean
    expired?: boolean
  }
  return {
    found: r.found,
    kind: r.kind,
    credits: r.credits,
    vipDays: r.vip_days,
    gifterUsername: r.gifter_username,
    redeemed: r.redeemed,
    expired: r.expired,
  }
}

const REDEEM_ERRORS: Record<string, string> = {
  invalid: 'Code cadeau introuvable.',
  already_redeemed: 'Ce cadeau a déjà été réclamé.',
  expired: 'Ce cadeau a expiré.',
  own_gift: "Tu ne peux pas réclamer ton propre cadeau.",
}

/** Réclame un code cadeau pour le joueur connecté (atomique côté RPC). */
export async function redeemGift(
  code: string
): Promise<ActionResult<{ kind: 'credits' | 'vip'; credits?: number; vipDays?: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Connecte-toi pour réclamer ton cadeau.' }
  if (!code || !code.trim()) return { success: false, error: 'Entre un code cadeau.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('redeem_gift_code', { p_code: code.trim(), p_user_id: user.id })
  if (error) {
    console.error('[GIFT] redeem error:', error)
    return { success: false, error: 'Erreur lors de la réclamation.' }
  }
  const r = data as { ok: boolean; error?: string; kind?: 'credits' | 'vip'; credits?: number; vip_days?: number }
  if (!r?.ok) return { success: false, error: REDEEM_ERRORS[r?.error ?? ''] ?? 'Code invalide.' }
  return { success: true, data: { kind: r.kind!, credits: r.credits, vipDays: r.vip_days } }
}
