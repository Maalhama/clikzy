'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getBuyItNowOffers, createBuyItNowCheckout, type BuyItNowOffer } from '@/actions/buyItNow'
import { getProductImageWithFallback } from '@/lib/utils/productImages'

function timeLeft(expiresAt: string, now: number): string {
  const ms = new Date(expiresAt).getTime() - now
  if (ms <= 0) return 'expiré'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`
  const s = Math.floor((ms % 60_000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

function OfferImage({ name, url }: { name: string; url: string }) {
  const { primary, fallback } = getProductImageWithFallback(name, url)
  const [err, setErr] = useState(false)
  return (
    <Image
      src={err ? fallback : primary}
      alt={name}
      fill
      className="object-contain p-1"
      sizes="64px"
      onError={() => !err && setErr(true)}
    />
  )
}

export function BuyItNowSection() {
  const [offers, setOffers] = useState<BuyItNowOffer[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    getBuyItNowOffers()
      .then((r) => setOffers(r.success ? r.data ?? [] : []))
      .catch(() => setOffers([]))
  }, [])

  // Rafraîchit les comptes à rebours chaque seconde (urgence sous l'heure).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!offers || offers.length === 0) return null

  const buy = async (gameId: string) => {
    setBusy(gameId)
    setError(null)
    try {
      const r = await createBuyItNowCheckout(gameId)
      if (r.success && r.data?.url) {
        window.location.href = r.data.url
      } else {
        setError(r.error || 'Offre indisponible')
        setBusy(null)
      }
    } catch {
      setError('Erreur, réessaie')
      setBusy(null)
    }
  }

  return (
    <section className="panel p-5">
      <h2 className="font-display text-lg font-bold text-white">
        Rachat <span className="text-neon-pink">malin</span>
      </h2>
      <p className="mt-1 mb-4 text-sm text-white/55">
        Perdu de justesse ? Récupère ces lots à prix réduit — tes crédits dépensés comptent comme remise.
      </p>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {offers.map((o) => {
          const pct = o.retailValue > 0 ? Math.round((1 - o.price / o.retailValue) * 100) : 0
          const save = Math.max(0, Math.round(o.retailValue - o.price))
          const urgent = new Date(o.expiresAt).getTime() - now < 3 * 3_600_000
          return (
            <div
              key={o.gameId}
              className="flex items-center gap-3 rounded-xl border border-neon-pink/25 bg-neon-pink/[0.04] p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/30">
                <OfferImage name={o.itemName} url={o.itemImage} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-white">{o.itemName}</div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="stat-numeral text-lg font-black text-neon-pink">{o.price}€</span>
                  <span className="text-xs text-white/40 line-through">{o.retailValue}€</span>
                  {pct > 0 && (
                    <span className="rounded bg-neon-pink/15 px-1.5 text-[0.65rem] font-bold text-neon-pink">-{pct}%</span>
                  )}
                  {save > 0 && <span className="text-[0.65rem] text-white/55">tu économises {save}€</span>}
                </div>
                <div className={`mt-0.5 text-[0.7rem] ${urgent ? 'font-semibold text-neon-pink' : 'text-white/45'}`}>
                  Expire dans <span className="stat-numeral">{timeLeft(o.expiresAt, now)}</span>
                </div>
              </div>
              <button
                onClick={() => buy(o.gameId)}
                disabled={busy === o.gameId}
                className="btn-arena shrink-0 px-3 py-2 text-xs disabled:opacity-50"
              >
                {busy === o.gameId ? '…' : 'Acheter'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
