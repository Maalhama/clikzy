'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown, Sparkles, Check } from 'lucide-react'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'
import { createCheckoutSession, createPassCheckoutSession } from '@/actions/stripe'
import { getPassState } from '@/actions/battlePass'

interface ShopClientProps {
  currentCredits: number
}

export function ShopClient({ currentCredits }: ShopClientProps) {
  const [loadingPack, setLoadingPack] = useState<CreditPackId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passPurchased, setPassPurchased] = useState<boolean | null>(null)
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => {
    getPassState().then((res) => {
      if (res.success && res.data) setPassPurchased(res.data.purchased)
      else setPassPurchased(false)
    }).catch(() => setPassPurchased(false))
  }, [])

  const handleBuyPass = async () => {
    if (passLoading || passPurchased) return
    setPassLoading(true)
    setError(null)
    const res = await createPassCheckoutSession()
    if (res.success && res.data?.url) {
      window.location.href = res.data.url
      return
    }
    setError(res.error || 'Une erreur est survenue')
    setPassLoading(false)
  }

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
          {/* Title */}
          <span className="kicker mb-4">Boutique</span>

          <h1 className="title-giant text-4xl md:text-5xl text-white mb-3">
            Achète des <span className="text-neon-purple neon-text">crédits</span>
          </h1>
          <p className="text-white/50 max-w-md mx-auto">
            Plus de crédits = plus de temps de jeu. Les crédits n'augmentent pas tes chances : seul le timing compte.
          </p>

          {/* Current credits */}
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 panel rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-xs text-white/50">Ton solde actuel</div>
              <div className="text-xl stat-numeral text-neon-blue">{currentCredits} crédits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Packs */}
      <div className="px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {CREDIT_PACKS.map((pack, packIndex) => {
              // Identité visuelle par tier : bleu / violet-rose / or
              const tier = packIndex === 2
                ? { ring: 'border-[#FFD700]/40', glow: 'shadow-[0_0_44px_-8px_rgba(255,215,0,0.35)]', coin: 'from-[#FFB800] to-[#FFD700]', coinShadow: 'shadow-[0_8px_24px_-6px_rgba(255,184,0,0.5)]', text: 'text-[#0B0F1A]' }
                : pack.popular
                ? { ring: 'border-neon-purple/40', glow: 'shadow-[0_0_44px_-8px_rgba(155,92,255,0.45)]', coin: 'from-neon-purple to-neon-pink', coinShadow: 'shadow-[0_8px_24px_-6px_rgba(155,92,255,0.55)]', text: 'text-white' }
                : { ring: 'border-neon-blue/30', glow: 'shadow-[0_0_36px_-10px_rgba(60,203,255,0.3)]', coin: 'from-[#1B6E8C] to-[#3CCBFF]', coinShadow: 'shadow-[0_8px_24px_-6px_rgba(60,203,255,0.45)]', text: 'text-white' }
              return (
              <div
                key={pack.id}
                className={`
                  group relative rounded-2xl border-2 bg-bg-secondary/60 p-6 transition-all duration-300 hover:-translate-y-1.5
                  ${tier.ring} ${tier.glow}
                  ${pack.popular ? 'bg-gradient-to-br from-neon-purple/15 to-neon-pink/10 lg:scale-[1.04]' : ''}
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
                    relative mx-auto mb-4 flex h-24 w-24 flex-col items-center justify-center rounded-full
                    bg-gradient-to-br ${tier.coin} ${tier.coinShadow}
                    transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1
                  `}>
                    <span className="absolute inset-1.5 rounded-full border border-white/30" aria-hidden />
                    <span className={`stat-numeral text-2xl leading-none ${tier.text}`}>{pack.credits}</span>
                    <span className={`text-[0.6rem] uppercase tracking-wider ${tier.text} opacity-70`}>crédits</span>
                  </div>

                  {/* Pack name */}
                  <h3 className="font-display text-xl font-bold text-white mb-1">{pack.name}</h3>

                  {/* Bonus percentage */}
                  <div className="text-sm mb-6">
                    {pack.bonus > 0 ? (
                      <span className="text-success font-semibold">+{pack.bonus}% de valeur</span>
                    ) : (
                      <span className="text-white/40">Pack de base</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-3xl stat-numeral text-white mb-6">
                    {pack.price.toFixed(2)}€
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={loadingPack !== null}
                    className={`
                      relative w-full overflow-hidden py-3 [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)] font-display font-semibold uppercase tracking-wide text-sm transition-all
                      ${packIndex === 2
                        ? 'bg-gradient-to-r from-[#FFB800] to-[#FFD700] text-[#0B0F1A] hover:drop-shadow-[0_0_16px_rgba(255,184,0,0.5)]'
                        : pack.popular
                        ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:drop-shadow-[0_0_16px_rgba(155,92,255,0.55)]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-95
                    `}
                  >
                    {pack.popular && <span aria-hidden className="cta-sheen" />}
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
            )})}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-center">
              {error}
            </div>
          )}

          {/* Cross-sell : Passe d'Arène + V.I.P */}
          <div className="mt-12">
            <div className="mb-5 text-center">
              <span className="kicker !text-[0.6rem]">Pour aller plus loin</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {/* Passe d'Arène */}
              <div className="relative rounded-2xl border-2 border-yellow-400/30 bg-gradient-to-br from-yellow-400/[0.08] to-transparent p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" aria-hidden />
                  <h3 className="font-display text-lg font-bold text-white">Passe d&apos;Arène</h3>
                  <span className="rounded-md border border-yellow-400/40 bg-yellow-400/10 px-1.5 py-0.5 font-display text-[0.55rem] font-bold uppercase tracking-wider text-yellow-300">
                    Premium
                  </span>
                </div>
                <p className="mb-4 text-sm text-white/55">
                  5 paliers de récompenses liés à ton assiduité : coffres rare, épique et légendaire,
                  25 crédits et un artefact exclusif. Achat unique, valable à vie.
                </p>
                <div className="mb-4 text-2xl stat-numeral text-white">4,99€</div>
                {passPurchased ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 py-3 text-sm font-semibold text-success">
                    <Check className="h-4 w-4" aria-hidden /> Déjà débloqué
                  </div>
                ) : (
                  <button
                    onClick={handleBuyPass}
                    disabled={passLoading || passPurchased === null}
                    className="w-full rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FFD700] py-3 font-display text-sm font-semibold uppercase tracking-wide text-[#0B0F1A] transition-all hover:drop-shadow-[0_0_16px_rgba(255,184,0,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {passLoading ? 'Redirection…' : 'Débloquer le Passe'}
                  </button>
                )}
              </div>

              {/* V.I.P */}
              <div className="relative rounded-2xl border-2 border-neon-purple/30 bg-gradient-to-br from-neon-purple/[0.08] to-transparent p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" aria-hidden />
                  <h3 className="font-display text-lg font-bold text-white">Abonnement V.I.P</h3>
                </div>
                <p className="mb-4 text-sm text-white/55">
                  +10 crédits bonus chaque jour, badge doré exclusif et accès aux parties V.I.P
                  réservées aux membres. Sans engagement.
                </p>
                <div className="mb-4 text-2xl stat-numeral text-white">9,99€<span className="text-sm text-white/50">/mois</span></div>
                <Link
                  href="/vip"
                  className="block w-full rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink py-3 text-center font-display text-sm font-semibold uppercase tracking-wide text-white transition-all hover:drop-shadow-[0_0_16px_rgba(155,92,255,0.55)] active:scale-95"
                >
                  Découvrir le V.I.P
                </Link>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
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
