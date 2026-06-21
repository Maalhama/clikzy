// Rangs de FIDÉLITÉ (Lot H — monétisation/rétention, version GRATUITE). Axe de
// prestige distinct du niveau (XP) : basé sur l'engagement cumulé (total_clicks
// à vie). 100% cosmétique / statut — AUCUN avantage qui toucherait l'éco ou
// concurrencerait le VIP payant (cf. mémoire : « EN PLUS du VIP, ne pas casser
// l'éco »). Pure dérivation côté app, pas de stockage dédié.
//
// Seuils par défaut (ajustables) sur le total de clics à vie :
//   Bronze 0 · Argent 500 · Or 2 000 · Platine 8 000 · Diamant 25 000.

export type LoyaltyRankKey = 'bronze' | 'argent' | 'or' | 'platine' | 'diamant'

export type LoyaltyRank = {
  key: LoyaltyRankKey
  name: string
  min: number // seuil en clics cumulés
  /** classe couleur texte (palette Tailwind du projet) */
  color: string
  /** classes bordure + fond accentué pour les pastilles */
  ring: string
  emoji: string
}

// Ordre croissant — le dernier dont `min` est atteint est le rang courant.
export const LOYALTY_RANKS: readonly LoyaltyRank[] = [
  { key: 'bronze',  name: 'Bronze',  min: 0,     color: 'text-amber-600',  ring: 'border-amber-600/40 bg-amber-600/10',  emoji: '🥉' },
  { key: 'argent',  name: 'Argent',  min: 500,   color: 'text-slate-300',  ring: 'border-slate-300/40 bg-slate-300/10',  emoji: '🥈' },
  { key: 'or',      name: 'Or',      min: 2000,  color: 'text-yellow-400', ring: 'border-yellow-400/40 bg-yellow-400/10', emoji: '🥇' },
  { key: 'platine', name: 'Platine', min: 8000,  color: 'text-cyan-300',   ring: 'border-cyan-300/40 bg-cyan-300/10',   emoji: '💠' },
  { key: 'diamant', name: 'Diamant', min: 25000, color: 'text-neon-blue',  ring: 'border-neon-blue/40 bg-neon-blue/10',  emoji: '💎' },
] as const

export type LoyaltyProgress = {
  current: LoyaltyRank
  next: LoyaltyRank | null
  /** clics restants pour le prochain rang (0 si déjà au max) */
  clicksToNext: number
  /** progression 0–100 vers le prochain rang (100 si max) */
  progress: number
}

/** Rang de fidélité courant + progression vers le suivant, à partir des clics cumulés. */
export function getLoyaltyRank(totalClicks: number): LoyaltyProgress {
  const clicks = Math.max(0, Math.floor(totalClicks || 0))

  let currentIdx = 0
  for (let i = 0; i < LOYALTY_RANKS.length; i++) {
    if (clicks >= LOYALTY_RANKS[i].min) currentIdx = i
  }

  const current = LOYALTY_RANKS[currentIdx]
  const next = LOYALTY_RANKS[currentIdx + 1] ?? null

  if (!next) {
    return { current, next: null, clicksToNext: 0, progress: 100 }
  }

  const span = next.min - current.min
  const into = clicks - current.min
  const progress = span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0
  return { current, next, clicksToNext: Math.max(0, next.min - clicks), progress }
}
