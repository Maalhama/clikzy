'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'
import { createCheckoutSession } from '@/actions/stripe'

interface ShopClientProps {
  currentCredits: number
}

export function ShopClient({ currentCredits }: ShopClientProps) {
  const [loadingPack, setLoadingPack] = useState<CreditPackId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (packId: CreditPackId) => {
    setLoadingPack(packId)
    setError(null)

    const result = await createCheckoutSession(packId)

    if (result.success && result.data?.url) {
      window.location.href = result.data.url
    } else {
      setError(result.error || 'Une erreur est survenue')
      setLoadingPack(null)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="relative py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Back link */}
          <Link
            href="/lobby"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour au lobby
          </Link>

          {/* Title */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-4">
            <svg className="w-5 h-5 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-neon-purple text-sm font-semibold">BOUTIQUE</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
            Achète des <span className="gradient-text">crédits</span>
          </h1>
          <p className="text-white/50 max-w-md mx-auto">
            Plus de crédits = plus de chances de gagner des produits tech premium.
          </p>

          {/* Current credits */}
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-bg-secondary border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-xs text-white/50">Ton solde actuel</div>
              <div className="text-xl font-bold text-neon-blue">{currentCredits} crédits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Packs */}
      <div className="px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`
                  relative rounded-2xl p-6 transition-all
                  ${pack.popular
                    ? 'bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border-2 border-neon-purple/40 shadow-[0_0_40px_rgba(155,92,255,0.2)]'
                    : 'bg-bg-secondary border border-white/10 hover:border-white/20'
                  }
                `}
              >
                {/* Popular badge */}
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white text-xs font-bold uppercase">
                      Populaire
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="text-center pt-2">
                  {/* Credits */}
                  <div className={`
                    w-20 h-20 mx-auto rounded-2xl flex flex-col items-center justify-center mb-4
                    ${pack.popular
                      ? 'bg-gradient-to-br from-neon-purple to-neon-pink shadow-lg shadow-neon-purple/30'
                      : 'bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-white/10'
                    }
                  `}>
                    <span className="text-white font-black text-2xl leading-none">{pack.credits}</span>
                    <span className="text-white/70 text-xs uppercase">crédits</span>
                  </div>

                  {/* Pack name */}
                  <h3 className="text-xl font-bold text-white mb-1">{pack.name}</h3>

                  {/* Bonus percentage */}
                  <div className="text-sm mb-6">
                    {pack.bonus > 0 ? (
                      <span className="text-success font-semibold">+{pack.bonus}% de valeur</span>
                    ) : (
                      <span className="text-white/40">Pack de base</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-3xl font-black text-white mb-6">
                    {pack.price.toFixed(2)}€
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={loadingPack !== null}
                    className={`
                      w-full py-3 rounded-xl font-bold transition-all
                      ${pack.popular
                        ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-95
                    `}
                  >
                    {loadingPack === pack.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Chargement...
                      </span>
                    ) : (
                      'Acheter'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-center">
              {error}
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Paiement sécurisé
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Crédits instantanés
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
