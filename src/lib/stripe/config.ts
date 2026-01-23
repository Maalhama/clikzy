import { loadStripe, Stripe } from '@stripe/stripe-js'

// Lazy-loaded Stripe instance
let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.warn('Stripe publishable key not configured')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

// Credit pack definitions
export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 4.99,
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 150,
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_POPULAR || '',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 500,
    price: 24.99,
    priceId: process.env.STRIPE_PRICE_PREMIUM || '',
    popular: false,
  },
] as const

export type CreditPackId = (typeof CREDIT_PACKS)[number]['id']

export function getCreditPack(packId: CreditPackId) {
  return CREDIT_PACKS.find((pack) => pack.id === packId)
}
