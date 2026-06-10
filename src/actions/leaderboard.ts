'use server'

import { createClient } from '@/lib/supabase/server'
import { generateLeaderboardBots } from '@/lib/bots/leaderboardBots'

export type LeaderboardEntry = {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  level: number
  xp: number
  totalWins: number
}

export type LeaderboardPeriod = 'all' | 'day' | 'week' | 'month'

export async function getLeaderboard(period: LeaderboardPeriod = 'all', limit = 50): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_leaderboard', { p_period: period, p_limit: limit })
  if (error) return { success: false, error: 'Erreur classement' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data as any[]) || []).map((r) => ({
    rank: Number(r.rank),
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url,
    level: r.level ?? 1,
    xp: Number(r.xp ?? 0),
    totalWins: r.total_wins ?? 0,
  }))
  // Classement vivant : on complète avec des bots déterministes (stables sur
  // la journée Paris), puis on re-trie et on re-numérote — les vrais joueurs
  // gardent leur place au mérite parmi les bots.
  const BOT_COUNT = 12
  const bots = generateLeaderboardBots(period, BOT_COUNT)
  const merged = [...rows.map(({ rank: _rank, ...rest }) => rest), ...bots]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((r, i) => ({ rank: i + 1, ...r }))
  return { success: true, data: merged }
}

export async function getMyRank(period: LeaderboardPeriod = 'all'): Promise<{ success: boolean; data?: { rank: number; total: number }; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_my_rank', { p_period: period })
  if (error) return { success: false, error: 'Erreur rang' }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return { success: true, data: { rank: 0, total: 0 } }

  // Rang cohérent avec le classement affiché (bots inclus) : on compte les
  // bots dont l'XP dépasse le mien et on décale d'autant.
  const myRank = Number(row.my_rank ?? 0)
  const totalPlayers = Number(row.total_players ?? 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meXpRow } = await (supabase as any)
    .from('profiles').select('xp').eq('id', user.id).single()
  const myXp = Number(meXpRow?.xp ?? 0)
  const bots = generateLeaderboardBots(period, 12)
  const botsAbove = bots.filter((b) => b.xp > myXp).length
  return { success: true, data: { rank: myRank + botsAbove, total: totalPlayers + bots.length } }
}
