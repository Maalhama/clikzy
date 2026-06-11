import { GAME_ICON_PATHS } from './gameIconPaths'

// Couleurs par rareté (clair → foncé pour donner du volume au remplissage)
const RARITY_HEX: Record<string, string> = {
  common: '#C7D0E4',
  rare: '#3CCBFF',
  epic: '#9B5CFF',
  legendary: '#FFD700',
  mythic: '#FF4FD8',
}
const RARITY_DARK: Record<string, string> = {
  common: '#7E8AA6',
  rare: '#1F7FB0',
  epic: '#5E32B0',
  legendary: '#B8860B',
  mythic: '#B5238F',
}

const SLOT_FALLBACK: Record<string, string> = {
  casque: 'slot_casque',
  armure: 'slot_armure',
  anneau: 'slot_anneau',
  artefact: 'slot_artefact',
}

/**
 * Icône d'objet : silhouette pleine (game-icons.net) teintée par rareté avec
 * dégradé de volume + glow néon. Même API qu'avant — rien d'autre à changer.
 */
export function ItemIcon({
  itemId,
  slot,
  rarity,
  size = 32,
  className = '',
}: {
  itemId?: string
  slot: string
  rarity: string
  size?: number
  className?: string
}) {
  const light = RARITY_HEX[rarity] ?? RARITY_HEX.common
  const dark = RARITY_DARK[rarity] ?? RARITY_DARK.common
  const path =
    (itemId && GAME_ICON_PATHS[itemId]) ||
    GAME_ICON_PATHS[SLOT_FALLBACK[slot]] ||
    GAME_ICON_PATHS.slot_artefact

  const gid = `gi-${(itemId || slot)}-${rarity}`.replace(/[^a-zA-Z0-9_-]/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      style={{ filter: `drop-shadow(0 0 ${Math.max(3, size / 7)}px ${light}AA)`, display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#${gid})`} />
    </svg>
  )
}
