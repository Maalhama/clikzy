// Designs des cosmétiques (rendu). La logique de déblocage/possession est en
// DB (cosmetics_catalog) ; ici on ne décrit QUE l'apparence.

// --- Curseurs : flèche SVG colorée en data-URI (hotspot 2,2) ---
function cursorArrow(fill: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24'><path d='M5 3l14 9-7 2-3 7-4-18z' fill='${fill}' stroke='white' stroke-width='1.6' stroke-linejoin='round'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 2 2, auto`
}

export const CURSOR_CSS: Record<string, string> = {
  cursor_default: 'auto',
  cursor_pink: cursorArrow('#FF4FD8'),
  cursor_cyan: cursorArrow('#3CCBFF'),
  cursor_gold: cursorArrow('#FFD700'),
  cursor_void: cursorArrow('#9B5CFF'),
}

// --- Traînées de clic : palette de particules ---
export const TRAIL_COLORS: Record<string, string[]> = {
  trail_none: [],
  trail_spark: ['#FF4FD8', '#FF7AE5'],
  trail_cyan: ['#3CCBFF', '#7FE0FF'],
  trail_gold: ['#FFD700', '#FF8C00'],
  trail_rainbow: ['#9B5CFF', '#FF4FD8', '#3CCBFF', '#00FF88'],
}

// --- Cadres d'avatar : classes/styles du ring ---
export type FrameStyle = { ring: string; glow: string; extra?: string }

export const AVATAR_FRAMES: Record<string, FrameStyle> = {
  frame_default: { ring: '#9B5CFF', glow: '0 0 10px -2px #9B5CFF' },
  frame_cyan: { ring: '#3CCBFF', glow: '0 0 12px -2px #3CCBFF' },
  frame_gold: { ring: '#FFD700', glow: '0 0 14px -2px #FFD700' },
  frame_flames: { ring: '#FF8C00', glow: '0 0 18px -1px #FF4757, 0 0 8px #FFB800', extra: 'frame-flames' },
  frame_cosmic: { ring: 'transparent', glow: '0 0 20px -2px #FF4FD8', extra: 'frame-cosmic' },
}

export const RARITY_HEX: Record<string, string> = {
  common: '#B9C2D8', rare: '#3CCBFF', epic: '#9B5CFF', legendary: '#FFD700', mythic: '#FF4FD8',
}

export const RARITY_LABEL: Record<string, string> = {
  common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire', mythic: 'Mythique',
}
