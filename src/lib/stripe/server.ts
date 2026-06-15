import Stripe from 'stripe'

// Instance Stripe SERVEUR partagée (lazy singleton) — config unique pour tout le
// backend : apiVersion + timeout + retries (le webhook les omettait avant).
// Renvoie null si STRIPE_SECRET_KEY absent (build/tests sans secret).
// Pas de `server-only` ici volontairement : importé par handleStripeEvent qui est
// testé unitairement (Stripe est mocké). La clé n'étant pas NEXT_PUBLIC_, elle ne
// fuite jamais côté client même en cas d'import accidentel.

let instance: Stripe | null = null

export function getServerStripe(): Stripe | null {
  if (instance) return instance
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  instance = new Stripe(key, {
    apiVersion: '2025-12-15.clover',
    timeout: 30000,
    maxNetworkRetries: 3,
  })
  return instance
}
