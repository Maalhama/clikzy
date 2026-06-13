'use client'

import { Crown } from 'lucide-react'
import { type CreditPackId, type CREDIT_PACKS } from '@/lib/stripe/config'

type Pack = (typeof CREDIT_PACKS)[number]

interface PackCardProps {
  pack: Pack
  loading: boolean
  disabled?: boolean
  onBuy: (id: CreditPackId) => void
  /** Variante compacte (modal d'achat) vs carte pleine (page boutique). */
  compact?: boolean
}

// Identité visuelle par tier — SOURCE UNIQUE, partagée par toutes les surfaces (cohérence site).
function tierVisual(pack: Pack) {
  if (pack.id === 'premium') {
    return {
      aura: 'rgba(255,184,0,0.45)',
      border: 'border-[#FFD700]/40',
      coinBg: 'radial-gradient(circle at 35% 28%, #FFF2C0 0%, #FFD700 42%, #B8860B 100%)',
      coinShadow: '0 14px 34px -8px rgba(255,184,0,0.6), inset 0 2px 6px rgba(255,255,255,0.55), inset 0 -7px 14px rgba(0,0,0,0.3)',
      coinText: 'text-[#3a2a00]',
      btn: 'bg-gradient-to-r from-[#FFB800] to-[#FFD700] text-[#0B0F1A] hover:drop-shadow-[0_0_18px_rgba(255,184,0,0.6)]',
    }
  }
  if (pack.popular) {
    return {
      aura: 'rgba(155,92,255,0.55)',
      border: 'border-neon-purple/45',
      coinBg: 'radial-gradient(circle at 35% 28%, #E9D5FF 0%, #9B5CFF 44%, #FF4FD8 115%)',
      coinShadow: '0 14px 34px -8px rgba(155,92,255,0.6), inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -7px 14px rgba(0,0,0,0.3)',
      coinText: 'text-white',
      btn: 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:drop-shadow-[0_0_18px_rgba(155,92,255,0.6)]',
    }
  }
  return {
    aura: 'rgba(60,203,255,0.4)',
    border: 'border-neon-blue/35',
    coinBg: 'radial-gradient(circle at 35% 28%, #BDF0FF 0%, #3CCBFF 42%, #1B6E8C 100%)',
    coinShadow: '0 14px 34px -8px rgba(60,203,255,0.5), inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -7px 14px rgba(0,0,0,0.3)',
    coinText: 'text-white',
    btn: 'bg-white/10 text-white hover:bg-white/20',
  }
}

function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function Tag({ pack }: { pack: Pack }) {
  if (pack.monthlyLimit) return <span className="font-semibold text-neon-pink">1 fois par mois</span>
  if (pack.bonus > 0) return <span className="font-semibold text-success">+{pack.bonus}% de valeur</span>
  return <span className="text-white/35">Pack de base</span>
}

export function PackCard({ pack, loading, disabled, onBuy, compact }: PackCardProps) {
  const t = tierVisual(pack)
  const doubled = pack.credits * 2
  const price = pack.price.toFixed(2).replace('.', ',')
  const isLoading = loading

  // ----- Variante compacte (modal d'achat : rangée horizontale) -----
  if (compact) {
    return (
      <button
        onClick={() => onBuy(pack.id)}
        disabled={disabled || isLoading}
        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-white/[0.03] p-3 text-left transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${t.border} ${pack.popular ? 'bg-gradient-to-r from-neon-purple/15 to-neon-pink/5' : ''}`}
      >
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ background: t.coinBg, boxShadow: t.coinShadow }}
        >
          <span className="absolute inset-1.5 rounded-full border border-white/25" aria-hidden />
          <span className={`stat-numeral text-lg font-black leading-none ${t.coinText}`}>{pack.credits}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{pack.name}</span>
            {pack.popular && (
              <span className="rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-1.5 py-0.5 text-[0.55rem] font-bold uppercase text-white">Top</span>
            )}
          </div>
          <div className="text-[0.7rem] text-neon-pink">×2 → <span className="font-semibold text-white">{doubled} crédits</span> au 1<sup>er</sup> achat</div>
        </div>
        <div className="shrink-0">
          {isLoading ? (
            <Spinner className="h-6 w-6 text-neon-purple" />
          ) : (
            <div className={`rounded-lg px-3 py-1.5 text-sm font-bold ${pack.popular ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white' : 'bg-white/10 text-white'}`}>{price}€</div>
          )}
        </div>
      </button>
    )
  }

  // ----- Variante pleine (page boutique : carte grille) -----
  return (
    <div className={`group relative ${pack.popular ? 'lg:-my-2' : ''}`}>
      {/* Aura néon (toujours visible pour le populaire, sinon au survol) */}
      <div
        className={`pointer-events-none absolute -inset-px rounded-[1.65rem] blur-xl transition-opacity duration-500 ${pack.popular ? 'opacity-70' : 'opacity-0'} group-hover:opacity-100`}
        style={{ background: `radial-gradient(60% 60% at 50% 0%, ${t.aura} 0%, transparent 70%)` }}
        aria-hidden
      />
      <div className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-gradient-to-b from-white/[0.07] to-white/[0.015] p-6 backdrop-blur-xl transition-transform duration-300 group-hover:-translate-y-2 ${t.border} ${pack.popular ? 'lg:scale-[1.05]' : ''}`}>
        {/* liseré lumineux haut */}
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" aria-hidden />
        {/* Badge populaire */}
        {pack.popular && (
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-white shadow-[0_0_16px_-2px_rgba(155,92,255,0.7)]">
            <Crown className="h-3 w-3" aria-hidden /> Populaire
          </div>
        )}

        {/* Jeton de crédits */}
        <div
          className="relative mx-auto mt-1 mb-4 flex h-24 w-24 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1"
          style={{ background: t.coinBg, boxShadow: t.coinShadow }}
        >
          <span className="absolute inset-2 rounded-full border border-white/25" aria-hidden />
          <span className={`stat-numeral text-3xl font-black leading-none ${t.coinText}`}>{pack.credits}</span>
        </div>

        <div className="text-center">
          <div className="text-[0.55rem] uppercase tracking-[0.25em] text-white/40">crédits</div>
          <h3 className="font-display text-xl font-bold text-white">{pack.name}</h3>
          <p className="mx-auto mt-1 max-w-[14rem] text-[0.72rem] leading-snug text-white/45">{pack.tagline}</p>
          <div className="mt-1.5 text-xs"><Tag pack={pack} /></div>
        </div>

        {/* Hook x2 */}
        <div className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-neon-pink/30 bg-neon-pink/10 px-3 py-1.5">
          <span className="font-display text-sm font-black leading-none text-neon-pink">×2</span>
          <span className="text-[0.7rem] text-white/70">1<sup>er</sup> achat → <span className="font-semibold text-white">{doubled} crédits</span></span>
        </div>

        {/* Prix + CTA */}
        <div className="mt-auto pt-5 text-center">
          <div className="stat-numeral mb-4 text-3xl font-bold text-white">{price}€</div>
          <button
            onClick={() => onBuy(pack.id)}
            disabled={disabled || isLoading}
            className={`relative w-full overflow-hidden py-3 [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)] font-display text-sm font-semibold uppercase tracking-wide transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${t.btn}`}
          >
            {pack.popular && <span aria-hidden className="cta-sheen" />}
            {isLoading ? (
              <span className="flex items-center justify-center gap-2"><Spinner /> Chargement...</span>
            ) : (
              'Acheter'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
