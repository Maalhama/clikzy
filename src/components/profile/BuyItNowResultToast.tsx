'use client'

import { useEffect, useState } from 'react'

/** Confirmation premium au retour de Stripe (?buyitnow=success|cancelled).
 *  Nettoie l'URL et s'auto-masque. Rendu inconditionnellement sur le profil. */
export function BuyItNowResultToast() {
  const [state, setState] = useState<'success' | 'cancelled' | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('buyitnow')
    if (p !== 'success' && p !== 'cancelled') return
    setState(p)
    const url = new URL(window.location.href)
    url.searchParams.delete('buyitnow')
    window.history.replaceState({}, '', url.toString())
    const t = setTimeout(() => setState(null), 7000)
    return () => clearTimeout(t)
  }, [])

  if (!state) return null

  const success = state === 'success'
  return (
    <div
      role="status"
      onClick={() => setState(null)}
      className={`fixed top-4 left-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 cursor-pointer rounded-xl border px-4 py-3 backdrop-blur-md shadow-lg ${
        success
          ? 'border-success/40 bg-success/15 shadow-success/20'
          : 'border-white/15 bg-bg-secondary/90'
      }`}
    >
      {success ? (
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-white">Rachat confirmé !</p>
            <p className="mt-0.5 text-white/65">Ton lot sera préparé puis expédié — tu recevras le numéro de suivi par email.</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/70">Achat annulé — ton offre de rachat reste disponible tant qu&apos;elle n&apos;a pas expiré.</p>
      )}
    </div>
  )
}
