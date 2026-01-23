import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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

// Create Supabase admin client for server-to-server operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const stripeInstance = getStripeInstance()
    event = stripeInstance.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const credits = parseInt(session.metadata?.credits || '0', 10)

    if (!userId || credits <= 0) {
      console.error('Invalid metadata in checkout session:', session.metadata)
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
    }

    try {
      const supabase = getSupabaseAdmin()

      // Get current user credits
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (fetchError || !profile) {
        console.error('Error fetching profile:', fetchError)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Update credits and mark as purchased
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          credits: (profile.credits || 0) + credits,
          has_purchased_credits: true,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating credits:', updateError)
        return NextResponse.json({ error: 'Failed to credit account' }, { status: 500 })
      }

      console.log(`Successfully credited ${credits} to user ${userId}`)
    } catch (error) {
      console.error('Error processing payment:', error)
      return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
