'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CREDIT_PACKS, GIFT_VIP_DAYS, GIFT_VIP_PRICE, type GiftCheckoutInput } from '@/lib/stripe/config'
import { createGiftCheckout } from '@/actions/gift'

function fmtPrice(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function GiftOptions() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const offer = async (key: string, input: GiftCheckoutInput) => {
    setBusy(key)
    setError(null)
    try {
      const r = await createGiftCheckout(input)
      if (r.success && r.data?.url) {
        window.location.href = r.data.url
      } else {
        setError(r.error || 'Erreur, réessaie.')
        setBusy(null)
      }
    } catch {
      setError('Erreur, réessaie.')
      setBusy(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-center text-sm text-danger">{error}</div>
      )}

      {/* VIP — mise en avant or */}
      <button
        onClick={() => offer('vip', { kind: 'vip' })}
        disabled={busy !== null}
        className="group relative mb-4 flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/[0.12] to-amber-500/[0.04] p-5 text-left transition-colors hover:border-yellow-500/60 disabled:opacity-50"
      >
        <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-500/20 blur-2xl" aria-hidden />
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/15">
          <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block font-display text-lg font-bold text-white">Offrir le V.I.P</span>
          <span className="block text-sm text-white/55">{GIFT_VIP_DAYS} jours d&apos;avantages premium</span>
        </span>
        <span className="relative shrink-0 text-right">
          <span className="stat-numeral block text-xl font-black text-yellow-400">{fmtPrice(GIFT_VIP_PRICE)}€</span>
          <span className="text-xs font-semibold text-white/50 group-hover:text-white/70">{busy === 'vip' ? '…' : 'Offrir →'}</span>
        </span>
      </button>

      {/* Packs de crédits */}
      <div className="grid gap-3 sm:grid-cols-2">
        {CREDIT_PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => offer(pack.id, { kind: 'credits', packId: pack.id })}
            disabled={busy !== null}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-neon-pink/40 disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-pink/10">
              <svg className="h-5 w-5 text-neon-pink" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 3h14v2H5z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-white">{pack.credits} crédits</span>
              <span className="block text-xs text-white/45">{pack.name}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="stat-numeral block font-black text-white">{fmtPrice(pack.price)}€</span>
              <span className="text-[0.7rem] font-semibold text-neon-pink">{busy === pack.id ? '…' : 'Offrir'}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Après paiement, tu reçois un code à partager. Déjà un code ?{' '}
        <Link href="/cadeau" className="text-neon-pink hover:underline">Le réclamer</Link>
      </p>
    </div>
  )
}
