'use server'

import { createClient } from '@/lib/supabase/server'

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
  return { success: true, data: rows }
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
  return { success: true, data: { rank: Number(row.my_rank ?? 0), total: Number(row.total_players ?? 0) } }
}
