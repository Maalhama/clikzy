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
// Bonus calculated vs base price (Boost pack): 4.99€/50 = 0.0998€/credit
export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Boost',
    credits: 50,
    price: 4.99,
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    popular: false,
    bonus: 0, // Base price
  },
  {
    id: 'popular',
    name: 'Turbo',
    credits: 150,
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_POPULAR || '',
    popular: true,
    bonus: 33, // 33% more value vs Boost
  },
  {
    id: 'premium',
    name: 'Ultra',
    credits: 500,
    price: 24.99,
    priceId: process.env.STRIPE_PRICE_PREMIUM || '',
    popular: false,
    bonus: 50, // 50% more value vs Boost
  },
] as const

export type CreditPackId = (typeof CREDIT_PACKS)[number]['id']

export function getCreditPack(packId: CreditPackId) {
  return CREDIT_PACKS.find((pack) => pack.id === packId)
}
