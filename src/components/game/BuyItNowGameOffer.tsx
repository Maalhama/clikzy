'use client'

import { useEffect, useState } from 'react'
import { getBuyItNowOffer, createBuyItNowCheckout, type BuyItNowOffer } from '@/actions/buyItNow'

function fmt(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
}

/** Bannière « Rachat malin » à l'écran de résultat d'une enchère PERDUE.
 *  Auto-suffisante : se masque (null) si le joueur n'a pas d'offre éligible. */
export function BuyItNowGameOffer({ gameId }: { gameId: string }) {
  const [offer, setOffer] = useState<BuyItNowOffer | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    getBuyItNowOffer(gameId)
      .then((r) => setOffer(r.success ? r.data ?? null : null))
      .catch(() => setOffer(null))
  }, [gameId])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!offer) return null
  const expMs = new Date(offer.expiresAt).getTime() - now
  if (expMs <= 0) return null

  const pct = offer.retailValue > 0 ? Math.round((1 - offer.price / offer.retailValue) * 100) : 0
  const save = Math.max(0, Math.round(offer.retailValue - offer.price))
  const urgent = expMs < 3 * 3600 * 1000

  const buy = async () => {
    setBusy(true)
    try {
      const r = await createBuyItNowCheckout(gameId)
      if (r.success && r.data?.url) window.location.href = r.data.url
      else setBusy(false)
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-neon-pink/40 bg-gradient-to-br from-neon-pink/[0.12] to-neon-purple/[0.06] p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-neon-pink/20 blur-2xl" aria-hidden />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-neon-pink px-1.5 py-0.5 font-display text-[0.6rem] font-black uppercase tracking-wider text-[#160a26]">
              Rachat malin
            </span>
            <span className="text-sm font-semibold text-white">Pas de chance — récupère-le quand même</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span className="stat-numeral text-2xl font-black text-neon-pink">{offer.price}€</span>
            <span className="text-sm text-white/55 line-through">{offer.retailValue}€</span>
            {pct > 0 && <span className="rounded bg-neon-pink/20 px-1.5 py-0.5 text-xs font-bold text-neon-pink">-{pct}%</span>}
            {save > 0 && <span className="text-xs text-white/55">tu économises {save}€</span>}
          </div>
          <div className={`mt-1 text-[0.72rem] ${urgent ? 'text-neon-pink' : 'text-white/45'}`}>
            Offre valable encore <span className="stat-numeral font-semibold">{fmt(expMs)}</span>
          </div>
        </div>
        <button
          onClick={buy}
          disabled={busy}
          className="btn-arena shrink-0 px-5 py-3 text-sm disabled:opacity-50"
        >
          {busy ? '…' : `Le racheter — ${offer.price}€`}
        </button>
      </div>
    </div>
  )
}
