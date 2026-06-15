import type { Metadata } from 'next'
import { GiftOptions } from '@/components/gift/GiftOptions'

export const metadata: Metadata = {
  title: 'Offrir un cadeau · Cleekzy',
  description: 'Offre des crédits ou le VIP Cleekzy à un ami. Il reçoit un code à réclamer.',
}

export default function OffrirPage() {
  return (
    <main className="relative z-10 mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 text-center">
        <span className="kicker mb-2">Faire plaisir</span>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Offrir un cadeau</h1>
        <p className="mt-1.5 text-sm text-white/55">
          Choisis ton cadeau, paie, et reçois un code à envoyer à la personne de ton choix.
        </p>
      </div>
      <GiftOptions />
    </main>
  )
}
