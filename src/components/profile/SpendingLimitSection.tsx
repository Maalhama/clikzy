'use client'

import { useEffect, useState } from 'react'
import { getMyPurchaseLimit, setMyPurchaseLimit, type PurchaseLimitState } from '@/actions/responsibleGaming'

export function SpendingLimitSection() {
  const [state, setState] = useState<PurchaseLimitState | null>(null)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = () =>
    getMyPurchaseLimit().then((s) => {
      setState(s)
      setValue(s.limit != null ? String(s.limit) : '')
    })

  useEffect(() => {
    load().catch(() => setState({ limit: null, canLoosenNow: true, canLoosenAt: null }))
  }, [])

  async function save(newLimit: number | null) {
    setSaving(true)
    setErr(null)
    setMsg(null)
    const res = await setMyPurchaseLimit(newLimit)
    setSaving(false)
    if (!res.success) {
      setErr(res.error ?? 'Erreur')
      return
    }
    setMsg(newLimit == null ? 'Limite retirée.' : `Limite fixée à ${newLimit} €/mois.`)
    await load()
  }

  return (
    <section className="panel mt-8 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Jeu responsable — limite de dépense</h2>
      <p className="mt-1 text-sm text-white/60">
        Fixe un plafond mensuel d&apos;achat de crédits. Tu peux le baisser à tout moment ; l&apos;augmenter ou le retirer prend effet 24h après ton dernier changement.
      </p>

      {state === null ? (
        <p className="mt-4 text-sm text-white/55">Chargement…</p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-white/70">
            Limite actuelle :{' '}
            <strong className="text-white">{state.limit != null ? `${state.limit} €/mois` : 'aucune'}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min="0"
              step="5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Montant €"
              className="w-32 rounded-lg border border-white/20 bg-bg-primary px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
            <button
              onClick={() => save(value ? Number(value) : null)}
              disabled={saving}
              className="rounded-lg bg-neon-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? '…' : 'Enregistrer'}
            </button>
            {state.limit != null && (
              <button
                onClick={() => save(null)}
                disabled={saving}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/70 disabled:opacity-50"
              >
                Retirer
              </button>
            )}
          </div>
          {!state.canLoosenNow && state.canLoosenAt && (
            <p className="text-xs text-white/40">
              Augmentation/retrait possible à partir du {new Date(state.canLoosenAt).toLocaleString('fr-FR')}.
            </p>
          )}
          {err && <p role="alert" className="text-xs text-danger">{err}</p>}
          {msg && <p className="text-xs text-success">{msg}</p>}
        </div>
      )}
    </section>
  )
}
