'use client'

import { useEffect, useState } from 'react'

function msUntilParisMidnight(): number {
  const now = new Date()
  const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const next = new Date(parisNow)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - parisNow.getTime()
}

/** Compteur jusqu'à minuit (Europe/Paris), format HH:MM:SS. Rendu après montage
 *  uniquement (zéro mismatch d'hydration). */
export function MidnightCountdown() {
  const [ms, setMs] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setMs(msUntilParisMidnight())
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [])
  if (ms === null) return <span suppressHydrationWarning>--:--:--</span>
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return <span suppressHydrationWarning className="stat-numeral">{h}:{m}:{s}</span>
}
