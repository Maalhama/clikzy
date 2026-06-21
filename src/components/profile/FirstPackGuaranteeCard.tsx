'use client'

import { useEffect, useState } from 'react'
import { getFirstPackGuarantee, claimFirstPackGuarantee, type FirstPackGuaranteeStatus } from '@/actions/firstPackGuarantee'

export function FirstPackGuaranteeCard() {
  const [state, setState] = useState<FirstPackGuaranteeStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = () => getFirstPackGuarantee().then(setState)
  useEffect(() => { load().catch(() => setState(null)) }, [])

  async function claim() {
    setBusy(true)
    setMsg(null)
    const res = await claimFirstPackGuarantee()
    setBusy(false)
    if (!res.success) { setMsg(res.error ?? 'Erreur'); return }
    setMsg(`Garantie activée ! ${res.data?.credited ?? 0} crédits ajoutés à ton solde.`)
    await load()
  }

  // On n'affiche la card QUE si elle a un intérêt : éligible (peut réclamer) ou
  // déjà réclamée (confirmation). Sinon (pas d'achat, a gagné, expirée), rien.
  if (state === null) return null
  if (!state.eligible && !state.claimed) return null

  const deadlineLabel = state.deadline
    ? new Date(state.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null

  return (
    <section className="panel mt-8 p-5 sm:p-6 border border-neon-blue/25">
      <div className="flex items-center gap-2">
        <span className="text-xl">🛡️</span>
        <h2 className="font-display text-lg font-bold text-white">Garantie premier pack</h2>
      </div>

      {state.claimed ? (
        <p className="mt-2 text-sm text-success">
          Garantie déjà activée — ton premier pack t&apos;a été recrédité. Bonne chance pour ta première victoire !
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-white/60">
            Ta première fois est garantie : tu n&apos;as encore remporté aucun lot, alors récupère
            l&apos;équivalent de ton premier pack en crédits pour retenter ta chance.
            {deadlineLabel && <> Valable jusqu&apos;au {deadlineLabel}.</>}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
              <div className="font-display text-xl font-black text-neon-blue">+{state.amount}</div>
              <div className="text-[0.65rem] uppercase tracking-wider text-white/45">Crédits</div>
            </div>
            <button
              onClick={claim}
              disabled={busy}
              className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? '…' : `Récupérer mes ${state.amount} crédits`}
            </button>
          </div>
        </>
      )}
      {msg && <p className="mt-2 text-xs text-white/60">{msg}</p>}
    </section>
  )
}
