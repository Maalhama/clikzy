'use client'

import { useEffect, useRef, useState } from 'react'
import { getMyDeliveredWins, uploadDeliveryPhoto, type MyDeliveredWin } from '@/actions/winners'

export function DeliveryPhotoSection() {
  const [wins, setWins] = useState<MyDeliveredWin[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = () => getMyDeliveredWins().then(setWins)

  useEffect(() => {
    load().catch(() => setWins([]))
  }, [])

  async function onFile(winId: string, file: File) {
    setBusy(winId)
    setMsg(null)
    const fd = new FormData()
    fd.append('photo', file)
    const res = await uploadDeliveryPhoto(winId, fd)
    setBusy(null)
    if (res.success) {
      setMsg('Photo envoyée ! Elle sera publiée sur le mur des gagnants après vérification.')
      await load()
    } else {
      setMsg(res.error ?? 'Erreur')
    }
  }

  // Rien à afficher tant qu'aucun lot n'est expédié/livré.
  if (wins === null || wins.length === 0) return null

  return (
    <section className="panel mt-8 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Mes preuves de livraison</h2>
      <p className="mt-1 text-sm text-white/60">
        Reçu ton lot ? Partage une photo : après vérification, elle s&apos;affiche sur le mur des gagnants.
      </p>
      <div className="mt-4 space-y-2">
        {wins.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
            <span className="truncate text-sm text-white">{w.itemName}</span>
            {w.deliveryPhotoUrl ? (
              <span className={`text-xs ${w.approved ? 'text-success' : 'text-white/40'}`}>
                {w.approved ? 'Publiée' : 'En vérification'}
              </span>
            ) : (
              <>
                <input
                  ref={(el) => { fileRefs.current[w.id] = el }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onFile(w.id, f)
                  }}
                />
                <button
                  onClick={() => fileRefs.current[w.id]?.click()}
                  disabled={busy === w.id}
                  className="flex-shrink-0 rounded-lg bg-neon-purple px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {busy === w.id ? '…' : 'Ajouter une photo'}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      {msg && <p className="mt-2 text-xs text-white/60">{msg}</p>}
    </section>
  )
}
