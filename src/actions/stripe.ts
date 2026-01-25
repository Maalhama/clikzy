'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// Create Stripe instance per request (no caching for serverless)
function getStripeInstance(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not configured')
    return null
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
    timeout: 30000, // 30 seconds timeout
    maxNetworkRetries: 3,
  })
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

  // Find the pack
  const pack = CREDIT_PACKS.find((p) => p.id === packId)
  if (!pack) {
    return { success: false, error: 'Pack invalide' }
  }

  try {
    const stripeInstance = getStripeInstance()
    if (!stripeInstance) {
      return { success: false, error: 'Service de paiement non configuré' }
    }

    // Get user profile for username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const profile = profileData as { username: string } | null
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create Stripe Checkout session directly
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${pack.credits} Crédits Cleekzy`,
              description: `Pack ${pack.name} - ${pack.credits} crédits pour jouer`,
            },
            unit_amount: Math.round(pack.price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/lobby?payment=success&credits=${pack.credits}`,
      cancel_url: `${baseUrl}/lobby?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        packId: pack.id,
        credits: pack.credits.toString(),
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
    const stripeInstance = getStripeInstance()
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
              description: 'Accès aux produits premium (+1000€), badge exclusif, support prioritaire',
            },
            unit_amount: 999, // 9.99€ in cents
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
    : false

  return {
    success: true,
    data: {
      isVip,
      expiresAt: typedProfile?.vip_expires_at || null,
    },
  }
}
