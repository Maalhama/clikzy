import type { PixelLayer } from './PixelSprite'

// Grille commune 22x28. Toutes les couches s'y alignent (paper-doll).
// '.' = transparent.

const BASE_PALETTE: Record<string, string> = {
  O: '#0A0E18', // contour
  S: '#F0C79B', // peau
  s: '#C89366', // peau ombre
  B: '#26315A', // combinaison
  b: '#19213D', // combinaison ombre
  H: '#3A4A82', // combinaison highlight
  V: '#3CCBFF', // yeux néon
  M: '#11182B', // bottes/gants
}

export const BASE_HERO: PixelLayer = {
  palette: BASE_PALETTE,
  rows: [
    '......................',
    '......................',
    '.......OOOOOOOO.......',
    '......OssssssssO......',
    '.....OsSSSSSSSSsO.....',
    '.....OSSSSSSSSSSO.....',
    '.....OSSVVSSVVSSO.....',
    '.....OSSSSSSSSSSO.....',
    '......OSSSSSSSSO......',
    '.......OSSSSSSO.......',
    '........OOSSOO........',
    '......OOBBBBBBOO......',
    '....OOBBBBBBBBBBOO....',
    '...OBBBBHHHHHHBBBBO...',
    '...OBBBBHHHHHHBBBBO...',
    '..OBBBBBBBBBBBBBBBBO..',
    '..OBBBBBBBBBBBBBBBBO..',
    '..OBBBBBBBBBBBBBBBBO..',
    '...OBBBBBBBBBBBBBBO...',
    '...OBBBBBBBBBBBBBBO...',
    '....OBBBBBBBBBBBBO....',
    '.....OBBBOOOOBBBO.....',
    '.....OBBBO..OBBBO.....',
    '.....OBBBO..OBBBO.....',
    '.....OBBBO..OBBBO.....',
    '.....OMMMO..OMMMO.....',
    '.....OMMMO..OMMMO.....',
    '.....OOOOO..OOOOO.....',
  ],
}

// Couches d'équipement : caractères génériques (1=clair, 2=base, 3=ombre, X=contour)
// recolorés selon la rareté de l'item.
function equipPalette(light: string, base: string, dark: string): Record<string, string> {
  return { X: '#0A0E18', '1': light, '2': base, '3': dark }
}
const RARITY_SET: Record<string, [string, string, string]> = {
  common: ['#D6DEEF', '#9AA6C2', '#6B7799'],
  rare: ['#8FE3FF', '#3CCBFF', '#1F84B0'],
  epic: ['#C9A6FF', '#9B5CFF', '#5E32B0'],
  legendary: ['#FFE680', '#FFD700', '#B8860B'],
  mythic: ['#FF9DEC', '#FF4FD8', '#B5238F'],
}

const HELMET_ROWS = [
  '......................',
  '......................',
  '.......XXXXXXXX.......',
  '......X11111111X......',
  '.....X1122222211X.....',
  '.....X12XXXXXX21X.....',  // ouverture visière
  '.....X2X......X2X.....',
  '.....X33X....X33X.....',
  '......XX......XX......',
]
const ARMOR_ROWS = [
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '......XX2222XX......',
  '....XX1122221122XX....',
  '...X1122233332211X...',
  '...X1222333333221X...',
  '..X11222222222221X1..',
  '..X12222222222222X...',
  '..X33222222222233X...',
  '...X3322222222233X...',
  '...XX33333333333XX...',
]

export function helmetLayer(rarity: string): PixelLayer {
  const [l, b, d] = RARITY_SET[rarity] ?? RARITY_SET.common
  return { rows: HELMET_ROWS, palette: equipPalette(l, b, d) }
}
export function armorLayer(rarity: string): PixelLayer {
  const [l, b, d] = RARITY_SET[rarity] ?? RARITY_SET.common
  return { rows: ARMOR_ROWS, palette: equipPalette(l, b, d) }
}
