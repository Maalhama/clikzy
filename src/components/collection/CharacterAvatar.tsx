'use client'

import { PixelSprite } from './PixelSprite'
import { BASE_HERO, helmetLayer, armorLayer } from './pixelHero'
import { itemIconLayer } from './pixelItems'

type Slot = 'casque' | 'armure' | 'anneau' | 'artefact'
type EquippedItem = { id: string; slot: Slot; rarity: string; name: string }
type Equipment = Partial<Record<Slot, { item: EquippedItem }>>

const RARITY_HEX: Record<string, string> = {
  common: '#B9C2D8', rare: '#3CCBFF', epic: '#9B5CFF', legendary: '#FFD700', mythic: '#FF4FD8',
}
const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 }

/** Personnage pixel art : héros + couches casque/armure portées (pixel-perfect),
 *  anneau et artefact en orbes flottants de part et d'autre (pas de zone portée). */
export function CharacterAvatar({ equipment, size = 200 }: { equipment: Equipment; size?: number }) {
  const equipped = (['casque', 'armure', 'anneau', 'artefact'] as Slot[])
    .map((s) => equipment[s]?.item)
    .filter(Boolean) as EquippedItem[]
  const topRarity = equipped.reduce(
    (best, it) => (RARITY_RANK[it.rarity] > RARITY_RANK[best] ? it.rarity : best),
    'common'
  )
  const aura = RARITY_HEX[topRarity] ?? RARITY_HEX.common
  const orb = Math.round(size * 0.3)

  return (
    <div className="relative mx-auto flex items-center justify-center overflow-visible" style={{ width: size, height: size * 1.34 }}>
      {/* Aura de sol */}
      <div
        className="absolute left-1/2 bottom-[5%] -translate-x-1/2 rounded-[50%] blur-xl opacity-70"
        style={{ width: size * 0.6, height: size * 0.12, background: `radial-gradient(ellipse at center, ${aura}, transparent 70%)` }}
        aria-hidden
      />
      <div
        className="character-breathe absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ width: size, height: size, background: `radial-gradient(circle, ${aura}26, transparent 65%)` }}
        aria-hidden
      />

      {/* Artefact flottant à gauche */}
      {equipment.artefact && (
        <div className="character-orbit absolute top-[20%]" style={{ left: '-16%' }} title={equipment.artefact.item.name}>
          <span style={{ filter: `drop-shadow(0 0 6px ${RARITY_HEX[equipment.artefact.item.rarity]}AA)`, display: 'inline-flex' }}>
            <PixelSprite layers={[itemIconLayer('artefact', equipment.artefact.item.rarity)]} size={orb} />
          </span>
        </div>
      )}
      {/* Anneau flottant à droite */}
      {equipment.anneau && (
        <div className="character-orbit absolute bottom-[26%]" style={{ right: '-12%', animationDelay: '-3s' }} title={equipment.anneau.item.name}>
          <span style={{ filter: `drop-shadow(0 0 6px ${RARITY_HEX[equipment.anneau.item.rarity]}AA)`, display: 'inline-flex' }}>
            <PixelSprite layers={[itemIconLayer('anneau', equipment.anneau.item.rarity)]} size={Math.round(orb * 0.8)} />
          </span>
        </div>
      )}

      {/* Héros central */}
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
