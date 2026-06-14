'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getBuyItNowOffers, createBuyItNowCheckout, type BuyItNowOffer } from '@/actions/buyItNow'
import { getProductImageWithFallback } from '@/lib/utils/productImages'

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expiré'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
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
  const [, setTick] = useState(0)

  useEffect(() => {
    getBuyItNowOffers()
      .then((r) => setOffers(r.success ? r.data ?? [] : []))
      .catch(() => setOffers([]))
  }, [])

  // Rafraîchit les comptes à rebours chaque minute.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
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
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="stat-numeral text-lg font-black text-neon-pink">{o.price}€</span>
                  <span className="text-xs text-white/40 line-through">{o.retailValue}€</span>
                  {pct > 0 && (
                    <span className="rounded bg-neon-pink/15 px-1.5 text-[0.65rem] font-bold text-neon-pink">-{pct}%</span>
                  )}
                </div>
                <div className="mt-0.5 text-[0.7rem] text-white/45">Expire dans {timeLeft(o.expiresAt)}</div>
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
