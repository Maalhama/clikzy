'use client'

import { useState } from 'react'
import { requestSelfExclusion } from '@/actions/privacy'

const OPTIONS = [
  { days: 1, label: '24 heures' },
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
]

/** Jeu responsable : auto-exclusion (pause de compte) pour une durée choisie. */
export function ResponsibleGamingCard() {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pause = async () => {
    if (!selected) return
    setBusy(true)
    setError(null)
    const r = await requestSelfExclusion(selected)
    if (r.success) {
      window.location.href = '/'
    } else {
      setError(r.error || 'Erreur')
      setBusy(false)
    }
  }

  const label = OPTIONS.find((o) => o.days === selected)?.label

  return (
    <section className="panel p-5">
      <h2 className="font-display text-lg font-bold text-white">Faire une pause</h2>
      <p className="mt-1 mb-4 text-sm text-white/55">
        Besoin de souffler ? Mets ton compte en pause : tu ne pourras ni jouer ni acheter jusqu&apos;à la fin de la période.
        C&apos;est <span className="font-medium text-white/80">irréversible avant l&apos;échéance</span>.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPTIONS.map((o) => (
          <button
            key={o.days}
            aria-pressed={selected === o.days}
            onClick={() => { setSelected(o.days); setConfirming(false); setError(null) }}
            className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
              selected === o.days
                ? 'border-neon-purple bg-neon-purple/15 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {selected && !confirming && (
        <button onClick={() => setConfirming(true)} className="btn-arena-outline mt-3 w-full py-2.5 text-sm">
          Mettre en pause {label}
        </button>
      )}

      {confirming && (
        <div className="mt-3 rounded-xl border border-neon-purple/30 bg-neon-purple/[0.06] p-3">
          <p className="text-sm text-white/80">Confirmer la pause de {label} ? Tu seras déconnecté immédiatement.</p>
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button onClick={pause} disabled={busy} className="rounded-xl bg-neon-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? '…' : 'Confirmer'}
            </button>
            <button onClick={() => setConfirming(false)} className="btn-arena-ghost px-4 py-2 text-sm">Annuler</button>
          </div>
        </div>
      )}
    </section>
  )
}
