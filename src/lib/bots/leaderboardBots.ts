import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

// Bots de classement : pseudos et scores DÉTERMINISTES par (période, jour Paris)
// pour que le classement soit vivant mais stable au fil de la journée.
// Aucun impact économie : ce sont des lignes d'affichage, pas des comptes.

export type BotLeaderboardRow = {
  userId: string
  username: string
  avatarUrl: null
  level: number
  xp: number
  totalWins: number
}

// hash déterministe simple (même esprit que le générateur de pseudos)
function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

// niveau depuis l'XP (même courbe que xp_to_level : palier L à 50·L·(L-1))
function levelFromXp(xp: number): number {
  let level = 1
  while (50 * (level + 1) * level <= xp) level++
  return level
}

// Plages d'XP crédibles par période (haut de classement)
const XP_RANGE: Record<string, [number, number]> = {
  day: [120, 1600],
  week: [800, 9000],
  month: [3000, 32000],
  all: [6000, 90000],
}

export function generateLeaderboardBots(period: string, count: number): BotLeaderboardRow[] {
  const parisDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
  const [min, max] = XP_RANGE[period] ?? XP_RANGE.all

  return Array.from({ length: count }, (_, i) => {
    const seed = `lb-${period}-${parisDay}-${i}`
    const h = hash(seed)
    // XP décroissant par rang avec un peu de bruit déterministe
    const t = 1 - i / Math.max(1, count) // 1 → 0
    const noise = (h % 1000) / 1000 // 0..1
    const xp = Math.round((min + (max - min) * (t * 0.8 + noise * 0.2)) / 10) * 10
    const level = levelFromXp(period === 'all' ? xp : xp * 2) // all-time : xp = cumul réel
    return {
      userId: `bot-${seed}`,
      username: generateDeterministicUsername(seed),
      avatarUrl: null,
      level,
      // victoires plausibles, corrélées au niveau
      totalWins: Math.max(0, Math.floor(level / 2) + (h % 3)),
      xp,
    }
  })
}
