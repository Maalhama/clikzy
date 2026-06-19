'use client'

import { useEffect, useState } from 'react'
import { getStreakState, buyStreakFreeze, type StreakState } from '@/actions/streak'

export function StreakFreezeCard() {
  const [state, setState] = useState<StreakState | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = () => getStreakState().then(setState)
  useEffect(() => { load().catch(() => setState({ streak: 0, freezes: 0 })) }, [])

  async function buy() {
    setBusy(true)
    setMsg(null)
    const res = await buyStreakFreeze()
    setBusy(false)
    if (!res.success) { setMsg(res.error ?? 'Erreur'); return }
    setMsg('Gel acheté ! Ta série est protégée.')
    await load()
  }

  if (state === null) return null

  return (
    <section className="panel mt-8 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Série &amp; gels</h2>
      <p className="mt-1 text-sm text-white/60">
        Un gel couvre un jour manqué pour ne pas perdre ta série. Max 3 en réserve — 100 crédits l&apos;unité.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
          <div className="font-display text-xl font-black text-warning">🔥 {state.streak}</div>
          <div className="text-[0.65rem] uppercase tracking-wider text-white/45">Série</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
          <div className="font-display text-xl font-black text-neon-blue">🧊 {state.freezes}</div>
          <div className="text-[0.65rem] uppercase tracking-wider text-white/45">Gels</div>
        </div>
        <button
          onClick={buy}
          disabled={busy || state.freezes >= 3}
          className="rounded-lg bg-neon-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? '…' : state.freezes >= 3 ? 'Maximum atteint' : 'Acheter un gel (100)'}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-white/60">{msg}</p>}
    </section>
  )
}
