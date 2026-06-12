'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Nombre animé : roule de l'ancienne valeur vers la nouvelle (~600 ms,
 * ease-out cubique). Un chiffre qui « roule » est perçu comme une récompense,
 * un chiffre qui change sèchement non. Respecte prefers-reduced-motion.
 */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (from === value) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const dur = 600
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span className={className}>{display.toLocaleString('fr-FR')}</span>
}
