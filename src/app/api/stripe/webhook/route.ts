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

  // Handle VIP subscription created/renewed
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription & { current_period_end: number }

    // Only process VIP subscriptions
    if (subscription.metadata?.type !== 'vip_subscription') {
      return NextResponse.json({ received: true })
    }

    const userId = subscription.metadata?.userId
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.metadata)
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Only activate if subscription is active
    if (subscription.status !== 'active') {
      return NextResponse.json({ received: true })
    }

    try {
      const supabase = getSupabaseAdmin()

      // Calculate expiration date (current period end)
      const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_vip: true,
          vip_subscription_id: subscription.id,
          vip_expires_at: expiresAt,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating VIP status:', updateError)
        return NextResponse.json({ error: 'Failed to activate VIP' }, { status: 500 })
      }

      console.log(`VIP activated for user ${userId} until ${expiresAt}`)
    } catch (error) {
      console.error('Error processing VIP subscription:', error)
      return NextResponse.json({ error: 'VIP processing failed' }, { status: 500 })
    }
  }

  // Handle VIP subscription cancelled/ended
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription

    // Only process VIP subscriptions
    if (subscription.metadata?.type !== 'vip_subscription') {
      return NextResponse.json({ received: true })
    }

    const userId = subscription.metadata?.userId
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.metadata)
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    try {
      const supabase = getSupabaseAdmin()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_vip: false,
          vip_subscription_id: null,
          vip_expires_at: null,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error deactivating VIP status:', updateError)
        return NextResponse.json({ error: 'Failed to deactivate VIP' }, { status: 500 })
      }

      console.log(`VIP deactivated for user ${userId}`)
    } catch (error) {
      console.error('Error processing VIP cancellation:', error)
      return NextResponse.json({ error: 'VIP cancellation processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
