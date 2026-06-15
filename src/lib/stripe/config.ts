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

// Credit pack definitions — grille « au prix du marché » (penny auction), refonte 2026-06.
// Réf valeur : Boost = 7,99€/50 = 0,160€/crédit (base). `bonus` = % de valeur en plus vs Boost (affichage).
// `monthlyLimit` : pack achetable une seule fois par mois civil (Europe/Paris).
// x2 sur le 1er achat de CHAQUE pack par mois → appliqué côté serveur par la RPC grant_pack_credits.
export const CREDIT_PACKS = [
  {
    id: 'mini',
    name: 'Étincelle',
    tagline: 'Un petit plein, une fois par mois.',
    credits: 15,
    price: 2.49,
    popular: false,
    monthlyLimit: true,
    bonus: 0,
  },
  {
    id: 'starter',
    name: 'Boost',
    tagline: 'Le renfort idéal pour tes sessions.',
    credits: 50,
    price: 7.99,
    popular: false,
    monthlyLimit: false,
    bonus: 0,
  },
  {
    id: 'popular',
    name: 'Turbo',
    tagline: 'Le choix des habitués. Joue sans compter.',
    credits: 175,
    price: 19.99,
    popular: true,
    monthlyLimit: false,
    bonus: 40,
  },
  {
    id: 'premium',
    name: 'Overdrive',
    tagline: "Puissance maximale. L'arène est à toi.",
    credits: 500,
    price: 44.99,
    popular: false,
    monthlyLimit: false,
    bonus: 75,
  },
] as const

export type CreditPackId = (typeof CREDIT_PACKS)[number]['id']

export function getCreditPack(packId: CreditPackId) {
  return CREDIT_PACKS.find((pack) => pack.id === packId)
}

// Cadeau VIP : pass non-récurrent de 30 jours, au tarif du VIP mensuel.
export const GIFT_VIP_DAYS = 30
export const GIFT_VIP_PRICE = 12.99

export type GiftCheckoutInput = { kind: 'credits'; packId: CreditPackId } | { kind: 'vip' }
