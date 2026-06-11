'use client'

import { PixelSprite } from './PixelSprite'
import { BASE_HERO, helmetLayer, armorLayer } from './pixelHero'

type Slot = 'casque' | 'armure' | 'anneau' | 'artefact'
type EquippedItem = { id: string; slot: Slot; rarity: string; name: string }
type Equipment = Partial<Record<Slot, { item: EquippedItem }>>

const RARITY_HEX: Record<string, string> = {
  common: '#B9C2D8', rare: '#3CCBFF', epic: '#9B5CFF', legendary: '#FFD700', mythic: '#FF4FD8',
}
const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 }

/** Personnage pixel art : héros de base + couches d'équipement superposées
 *  au pixel près (paper-doll). Casque et armure prennent la couleur de leur rareté. */
export function CharacterAvatar({ equipment, size = 200 }: { equipment: Equipment; size?: number }) {
  const equipped = (['casque', 'armure', 'anneau', 'artefact'] as Slot[])
    .map((s) => equipment[s]?.item)
    .filter(Boolean) as EquippedItem[]
  const topRarity = equipped.reduce(
    (best, it) => (RARITY_RANK[it.rarity] > RARITY_RANK[best] ? it.rarity : best),
    'common'
  )
  const aura = RARITY_HEX[topRarity] ?? RARITY_HEX.common

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size * 1.3 }}>
      {/* Aura de sol */}
      <div
        className="absolute left-1/2 bottom-[6%] -translate-x-1/2 rounded-[50%] blur-xl opacity-70"
        style={{ width: size * 0.62, height: size * 0.12, background: `radial-gradient(ellipse at center, ${aura}, transparent 70%)` }}
        aria-hidden
      />
      {/* Halo respirant */}
      <div
        className="character-breathe absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ width: size * 0.85, height: size * 0.85, background: `radial-gradient(circle, ${aura}26, transparent 65%)` }}
        aria-hidden
      />
      <div className="character-float relative" style={{ filter: `drop-shadow(0 0 6px ${aura}66)` }}>
        <PixelSprite
          size={size}
          layers={[
            BASE_HERO,
            equipment.armure ? armorLayer(equipment.armure.item.rarity) : null,
            equipment.casque ? helmetLayer(equipment.casque.item.rarity) : null,
          ]}
        />
      </div>
    </div>
  )
}
