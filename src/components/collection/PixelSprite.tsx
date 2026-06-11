'use client'

// Rendu pixel art net : une matrice de caractères → carrés SVG (crispEdges).
// Plusieurs couches (corps + équipement) partagent la même grille, donc se
// superposent au pixel près — le principe du paper-doll RPG.

export type PixelLayer = { rows: string[]; palette: Record<string, string> }

// Fusionne des couches : un pixel non-vide d'une couche supérieure écrase.
export function mergePixelLayers(...layers: (PixelLayer | null | undefined)[]): { grid: string[][]; colors: Record<string, string> } {
  const real = layers.filter(Boolean) as PixelLayer[]
  const h = Math.max(...real.map((l) => l.rows.length))
  const w = Math.max(...real.flatMap((l) => l.rows.map((r) => r.length)))
  const grid: string[][] = Array.from({ length: h }, () => Array(w).fill(''))
  const colors: Record<string, string> = {}
  let counter = 0
  const keyOf: Record<string, string> = {}

  for (const layer of real) {
    layer.rows.forEach((row, y) => {
      ;[...row].forEach((ch, x) => {
        if (ch === '.' || ch === ' ') return
        const hex = layer.palette[ch]
        if (!hex) return
        let k = keyOf[hex]
        if (!k) { k = String.fromCharCode(65 + counter++); keyOf[hex] = k; colors[k] = hex }
        grid[y][x] = k
      })
    })
  }
  return { grid, colors }
}

export function PixelSprite({
  layers,
  size = 200,
  className = '',
}: {
  layers: (PixelLayer | null | undefined)[]
  size?: number
  className?: string
}) {
  const { grid, colors } = mergePixelLayers(...layers)
  const h = grid.length
  const w = grid[0]?.length ?? 1
  const rects: React.ReactNode[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = grid[y][x]
      if (!k) continue
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={colors[k]} />)
    }
  }
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      aria-hidden
    >
      {rects}
    </svg>
  )
}
