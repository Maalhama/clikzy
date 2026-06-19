'use client'

import { useEffect, useState } from 'react'
import { getMyCreditHistory, type CreditMovement } from '@/actions/credits'

// Libellés FR des raisons. Les raisons précises ('pack_purchase', etc.) viendront
// quand les RPC poseront app.ledger_reason ; en attendant on déduit credit/debit.
const REASON_LABELS: Record<string, string> = {
  credit: 'Crédits ajoutés',
  debit: 'Crédits dépensés',
  pack_purchase: 'Achat de pack',
  mini_game: 'Gain de mini-jeu',
  referral: 'Parrainage',
  gauge_refund: 'Conversion de jauge',
  ajustement: 'Ajustement',
}

function label(reason: string): string {
  return REASON_LABELS[reason] ?? reason
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export function CreditHistorySection() {
  const [items, setItems] = useState<CreditMovement[] | null>(null)

  useEffect(() => {
    let active = true
    getMyCreditHistory(50)
      .then((d) => { if (active) setItems(d) })
      .catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [])

  return (
    <section className="panel mt-8 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-lg font-bold text-white">Mouvements de crédits</h2>
        {items && items.length > 0 && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">{items.length}</span>
        )}
      </div>

      {items === null ? (
        <p className="py-4 text-center text-sm text-white/55">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/55">
          Aucun mouvement pour l&apos;instant. Tes achats, gains et conversions apparaîtront ici.
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {items.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{label(m.reason)}</p>
                <p className="text-xs text-white/40">{formatDate(m.created_at)}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-bold ${m.delta > 0 ? 'text-success' : 'text-danger'}`}>
                  {m.delta > 0 ? '+' : ''}{m.delta}
                </span>
                <span className="text-[0.7rem] text-white/40">solde {m.balance_after}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
