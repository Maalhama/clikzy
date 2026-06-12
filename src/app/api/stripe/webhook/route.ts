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

type HandlerResult = { status: number; body: Record<string, unknown> }

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

  // C5 — Idempotence : on "réclame" l'event via son id (clé primaire). Un conflit
  // signifie qu'il a DÉJÀ été traité avec succès -> on l'ignore (évite le double
  // crédit en cas de retry Stripe). En cas d'échec de traitement, la réclamation
  // est relâchée plus bas pour permettre un nouveau retry.
  let idemDb: ReturnType<typeof getSupabaseAdmin>
  try {
    idemDb = getSupabaseAdmin()
  } catch (err) {
    console.error('Supabase admin init failed:', err)
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const { error: claimError } = await idemDb
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })

  if (claimError) {
    if (claimError.code === '23505') {
      // Déjà traité : acquittement idempotent
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('Stripe idempotency claim failed:', claimError)
    return NextResponse.json({ error: 'Idempotency error' }, { status: 500 })
  }

  let result: HandlerResult
  try {
    result = await handleStripeEvent(event)
  } catch (error) {
    console.error('Unhandled error processing Stripe event:', error)
    result = { status: 500, body: { error: 'Processing failed' } }
  }

  // Échec -> on relâche la réclamation pour que Stripe puisse réessayer
  if (result.status >= 400) {
    await idemDb.from('stripe_events').delete().eq('id', event.id)
  }

  return NextResponse.json(result.body, { status: result.status })
}

// Exporté pour les tests unitaires (logique métier des événements Stripe).
export async function handleStripeEvent(event: Stripe.Event): Promise<HandlerResult> {
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId

    // Passe d'Arène (one-shot mensuel) : activation idempotente
    if (session.metadata?.type === 'battle_pass') {
      if (!userId) {
        console.error('Missing userId in battle pass session:', session.metadata)
        return { status: 400, body: { error: 'Invalid metadata' } }
      }
      const supabase = getSupabaseAdmin()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: passError } = await (supabase.rpc as any)('grant_battle_pass', {
        p_user_id: userId,
        p_session: session.id,
      })
      if (passError) {
        console.error('Error granting battle pass:', passError)
        return { status: 500, body: { error: 'Failed to grant pass' } }
      }
      console.log(`Battle pass granted to user ${userId}`)
      return { status: 200, body: { received: true } }
    }

    const credits = parseInt(session.metadata?.credits || '0', 10)

    if (!userId || credits <= 0) {
      console.error('Invalid metadata in checkout session:', session.metadata)
      return { status: 400, body: { error: 'Invalid metadata' } }
    }

    try {
      const supabase = getSupabaseAdmin()

      // Crédit ATOMIQUE (incrément côté SQL) -> pas de lost-update entre deux
      // paiements concurrents. RPC DEFINER réservée au service_role.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase.rpc as any)('add_purchased_credits', {
        p_user_id: userId,
        p_amount: credits,
      })

      if (rpcError) {
        console.error('Error crediting account:', rpcError)
        return { status: 500, body: { error: 'Failed to credit account' } }
      }

      console.log(`Successfully credited ${credits} to user ${userId}`)
    } catch (error) {
      console.error('Error processing payment:', error)
      return { status: 500, body: { error: 'Payment processing failed' } }
    }
  }

  // Handle VIP subscription created/renewed
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription & { current_period_end: number }

    // Only process VIP subscriptions
    if (subscription.metadata?.type !== 'vip_subscription') {
      return { status: 200, body: { received: true } }
    }

    const userId = subscription.metadata?.userId
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.metadata)
      return { status: 400, body: { error: 'Missing userId' } }
    }

    // Only activate if subscription is active
    if (subscription.status !== 'active') {
      return { status: 200, body: { received: true } }
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
        return { status: 500, body: { error: 'Failed to activate VIP' } }
      }

      console.log(`VIP activated for user ${userId} until ${expiresAt}`)
    } catch (error) {
      console.error('Error processing VIP subscription:', error)
      return { status: 500, body: { error: 'VIP processing failed' } }
    }
  }

  // Handle VIP subscription cancelled/ended
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription

    // Only process VIP subscriptions
    if (subscription.metadata?.type !== 'vip_subscription') {
      return { status: 200, body: { received: true } }
    }

    const userId = subscription.metadata?.userId
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.metadata)
      return { status: 400, body: { error: 'Missing userId' } }
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
        return { status: 500, body: { error: 'Failed to deactivate VIP' } }
      }

      console.log(`VIP deactivated for user ${userId}`)
    } catch (error) {
      console.error('Error processing VIP cancellation:', error)
      return { status: 500, body: { error: 'VIP cancellation processing failed' } }
    }
  }

  // Paiement échoué (renouvellement V.I.P ou paiement asynchrone) : prévenir
  // le joueur pour qu'il mette à jour son moyen de paiement — sinon il croit
  // avoir payé et découvre l'absence de crédits/avantages plus tard.
  if (event.type === 'invoice.payment_failed' || event.type === 'checkout.session.async_payment_failed') {
    const obj = event.data.object as { metadata?: Record<string, string>; subscription_details?: { metadata?: Record<string, string> } }
    const userId = obj.metadata?.userId ?? obj.subscription_details?.metadata?.userId
    if (userId) {
      // import dynamique : push.ts est server-only (non résolvable dans les tests unitaires)
      import('@/lib/push')
        .then(({ sendPushToUser }) =>
          sendPushToUser(userId, {
            title: 'Paiement échoué',
            body: 'Ton dernier paiement Cleekzy a été refusé. Vérifie ton moyen de paiement pour conserver tes avantages.',
            url: '/shop',
            tag: 'payment-failed',
          })
        )
        .catch((err) => console.error('[WEBHOOK] Failed to send payment-failed push:', err))
      console.log(`Payment failed notification queued for user ${userId} (${event.type})`)
    } else {
      console.error(`Payment failed event without userId metadata (${event.type})`)
    }
  }

  return { status: 200, body: { received: true } }
}
