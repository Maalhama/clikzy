import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'

// Lazy init Stripe to allow build without secrets
let stripe: Stripe | null = null
function getStripeInstance(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return stripe
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get pack ID from body
    const body = await request.json()
    const { packId } = body as { packId?: CreditPackId }

    if (!packId) {
      return NextResponse.json({ error: 'Pack non spécifié' }, { status: 400 })
    }

    // Find the pack
    const pack = CREDIT_PACKS.find((p) => p.id === packId)
    if (!pack) {
      return NextResponse.json({ error: 'Pack invalide' }, { status: 400 })
    }

    // Get user profile for email
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const profile = profileData as { username: string } | null

    const stripeInstance = getStripeInstance()

    // Create Stripe Checkout session
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/lobby?payment=success&credits=${pack.credits}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/lobby?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        packId: pack.id,
        credits: pack.credits.toString(),
        username: profile?.username || 'unknown',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
