'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, RefreshCw, ChevronDown } from 'lucide-react'
import { getFairness, rotateFairness, type FairnessState } from '@/actions/fairness'

/**
 * Panneau « équité vérifiable » (provably-fair). Le joueur voit le hash du
 * server_seed (engagement pris avant ses parties), son client_seed et le
 * nonce. En tournant le seed, l'ancien server_seed est révélé : il peut alors
 * vérifier que sha256(server_seed) == le hash affiché précédemment, et
 * recalculer chaque résultat via HMAC(server_seed, client_seed:nonce:cursor).
 */
export function FairnessPanel() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FairnessState | null>(null)
  const [clientSeedInput, setClientSeedInput] = useState('')
  const [revealed, setRevealed] = useState<{ oldServerSeed: string; oldHash: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open && !state) getFairness().then((r) => { if (r.success && r.data) { setState(r.data); setClientSeedInput(r.data.clientSeed ?? '') } }).catch(() => {})
  }, [open, state])

  const rotate = async () => {
    setBusy(true)
    const res = await rotateFairness(clientSeedInput)
    if (res.success && res.data) {
      setRevealed({ oldServerSeed: res.data.oldServerSeed, oldHash: res.data.oldHash })
      const fresh = await getFairness()
      if (fresh.success && fresh.data) setState(fresh.data)
    }
    setBusy(false)
  }

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-[var(--bg-secondary)]/40 p-5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4 text-success" />
          Équité vérifiable (provably-fair)
        </span>
        <ChevronDown className={`h-4 w-4 text-white/55 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-xs text-white/60">
          <p>
            Chaque résultat est calculé par <span className="text-white/80">HMAC-SHA256(server_seed, client_seed:nonce)</span>.
            On s&apos;engage sur le hash du <span className="text-white/80">server_seed</span> avant que tu joues : on ne peut donc pas le truquer après coup.
          </p>
          {state ? (
            <div className="space-y-2">
              <Field label="Hash du server seed (engagement)" value={state.serverSeedHash ?? '— joue une partie pour l’initialiser —'} />
              <div>
                <label className="mb-1 block text-[0.65rem] uppercase tracking-wider text-white/55">Ton client seed (modifiable)</label>
                <input
                  value={clientSeedInput}
                  onChange={(e) => setClientSeedInput(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[0.7rem] text-white outline-none focus:border-neon-purple"
                />
              </div>
              <Field label="Nonce (parties jouées avec ce seed)" value={String(state.nonce)} />
              <button onClick={rotate} disabled={busy} className="btn-arena-ghost mt-1 px-4 py-2 text-xs disabled:opacity-60">
                <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
                Changer de seed & révéler l’ancien
              </button>
              {revealed && (
                <div className="mt-2 rounded-lg border border-success/30 bg-success/10 p-3">
                  <p className="mb-1 font-semibold text-success">Ancien server seed révélé — à vérifier :</p>
                  <Field label="Ancien server seed" value={revealed.oldServerSeed} />
                  <Field label="Devait hasher en" value={revealed.oldHash} />
                  <p className="mt-1 text-[0.65rem] text-white/50">Vérifie : sha256(server seed) doit être égal au hash ci-dessus.</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/55">Chargement…</p>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-wider text-white/55">{label}</p>
      <p className="break-all rounded-lg bg-black/30 px-3 py-2 font-mono text-[0.7rem] text-white/80">{value}</p>
    </div>
  )
}
