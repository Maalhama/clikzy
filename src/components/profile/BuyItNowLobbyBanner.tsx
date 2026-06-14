'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBuyItNowOffers, type BuyItNowOffer } from '@/actions/buyItNow'

/** Rappel slim dans le lobby : « tu as N offres de rachat ». Ferme la boucle de
 *  conversion quand le joueur a quitté la partie. Auto-masqué si anon / 0 offre. */
export function BuyItNowLobbyBanner() {
  const [offers, setOffers] = useState<BuyItNowOffer[] | null>(null)

  useEffect(() => {
    getBuyItNowOffers()
      .then((r) => setOffers(r.success ? r.data ?? [] : []))
      .catch(() => setOffers([]))
  }, [])

  if (!offers || offers.length === 0) return null

  const n = offers.length
  const save = offers.reduce((acc, o) => acc + Math.max(0, o.retailValue - o.price), 0)

  return (
    <div className="px-4 md:px-6 mb-4">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/profile"
          className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-neon-pink/30 bg-gradient-to-r from-neon-pink/[0.1] to-transparent px-4 py-2.5 transition-colors hover:border-neon-pink/50"
        >
          <span className="pointer-events-none absolute -left-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-neon-pink/20 blur-2xl" aria-hidden />
          <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon-pink/20 text-neon-pink">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          <div className="relative min-w-0 flex-1 text-sm">
            <span className="font-semibold text-white">
              {n === 1 ? 'Tu as 1 offre de rachat' : `Tu as ${n} offres de rachat`}
            </span>
            <span className="ml-2 text-white/55">
              {n === 1 ? 'récupère ton lot raté à prix réduit' : 'récupère tes lots ratés à prix réduit'}
              {save > 0 && <span className="text-neon-pink"> · jusqu&apos;à {Math.round(save)}€ d&apos;économies</span>}
            </span>
          </div>
          <span className="relative shrink-0 text-xs font-semibold text-neon-pink transition-transform group-hover:translate-x-0.5">
            Voir →
          </span>
        </Link>
      </div>
    </div>
  )
}
