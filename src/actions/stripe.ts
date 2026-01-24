'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// Lazy init Stripe
let stripe: Stripe | null = null
function getStripeInstance(): Stripe | null {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      console.error('STRIPE_SECRET_KEY is not configured')
      return null
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return stripe
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
