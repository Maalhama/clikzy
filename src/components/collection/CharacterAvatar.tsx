'use client'

import { ItemIcon } from '@/components/collection/ItemIcon'

type Slot = 'casque' | 'armure' | 'anneau' | 'artefact'
type EquippedItem = { id: string; slot: Slot; rarity: string; name: string }
type Equipment = Partial<Record<Slot, { item: EquippedItem }>>

const RARITY_HEX: Record<string, string> = {
  common: '#B9C2D8',
  rare: '#3CCBFF',
  epic: '#9B5CFF',
  legendary: '#FFD700',
  mythic: '#FF4FD8',
}

const RARITY_RANK: Record<string, number> = {
  common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4,
}

// Position d'ancrage de chaque slot sur le mannequin (en % du conteneur)
const ANCHOR: Record<Slot, { top: string; left: string; size: number }> = {
  casque: { top: '6%', left: '50%', size: 0.30 },   // au-dessus de la tête
  armure: { top: '42%', left: '50%', size: 0.34 },  // sur le torse
  anneau: { top: '58%', left: '76%', size: 0.20 },  // près de la main droite
  artefact: { top: '30%', left: '20%', size: 0.22 },// en orbite, flanc gauche
}

/**
 * Personnage paper-doll : un mannequin néon arcade sur lequel les items
 * équipés s'affichent à leur position anatomique. L'aura globale prend la
 * couleur de la rareté la plus haute équipée.
 */
export function CharacterAvatar({
  equipment,
  size = 240,
}: {
  equipment: Equipment
  size?: number
}) {
  const equipped = (['casque', 'armure', 'anneau', 'artefact'] as Slot[])
    .map((s) => equipment[s]?.item)
    .filter(Boolean) as EquippedItem[]

  const topRarity = equipped.reduce(
    (best, it) => (RARITY_RANK[it.rarity] > RARITY_RANK[best] ? it.rarity : best),
    'common'
  )
  const auraColor = RARITY_HEX[topRarity] ?? RARITY_HEX.common

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size * 1.16 }}
    >
      {/* Aura de sol */}
      <div
        className="absolute left-1/2 bottom-[4%] -translate-x-1/2 rounded-[50%] blur-xl opacity-70"
        style={{
          width: size * 0.6,
          height: size * 0.12,
          background: `radial-gradient(ellipse at center, ${auraColor}, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* Halo respirant derrière le perso (couleur de la meilleure rareté) */}
      <div
        className="character-breathe absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: size * 0.8,
          height: size * 0.8,
          background: `radial-gradient(circle, ${auraColor}33, transparent 65%)`,
        }}
        aria-hidden
      />

      {/* Mannequin néon arcade */}
      <svg
        viewBox="0 0 200 232"
        className="character-float absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="charBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2540" />
            <stop offset="100%" stopColor="#0E1424" />
          </linearGradient>
          <linearGradient id="charEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9B5CFF" />
            <stop offset="55%" stopColor="#FF4FD8" />
            <stop offset="100%" stopColor="#3CCBFF" />
          </linearGradient>
        </defs>

        <g
          stroke="url(#charEdge)"
          strokeWidth={2.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="url(#charBody)"
          style={{ filter: 'drop-shadow(0 0 6px rgba(155,92,255,0.45))' }}
        >
          {/* Tête */}
          <path d="M100 20 C112 20 120 30 120 43 C120 56 112 66 100 66 C88 66 80 56 80 43 C80 30 88 20 100 20 Z" />
          {/* Visière néon */}
          <path d="M86 42 L114 42" strokeWidth={3} stroke="#3CCBFF" style={{ filter: 'drop-shadow(0 0 4px #3CCBFF)' }} />
          {/* Cou */}
          <path d="M92 66 L92 76 M108 66 L108 76" />
          {/* Torse (trapèze épaules larges) */}
          <path d="M70 78 L130 78 L122 150 L78 150 Z" />
          {/* Ligne d'énergie centrale */}
          <path d="M100 86 L100 142" strokeWidth={1.5} stroke="#FF4FD8" opacity={0.6} />
          {/* Épaulières */}
          <path d="M70 78 C60 80 56 92 60 102 L72 96 Z" />
          <path d="M130 78 C140 80 144 92 140 102 L128 96 Z" />
          {/* Bras gauche */}
          <path d="M62 100 L52 142 L62 146 L74 108 Z" />
          {/* Bras droit (main = porte l'anneau) */}
          <path d="M138 100 L148 142 L138 146 L126 108 Z" />
          {/* Mains */}
          <circle cx="56" cy="150" r="7" />
          <circle cx="144" cy="150" r="7" />
          {/* Ceinture */}
          <path d="M78 150 L122 150 L120 162 L80 162 Z" />
          {/* Jambes */}
          <path d="M84 162 L80 214 L94 214 L98 164 Z" />
          <path d="M116 162 L120 214 L106 214 L102 164 Z" />
          {/* Bottes */}
          <path d="M78 214 L96 214 L96 224 L78 224 Z" />
          <path d="M104 214 L122 214 L122 224 L104 224 Z" />
        </g>
      </svg>

      {/* Items équipés superposés aux ancrages anatomiques */}
      {(['artefact', 'armure', 'casque', 'anneau'] as Slot[]).map((slot) => {
        const eq = equipment[slot]?.item
        if (!eq) return null
        const a = ANCHOR[slot]
        const itemSize = Math.round(size * a.size)
        return (
          <div
            key={slot}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${slot === 'artefact' ? 'character-orbit' : ''}`}
            style={{ top: a.top, left: a.left }}
            title={eq.name}
          >
            <ItemIcon itemId={eq.id} slot={eq.slot} rarity={eq.rarity} size={itemSize} />
          </div>
        )
      })}
    </div>
  )
}
