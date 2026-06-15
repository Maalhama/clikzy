'use server'

import { getServerStripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = { success: boolean; data?: T; error?: string }

export interface BuyItNowOffer {
  gameId: string
  itemId: string
  itemName: string
  itemImage: string
  retailValue: number
  creditsSpent: number
  price: number
  expiresAt: string
}

/** Offres de rachat malin pour le joueur connecté (enchères perdues < 48h). */
export async function getBuyItNowOffers(): Promise<ActionResult<BuyItNowOffer[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_buy_it_now_offers', { p_user_id: user.id })
  if (error) {
    console.error('[BUYITNOW] offers error:', error)
    return { success: false, error: 'Erreur lors du chargement des offres' }
  }
  const offers: BuyItNowOffer[] = (data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => ({
      gameId: r.game_id,
      itemId: r.item_id,
      itemName: r.item_name,
      itemImage: r.item_image,
      retailValue: Number(r.retail_value),
      creditsSpent: Number(r.credits_spent),
      price: Number(r.price),
      expiresAt: r.expires_at,
    }),
  )
  return { success: true, data: offers }
}

/** Offre de rachat pour UNE partie précise (null si non éligible). Utilisé à
 *  l'écran de résultat d'enchère (le moment de la perte = pic de conversion). */
export async function getBuyItNowOffer(gameId: string): Promise<ActionResult<BuyItNowOffer | null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_buy_it_now_offers', { p_user_id: user.id })
  if (error) return { success: false, error: 'Erreur' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (data ?? []).find((x: any) => x.game_id === gameId)
  if (!r) return { success: true, data: null }
  return {
    success: true,
    data: {
      gameId: r.game_id,
      itemId: r.item_id,
      itemName: r.item_name,
      itemImage: r.item_image,
      retailValue: Number(r.retail_value),
      creditsSpent: Number(r.credits_spent),
      price: Number(r.price),
      expiresAt: r.expires_at,
    },
  }
}

/** Crée la session Stripe de rachat. Le prix est RECALCULÉ côté serveur (le client
 *  n'envoie que le gameId) -> impossible de manipuler le montant. */
export async function createBuyItNowCheckout(gameId: string): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quoteData, error: qErr } = await (supabase.rpc as any)('quote_buy_it_now', { p_user_id: user.id, p_game_id: gameId })
  const quote = (Array.isArray(quoteData) ? quoteData[0] : quoteData) as { item_name: string; price: number } | null
  if (qErr || !quote) return { success: false, error: 'Offre indisponible ou expirée' }
  const price = Number(quote.price)
  if (!(price > 0)) return { success: false, error: 'Prix invalide' }

  try {
    const stripe = getServerStripe()
    if (!stripe) return { success: false, error: 'Service de paiement non configuré' }
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Rachat malin — ${quote.item_name}` },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: { statement_descriptor: 'CLEEKZY' },
      success_url: `${baseUrl}/profile?buyitnow=success`,
      cancel_url: `${baseUrl}/profile?buyitnow=cancelled`,
      customer_email: user.email,
      metadata: {
        type: 'buy_it_now',
        userId: user.id,
        gameId,
        price: price.toFixed(2),
      },
    })
    if (!session.url) return { success: false, error: 'Erreur lors de la création de la session' }
    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('[BUYITNOW] checkout error:', error)
    return { success: false, error: 'Erreur Stripe' }
  }
}
