'use client'

import { PixelSprite } from '@/components/collection/PixelSprite'
import { BASE_HERO } from '@/components/collection/pixelHero'

/**
 * Avatar pixel art : le héros de la marque, recoloré de façon DÉTERMINISTE
 * par username (hue-rotate). Remplace les cercles à initiale génériques —
 * chaque joueur a « son » héros, et la signature pixel vit partout.
 */
export function PixelAvatar({ username, size = 36, className = '' }: {
  username: string
  size?: number
  className?: string
}) {
  let h = 0
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) % 360
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-b from-white/[0.07] to-transparent ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span style={{ filter: `hue-rotate(${h}deg) saturate(1.15)`, display: 'inline-flex', transform: 'translateY(8%)' }}>
        <PixelSprite size={Math.round(size * 0.78)} layers={[BASE_HERO]} />
      </span>
    </span>
  )
}
