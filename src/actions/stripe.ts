'use server'

import { getServerStripe } from '@/lib/stripe/server'
import { selfExcludedUntil, selfExclusionError } from '@/lib/selfExclusion'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a Stripe Checkout session for purchasing credits
 */
export async function createCheckoutSession(
  packId: CreditPackId
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  const excl = await selfExcludedUntil(supabase, user.id)
  if (excl) return { success: false, error: selfExclusionError(excl) }

  // Find the pack
  const pack = CREDIT_PACKS.find((p) => p.id === packId)
  if (!pack) {
    return { success: false, error: 'Pack invalide' }
  }

  try {
    const stripeInstance = getServerStripe()
    if (!stripeInstance) {
      return { success: false, error: 'Service de paiement non configuré' }
    }

    // Profil : username + statut VIP (pour la remise -10%)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, is_vip, vip_expires_at')
      .eq('id', user.id)
      .single()

    const profile = profileData as { username: string; is_vip: boolean; vip_expires_at: string | null } | null

    // Mini (monthlyLimit) : achetable 1×/mois. Pré-vérif UX — l'autorité reste grant_pack_credits.
    // État des achats de CE mois (pour la limite mensuelle ET l'affichage du x2).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: monthState } = await (supabase.rpc as any)('get_pack_month_state', { p_user_id: user.id })
    const alreadyThisMonth = (monthState as { pack_id: string }[] | null)?.some((r) => r.pack_id === pack.id) ?? false
    if (pack.monthlyLimit && alreadyThisMonth) {
      return { success: false, error: 'Ce pack est limité à un achat par mois — reviens le mois prochain.' }
    }
    // x2 sur le 1er achat de CE pack ce mois-ci. Affiché sur Stripe pour zéro doute au
    // paiement ; l'autorité reste grant_pack_credits (recalcul atomique au paiement).
    const x2Eligible = !alreadyThisMonth
    const displayCredits = x2Eligible ? pack.credits * 2 : pack.credits

    // Remise V.I.P -10% sur tous les packs (le VIP rentabilise l'achat au lieu de le remplacer)
    const isVip = !!profile?.is_vip && (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date())
    const unitPrice = isVip ? pack.price * 0.9 : pack.price
    const vipNote = isVip ? ' (-10% V.I.P)' : ''

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // x2 sur le 1er achat du mois géré côté serveur (grant_pack_credits) ; metadata = crédits de BASE.
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${displayCredits} Crédits Cleekzy${x2Eligible ? ' ×2' : ''}`,
              description: x2Eligible
                ? `Pack ${pack.name} — ${pack.credits} crédits ×2 = ${displayCredits} (1er achat du mois doublé)${vipNote}`
                : `Pack ${pack.name} — ${pack.credits} crédits${vipNote}`,
            },
            unit_amount: Math.round(unitPrice * 100), // centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Compte Stripe « Frizaway. Inc. » (partagé) : libellé relevé forcé à « CLEEKZY ».
      payment_intent_data: { statement_descriptor: 'CLEEKZY' },
      success_url: `${baseUrl}/lobby?payment=success&credits=${displayCredits}`,
      cancel_url: `${baseUrl}/lobby?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        packId: pack.id,
        credits: pack.credits.toString(),
        monthlyLimit: pack.monthlyLimit ? '1' : '0',
        username: profile?.username || 'unknown',
      },
    })

    if (!session.url) {
      return { success: false, error: 'Erreur lors de la création de la session' }
    }

    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('Checkout session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Erreur Stripe: ${errorMessage}` }
  }
}

/**
 * Create a Stripe Checkout session for VIP subscription
 */
export async function createVIPCheckoutSession(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  const excl = await selfExcludedUntil(supabase, user.id)
  if (excl) return { success: false, error: selfExclusionError(excl) }

  // Check if user already has VIP
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_vip, vip_expires_at')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as { is_vip: boolean; vip_expires_at: string | null } | null
  if (typedProfile?.is_vip && typedProfile.vip_expires_at) {
    const expiresAt = new Date(typedProfile.vip_expires_at)
    if (expiresAt > new Date()) {
      return { success: false, error: 'Vous êtes déjà abonné V.I.P' }
    }
  }

  try {
    const stripeInstance = getServerStripe()
    if (!stripeInstance) {
      return { success: false, error: 'Service de paiement non configuré' }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create Stripe Checkout session for subscription
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abonnement V.I.P Cleekzy',
              description: '20 crédits/jour, -10% sur tous les packs, 2× parties mini-jeux, lots premium, badge & cosmétique exclusifs',
            },
            unit_amount: 1299, // 12,99€/mois
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/lobby?vip=success`,
      cancel_url: `${baseUrl}/lobby?vip=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        type: 'vip_subscription',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          type: 'vip_subscription',
        },
      },
    })

    if (!session.url) {
      return { success: false, error: 'Erreur lors de la création de la session' }
    }

    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('VIP Checkout session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Erreur Stripe: ${errorMessage}` }
  }
}

/**
 * Check if user has active VIP subscription
 */
export async function checkVIPStatus(): Promise<ActionResult<{ isVip: boolean; expiresAt: string | null }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_vip, vip_expires_at')
    .eq('id', user.id)
    .single()

  if (error) {
    return { success: false, error: 'Erreur lors de la vérification du statut VIP' }
  }

  const typedProfile = profile as { is_vip: boolean; vip_expires_at: string | null } | null
  const isVip = typedProfile?.is_vip && typedProfile.vip_expires_at
    ? new Date(typedProfile.vip_expires_at) > new Date()
    : typedProfile?.is_vip || false

  return {
    success: true,
    data: {
      isVip,
      expiresAt: typedProfile?.vip_expires_at || null,
    },
  }
}

/**
 * VIP tier type
 */
export type VIPTier = 'bronze' | 'silver' | 'gold'

/**
 * Get detailed VIP information for dashboard
 */
export async function getVIPDetails(): Promise<ActionResult<{
  isVip: boolean
  tier: VIPTier
  memberSince: string
  daysUntilNextTier: number
  totalCreditsEarned: number
  currentCredits: number
  subscriptionId: string | null
}>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_vip, vip_subscription_id, vip_expires_at, created_at, credits, earned_credits')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return { success: false, error: 'Erreur lors de la récupération du profil' }
  }

  const typedProfile = profile as {
    is_vip: boolean
    vip_subscription_id: string | null
    vip_expires_at: string | null
    created_at: string
    credits: number
    earned_credits: number
  }

  if (!typedProfile.is_vip) {
    return { success: false, error: 'Utilisateur non VIP' }
  }

  // Calculate VIP membership duration
  // Note: We use vip_subscription_id creation or created_at as fallback
  const memberSince = typedProfile.created_at

  // Calculate tier based on subscription duration
  const now = new Date()
  const subscriptionStart = new Date(memberSince)
  const daysAsMember = Math.floor((now.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24))

  let tier: VIPTier = 'bronze'
  let daysUntilNextTier = 90 - daysAsMember

  if (daysAsMember >= 180) {
    tier = 'gold'
    daysUntilNextTier = 0
  } else if (daysAsMember >= 90) {
    tier = 'silver'
    daysUntilNextTier = 180 - daysAsMember
  } else {
    tier = 'bronze'
    daysUntilNextTier = 90 - daysAsMember
  }

  // Calculate total credits (daily + earned)
  const currentCredits = (typedProfile.credits || 0) + (typedProfile.earned_credits || 0)

  return {
    success: true,
    data: {
      isVip: true,
      tier,
      memberSince,
      daysUntilNextTier: Math.max(0, daysUntilNextTier),
      totalCreditsEarned: typedProfile.earned_credits || 0,
      currentCredits,
      subscriptionId: typedProfile.vip_subscription_id,
    },
  }
}

/**
 * Create Stripe Billing Portal session for managing subscription
 */
export async function createBillingPortalSession(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  try {
    const stripeInstance = getServerStripe()
    if (!stripeInstance) {
      return { success: false, error: 'Service de paiement non configuré' }
    }

    // Get user's Stripe customer ID from subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('vip_subscription_id')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as { vip_subscription_id: string | null } | null

    if (!typedProfile?.vip_subscription_id) {
      return { success: false, error: 'Aucun abonnement trouvé' }
    }

    // Get subscription to find customer ID
    const subscription = await stripeInstance.subscriptions.retrieve(typedProfile.vip_subscription_id)
    const customerId = subscription.customer as string

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create billing portal session
    const session = await stripeInstance.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/vip`,
    })

    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('Billing portal error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Erreur: ${errorMessage}` }
  }
}

/**
 * Create a Stripe Checkout session for the monthly Passe d'Arène (one-shot 4,99 €)
 */
export async function createPassCheckoutSession(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const excl = await selfExcludedUntil(supabase, user.id)
  if (excl) return { success: false, error: selfExclusionError(excl) }

  try {
    const stripeInstance = getServerStripe()
    if (!stripeInstance) {
      return { success: false, error: 'Service de paiement non configuré' }
    }

    const monthLabel = new Intl.DateTimeFormat('fr-FR', {
      month: 'long', year: 'numeric', timeZone: 'Europe/Paris',
    }).format(new Date())
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Passe d'Arène — ${monthLabel}`,
              description: 'Piste premium du mois : coffres rares à légendaires, 25 crédits et artefact exclusif',
            },
            unit_amount: 499,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Libellé « CLEEKZY » sur le relevé (compte Stripe partagé « Frizaway. Inc. »).
      payment_intent_data: { statement_descriptor: 'CLEEKZY' },
      success_url: `${baseUrl}/lobby?pass=success`,
      cancel_url: `${baseUrl}/lobby?pass=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        type: 'battle_pass',
      },
    })

    if (!session.url) {
      return { success: false, error: 'Erreur lors de la création de la session' }
    }
    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('Pass checkout session error:', error)
    return { success: false, error: 'Erreur Stripe' }
  }
}
