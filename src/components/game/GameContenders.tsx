'use client'

import { useEffect, useState } from 'react'
import { getGameContenders } from '@/actions/game'

/** Preuve sociale minimaliste : micro-ligne « N en lice » sous le leader.
 *  Données réelles (participants distincts récents). Se masque si < 2 (pas de
 *  signal) ou partie terminée/en attente. Rafraîchi toutes les 30 s. */
export function GameContenders({ gameId, status }: { gameId: string; status: string | null }) {
  const [n, setN] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'ended' || status === 'waiting') return
    let alive = true
    const load = () =>
      getGameContenders(gameId)
        .then((r) => {
          if (alive && r.success) setN(r.data ?? null)
        })
        .catch(() => {})
    load()
    const id = setInterval(load, 30_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [gameId, status])

  if (n === null || n < 2) return null

  return (
    <div className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-white/45">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-pink/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon-pink" />
      </span>
      <span>
        <span className="stat-numeral font-semibold text-white/70">{n}</span> en lice
      </span>
    </div>
  )
}
