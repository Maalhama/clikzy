'use client'

import { useEffect, useRef, useState } from 'react'
import { CURSOR_CSS, TRAIL_COLORS } from '@/lib/cosmetics'

type Particle = { id: number; x: number; y: number; c: string; dx: number; dy: number }

/**
 * Applique les cosmétiques globaux du joueur : curseur custom (sur tout le
 * document) + traînée pixel au clic. Monté une fois dans le layout (main).
 */
export function CosmeticsProvider({ cursor, trail }: { cursor: string; trail: string }) {
  // Curseur custom
  useEffect(() => {
    const css = CURSOR_CSS[cursor]
    if (!css || css === 'auto') return
    const root = document.documentElement
    root.style.cursor = css
    return () => { root.style.cursor = '' }
  }, [cursor])

  // Traînée de clic
  const colors = TRAIL_COLORS[trail] ?? []
  const [parts, setParts] = useState<Particle[]>([])
  const seq = useRef(0)
  useEffect(() => {
    if (colors.length === 0) return
    const onDown = (e: PointerEvent) => {
      const batch: Particle[] = Array.from({ length: 6 }, (_, i) => ({
        id: ++seq.current,
        x: e.clientX,
        y: e.clientY,
        c: colors[i % colors.length],
        dx: (Math.random() - 0.5) * 44,
        dy: -(Math.random() * 40 + 12),
      }))
      setParts((p) => [...p.slice(-36), ...batch])
      const ids = new Set(batch.map((b) => b.id))
      setTimeout(() => setParts((p) => p.filter((x) => !ids.has(x.id))), 700)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail])

  if (colors.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      {parts.map((p) => (
        <span
          key={p.id}
          className="trail-particle"
          style={{ left: p.x, top: p.y, background: p.c, '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
