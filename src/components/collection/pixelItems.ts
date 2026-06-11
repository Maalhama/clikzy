import type { PixelLayer } from './PixelSprite'

// Sprites d'objets 16x16 (icône). Caractères génériques recolorés par rareté :
// X=contour, 1=clair, 2=base, 3=ombre, V=éclat néon.
const RARITY_SET: Record<string, [string, string, string]> = {
  common: ['#D6DEEF', '#9AA6C2', '#6B7799'],
  rare: ['#8FE3FF', '#3CCBFF', '#1F84B0'],
  epic: ['#C9A6FF', '#9B5CFF', '#5E32B0'],
  legendary: ['#FFE680', '#FFD700', '#B8860B'],
  mythic: ['#FF9DEC', '#FF4FD8', '#B5238F'],
}
function pal(r: string): Record<string, string> {
  const [l, b, d] = RARITY_SET[r] ?? RARITY_SET.common
  return { X: '#0A0E18', '1': l, '2': b, '3': d, V: '#EAFBFF' }
}

const CASQUE = [
  '................',
  '.....XXXXXX.....',
  '....X111111X....',
  '...X11111111X...',
  '..X1112222111X..',
  '..X1122222211X..',
  '..X1222222221X..',
  '..X1XXXXXXXX1X..',
  '..X1VVVVVVVV1X..',
  '..X1222222221X..',
  '..X13222222 31X.',
  '..X132222231X...',
  '...X13333331X...',
  '....XX3333XX....',
  '.....XXXXXX.....',
  '................',
]
const ARMURE = [
  '................',
  '...XX....XX.....',
  '..X11X..X11X....',
  '.X1111XX1111X...',
  '.X11222222 11X..',
  '.X1222222221X...',
  'X112222222211X..',
  'X122223322221X..',
  'X122233332221X..',
  'X112223322211X..',
  '.X1222222221X...',
  '.X1222222221X...',
  '.X3122222213X...',
  '..X33222233X....',
  '...X333333X.....',
  '....XXXXXX......',
]
const ANNEAU = [
  '................',
  '......XXXX......',
  '.....X1VV1X.....',
  '....X122221X....',
  '....X1VVVV1X....',
  '.....X2222X.....',
  '...XX222222XX...',
  '..X3322222233X..',
  '..X3X......X3X..',
  '..X3X......X3X..',
  '..X33X....X33X..',
  '...X33333333X...',
  '....X333333X....',
  '.....XX33XX.....',
  '................',
  '................',
]
const ARTEFACT = [
  '................',
  '......XXXX......',
  '....XX1111XX....',
  '...X11111111X...',
  '..X1112222111X..',
  '..X11222222 11X.',
  '.X112222222211X.',
  '.X122223V22221X.',
  '.X12223VVV2221X.',
  '.X112223V222 1X.',
  '..X1122222211X..',
  '..X1112222111X..',
  '...X11111111X...',
  '....XX1111XX....',
  '......XXXX......',
  '................',
]
const SLOT_SPRITE: Record<string, string[]> = {
  casque: CASQUE, armure: ARMURE, anneau: ANNEAU, artefact: ARTEFACT,
}

export function itemIconLayer(slot: string, rarity: string): PixelLayer {
  return { rows: SLOT_SPRITE[slot] ?? ARTEFACT, palette: pal(rarity) }
}
