export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export const RARITY: Record<Rarity, { label: string; text: string; border: string; bg: string; glow: string; ring: string }> = {
  common:    { label: 'Commun',    text: 'text-gray-200',   border: 'border-gray-400/40',   bg: 'from-gray-500/15 to-gray-600/5',     glow: 'shadow-[0_0_18px_rgba(156,163,175,0.25)]', ring: 'ring-gray-400/40' },
  rare:      { label: 'Rare',      text: 'text-cyan-300',   border: 'border-cyan-400/50',   bg: 'from-cyan-500/20 to-blue-600/5',     glow: 'shadow-[0_0_22px_rgba(34,211,238,0.4)]',   ring: 'ring-cyan-400/50' },
  epic:      { label: 'Épique',    text: 'text-purple-300', border: 'border-purple-400/50', bg: 'from-purple-500/25 to-fuchsia-600/5', glow: 'shadow-[0_0_26px_rgba(192,132,252,0.45)]', ring: 'ring-purple-400/50' },
  legendary: { label: 'Légendaire',text: 'text-yellow-300', border: 'border-yellow-400/60', bg: 'from-yellow-500/25 to-orange-600/10', glow: 'shadow-[0_0_30px_rgba(250,204,21,0.5)]',   ring: 'ring-yellow-400/60' },
  mythic:    { label: 'Mythique',  text: 'text-pink-300',   border: 'border-pink-400/60',   bg: 'from-pink-500/30 to-purple-600/15',  glow: 'shadow-[0_0_36px_rgba(244,114,182,0.6)]',  ring: 'ring-pink-400/60' },
}

export const SLOT_LABEL: Record<string, string> = {
  casque: 'Casque', armure: 'Armure', anneau: 'Anneau', artefact: 'Artefact',
}

export const SLOT_EMOJI: Record<string, string> = {
  casque: '🪖', armure: '🛡️', anneau: '💍', artefact: '🔮',
}

export function bonusLabel(kind: string, value: number): string {
  switch (kind) {
    case 'xp_pct': return `+${value}% XP`
    case 'credit_pct': return `+${value}% crédits`
    case 'daily_clicks': return `+${value} clic${value > 1 ? 's' : ''} gratuit${value > 1 ? 's' : ''}/jour`
    case 'chest_luck': return `+${value}% chance de loot`
    case 'cosmetic': return 'Cosmétique'
    default: return ''
  }
}

// Pool d'emojis pour le défilement du reel (variété visuelle)
export const REEL_EMOJIS = [
  '🪖', '🧢', '⛑️', '🥷', '👑', '👹', '🐲', '🌌', '💍', '⭕', '🔵', '🟡', '💚', '💎', '🪐',
  '🦺', '👕', '🛡️', '🧶', '🥋', '🔥', '🌠', '🪨', '🍀', '🔮', '☀️', '⚡', '🏮', '🗝️', '🌟', '💰',
]
