'use client'

import { ItemIcon } from '@/components/collection/ItemIcon'
import { GAME_ICON_PATHS } from './gameIconPaths'

type Slot = 'casque' | 'armure' | 'anneau' | 'artefact'
type EquippedItem = { id: string; slot: Slot; rarity: string; name: string }
type Equipment = Partial<Record<Slot, { item: EquippedItem }>>

const RARITY_HEX: Record<string, string> = {
  common: '#B9C2D8', rare: '#3CCBFF', epic: '#9B5CFF', legendary: '#FFD700', mythic: '#FF4FD8',
}
const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 }
const SLOT_LABEL: Record<Slot, string> = { casque: 'Casque', armure: 'Armure', anneau: 'Anneau', artefact: 'Artefact' }

// Médaillons placés autour du présentoir (en % du conteneur)
const SLOT_POS: Record<Slot, { top: string; left: string }> = {
  casque: { top: '2%', left: '50%' },    // au-dessus de la tête
  armure: { top: '50%', left: '8%' },    // flanc gauche (torse)
  anneau: { top: '50%', left: '92%' },   // flanc droit (main)
  artefact: { top: '92%', left: '50%' }, // dessous (relique)
}

function Medallion({ slot, eq, size }: { slot: Slot; eq?: EquippedItem; size: number }) {
  const color = eq ? RARITY_HEX[eq.rarity] ?? RARITY_HEX.common : '#3A465E'
  const pos = SLOT_POS[slot]
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ top: pos.top, left: pos.left }}
      title={eq ? eq.name : `${SLOT_LABEL[slot]} — vide`}
    >
      <div
        className="flex items-center justify-center rounded-full border-2 transition-transform duration-300 hover:scale-110"
        style={{
          width: size, height: size,
          borderColor: eq ? color : 'rgba(255,255,255,0.12)',
          borderStyle: eq ? 'solid' : 'dashed',
          background: eq
            ? `radial-gradient(circle at 50% 35%, ${color}26, rgba(11,15,26,0.95) 72%)`
            : 'rgba(255,255,255,0.03)',
          boxShadow: eq ? `0 0 16px -2px ${color}, inset 0 0 12px -6px ${color}` : 'none',
        }}
      >
        {eq ? (
          <ItemIcon itemId={eq.id} slot={eq.slot} rarity={eq.rarity} size={Math.round(size * 0.62)} />
        ) : (
          <span style={{ opacity: 0.3 }}>
            <ItemIcon slot={slot} rarity="common" size={Math.round(size * 0.5)} />
          </span>
        )}
      </div>
      <p className="mt-1 text-center text-[0.55rem] uppercase tracking-wider" style={{ color: eq ? color : 'rgba(255,255,255,0.3)' }}>
        {SLOT_LABEL[slot]}
      </p>
    </div>
  )
}

/**
 * Présentoir de personnage : buste-avatar dans un cadre hologramme circulaire,
 * entouré des 4 médaillons d'équipement sertis (couleur = rareté). L'aura
 * globale prend la teinte de la meilleure rareté équipée.
 */
export function CharacterAvatar({ equipment, size = 260 }: { equipment: Equipment; size?: number }) {
  const equipped = (['casque', 'armure', 'anneau', 'artefact'] as Slot[])
    .map((s) => equipment[s]?.item)
    .filter(Boolean) as EquippedItem[]
  const topRarity = equipped.reduce(
    (best, it) => (RARITY_RANK[it.rarity] > RARITY_RANK[best] ? it.rarity : best),
    'common'
  )
  const aura = RARITY_HEX[topRarity] ?? RARITY_HEX.common
  const med = Math.round(size * 0.26)        // taille médaillon
  const ring = size * 0.62                    // diamètre du présentoir

  return (
    <div className="relative mx-auto" style={{ width: size, height: size * 1.08 }}>
      {/* Présentoir hologramme centré */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2"
        style={{
          width: ring, height: ring,
          borderColor: `${aura}77`,
          background: `radial-gradient(circle at 50% 30%, ${aura}1f, #0B0F1A 75%)`,
          boxShadow: `0 0 32px -6px ${aura}, inset 0 0 26px -8px ${aura}`,
        }}
      >
        {/* anneau de scan animé */}
        <div className="character-breathe absolute inset-0 rounded-full" style={{ boxShadow: `inset 0 0 0 1px ${aura}55` }} aria-hidden />
        {/* buste-avatar sombre, centré */}
        <svg viewBox="0 0 512 512" className="character-float absolute left-1/2 top-[14%] -translate-x-1/2" width={ring * 0.82} height={ring * 0.82} preserveAspectRatio="xMidYMid meet" aria-hidden>
          <defs>
            <linearGradient id="char-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34406A" />
              <stop offset="100%" stopColor="#11182B" />
            </linearGradient>
          </defs>
          <path d={GAME_ICON_PATHS.character} fill="url(#char-body)" stroke={`${aura}88`} strokeWidth={5} />
        </svg>
      </div>

      {/* Médaillons d'équipement autour */}
      {(['casque', 'armure', 'anneau', 'artefact'] as Slot[]).map((slot) => (
        <Medallion key={slot} slot={slot} eq={equipment[slot]?.item} size={med} />
      ))}
    </div>
  )
}
