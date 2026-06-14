// ============================================================
// Icônes PIXEL ART maison — style « jeton » (cohérent avec PackCard/PixelChip).
// Rendu SVG net (shapeRendering=crispEdges). Deux moteurs :
//  - disque géométrique (cercles pixel parfaitement symétriques, sans dessin main)
//  - sprite char-map (icônes dessinées à la main, 1 char = 1 pixel)
// Le pixel art reste réservé aux VISUELS/icônes — jamais la typo (cf. mémoire).
// ============================================================
import * as React from 'react'

// ---- Moteur disque géométrique ----
type DiscBand = 'edge' | 'body' | 'shine' | 'shadow'

function discCells(R: number): { x: number; y: number; t: DiscBand }[] {
  const c = (R - 1) / 2
  const max = R / 2
  const out: { x: number; y: number; t: DiscBand }[] = []
  for (let y = 0; y < R; y++) {
    for (let x = 0; x < R; x++) {
      const dx = x - c
      const dy = y - c
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > max) continue
      let t: DiscBand = 'body'
      if (d > max - 1) t = 'edge' // contour 1px
      else if (dx < -0.5 && dy < -0.5 && d < max - 1.4) t = 'shine' // reflet haut-gauche
      else if (dx > 0.8 && dy > 0.8 && d > max - 2.2 && d < max - 0.6) t = 'shadow' // ombre bas-droite
      out.push({ x, y, t })
    }
  }
  return out
}

const COIN_CELLS = discCells(16)

type CoinPalette = { edge: string; body: string; shine: string; shadow: string }
const GOLD: CoinPalette = { edge: '#6B4A05', body: '#FBC02D', shine: '#FFF1B8', shadow: '#C77F0A' }

/** Pièce de crédits — disque pixel doré (façon jeton). */
export function PixelCoin({ className = 'h-4 w-4', title }: { className?: string; title?: string }) {
  const p = GOLD
  return (
    <svg
      viewBox="0 0 16 16"
      className={`inline-block ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? 'crédits'}
      style={{ imageRendering: 'pixelated' }}
    >
      {title ? <title>{title}</title> : null}
      {COIN_CELLS.map((cell, i) => (
        <rect key={i} x={cell.x} y={cell.y} width={1.04} height={1.04} fill={p[cell.t]} />
      ))}
      {/* symbole crédit : petit « C » sombre au centre */}
      <rect x={6} y={5} width={4} height={1.4} fill={p.edge} />
      <rect x={6} y={5} width={1.4} height={6} fill={p.edge} />
      <rect x={6} y={9.6} width={4} height={1.4} fill={p.edge} />
    </svg>
  )
}
