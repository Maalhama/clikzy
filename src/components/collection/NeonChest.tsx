'use client'

import { motion } from 'framer-motion'

export type ChestRarityKey = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

// Palette par rareté — coffre PIXEL ART (sprite), traduit dans la DA néon.
// frame = ferrures/contour, panelTop = bois clair (couvercle), panelBottom = bois
// corps, strap = sangles métal, accent = reflets/lueur, gem = gemmes (épique+).
export const CHEST_THEME: Record<ChestRarityKey, {
  frame: string; panelTop: string; panelBottom: string; strap: string; accent: string; gem?: string
}> = {
  common: { frame: '#8E9BB5', panelTop: '#3A4663', panelBottom: '#222C44', strap: '#566180', accent: '#C3CCE0' },
  rare: { frame: '#3CCBFF', panelTop: '#155A78', panelBottom: '#0E3A50', strap: '#1E6E92', accent: '#9CEBFF' },
  epic: { frame: '#9B5CFF', panelTop: '#3E2772', panelBottom: '#271649', strap: '#5B3A9E', accent: '#CFA8FF', gem: '#FF4FD8' },
  legendary: { frame: '#FFD700', panelTop: '#6E560C', panelBottom: '#43340A', strap: '#9C8118', accent: '#FFE680', gem: '#FF4FD8' },
  mythic: { frame: '#FF4FD8', panelTop: '#6E1E5B', panelBottom: '#421038', strap: '#8C2B75', accent: '#FFA8EC', gem: '#3CCBFF' },
}

interface NeonChestProps {
  rarity: string
  /** largeur en px (hauteur ≈ 0.83 × largeur) */
  size?: number
  /** couvercle ouvert (sprite ouvert + lueur) */
  open?: boolean
  className?: string
}

type Theme = (typeof CHEST_THEME)[ChestRarityKey]
type Cell = [number, number, number, number, keyof Theme | 'white' | 'glow']

// Sprite FERMÉ (grille 18 × 15) — couvercle bombé + rim + corps + serrure
const CLOSED: Cell[] = [
  // couvercle bombé
  [5, 0, 8, 1, 'frame'],
  [4, 1, 10, 4, 'frame'],
  [5, 1, 8, 3, 'panelTop'],
  [5, 1, 8, 1, 'accent'],
  // rim métallique pleine largeur (séparateur couvercle/corps)
  [2, 4, 14, 1, 'frame'],
  // corps
  [2, 5, 14, 9, 'frame'],
  [3, 6, 12, 7, 'panelBottom'],
  [3, 6, 12, 1, 'accent'],
  // sangles (corps uniquement)
  [5, 6, 2, 7, 'strap'],
  [11, 6, 2, 7, 'strap'],
  // serrure sur la jonction
  [8, 3, 2, 4, 'frame'],
  [8, 4, 2, 2, 'accent'],
  // pieds
  [3, 14, 3, 1, 'strap'],
  [12, 14, 3, 1, 'strap'],
]

// Sprite OUVERT — couvercle relevé + intérieur lumineux
const OPEN: Cell[] = [
  // couvercle relevé (lip en haut)
  [4, 0, 10, 1, 'frame'],
  [5, 0, 8, 1, 'accent'],
  // corps
  [2, 5, 14, 9, 'frame'],
  [3, 6, 12, 7, 'panelBottom'],
  // intérieur lumineux
  [3, 6, 12, 3, 'glow'],
  [4, 7, 10, 2, 'accent'],
  [6, 7, 1, 1, 'white'],
  [9, 6, 1, 1, 'white'],
  [11, 7, 1, 1, 'white'],
  // sangles (bas du corps)
  [5, 9, 2, 4, 'strap'],
  [11, 9, 2, 4, 'strap'],
  // pieds
  [3, 14, 3, 1, 'strap'],
  [12, 14, 3, 1, 'strap'],
]

/**
 * Coffre PIXEL ART (sprite SVG net). Sprite fermé/ouvert selon `open`,
 * rendu crisp + couleurs par rareté. Interface inchangée (drop-in NeonChest).
 */
export function NeonChest({ rarity, size = 176, open = false, className = '' }: NeonChestProps) {
  const t = CHEST_THEME[(rarity as ChestRarityKey)] ?? CHEST_THEME.common
  const isLegendary = rarity === 'legendary' || rarity === 'mythic'
  const cells = open ? OPEN : CLOSED
  const color = (k: Cell[4]): string =>
    k === 'white' ? '#FFFFFF' : k === 'glow' ? (t.gem ?? t.accent) : (t[k] as string)

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size }}>
      {/* lueur d'ambiance */}
      <div
        aria-hidden="true"
        className={`absolute -inset-2 -z-10 rounded-full blur-xl ${isLegendary ? 'animate-pulse' : ''}`}
        style={{ background: `radial-gradient(ellipse at center 65%, ${t.frame}66, transparent 70%)` }}
      />
      <motion.svg
        viewBox="0 0 18 15"
        width={size}
        height={(size * 15) / 18}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Coffre ${rarity}${open ? ' ouvert' : ''}`}
        style={{ imageRendering: 'pixelated', filter: `drop-shadow(0 2px 6px ${t.frame}66)` }}
        initial={false}
        animate={open ? { scale: [1, 1.12, 1.04] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* gemmes (épique+) */}
        {t.gem && !open && (
          <>
            <rect x={3} y={10} width={1.04} height={1.04} fill={t.gem} />
            <rect x={14} y={10} width={1.04} height={1.04} fill={t.gem} />
            {isLegendary && <rect x={8} y={11} width={1.04} height={1.04} fill={t.gem} />}
          </>
        )}
        {cells.map(([x, y, w, h, k], i) => (
          <rect key={i} x={x} y={y} width={w + 0.03} height={h + 0.03} fill={color(k)} />
        ))}
      </motion.svg>
    </div>
  )
}
