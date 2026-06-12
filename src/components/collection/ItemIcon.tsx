import { PixelSprite } from './PixelSprite'
import { RARITY_HEX } from '@/lib/cosmetics'
import { itemIconLayer } from './pixelItems'


/**
 * Icône d'objet en pixel art : sprite du slot recoloré par rareté + glow néon.
 * Même API qu'avant — drop-in partout (inventaire, médaillons, coffres...).
 */
export function ItemIcon({
  itemId: _itemId,
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
  const glow = RARITY_HEX[rarity] ?? RARITY_HEX.common
  return (
    <span
      className={className}
      style={{ filter: `drop-shadow(0 0 ${Math.max(2, size / 9)}px ${glow}AA)`, display: 'inline-flex' }}
    >
      <PixelSprite layers={[itemIconLayer(slot, rarity)]} size={size} />
    </span>
  )
}
