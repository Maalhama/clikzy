'use server'

import { createClient } from '@/lib/supabase/server'

export interface WinnerData {
  id: string
  username: string
  itemName: string
  itemValue: number | null
  itemImage: string
  wonAt: string
  totalClicksInGame: number | null
}

export interface LeaderboardData {
  rank: number
  username: string
  wins: number
  totalValue: number
}

/**
 * Recupere les derniers gagnants pour la landing page
 * Garde les gagnants des dernières 24h minimum, indépendamment des rotations de jeux
 */
export async function getRecentWinners(limit: number = 50): Promise<WinnerData[]> {
  const supabase = await createClient()

  // Toujours montrer les gagnants des dernières 24h minimum
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: winners, error } = await supabase
    .from('winners')
    .select(`
      id,
      username,
      item_name,
      item_value,
      total_clicks_in_game,
      won_at,
      is_bot,
      profiles!winners_user_id_fkey (
        username
      ),
      items!winners_item_id_fkey (
        image_url
      )
    `)
    .gte('won_at', twentyFourHoursAgo)
    .order('won_at', { ascending: false })
    .limit(limit)

  if (error || !winners) {
    console.error('Error fetching winners:', error)
    return []
  }

  // Cast to expected type
  type WinnerRow = {
    id: string
    username: string | null
    item_name: string
    item_value: number | null
    total_clicks_in_game: number | null
    won_at: string
    is_bot: boolean
    profiles: { username: string } | null
    items: { image_url: string } | null
  }

  return (winners as WinnerRow[]).map((w) => ({
    id: w.id,
    // Use winners.username for bots, profiles.username for real players
    username: w.username || w.profiles?.username || 'Joueur anonyme',
    itemName: w.item_name,
    itemValue: w.item_value ? Number(w.item_value) : null,
    itemImage: w.items?.image_url || '/products/airpods-4-neon.png',
    wonAt: w.won_at,
    totalClicksInGame: w.total_clicks_in_game,
  }))
}

/**
 * Recupere le leaderboard des meilleurs joueurs
 */
export async function getLeaderboard(
  period: 'today' | 'week' | 'month' | 'all' = 'week',
  limit: number = 5
): Promise<LeaderboardData[]> {
  const supabase = await createClient()

  // Calculer la date de debut selon la periode
  const now = new Date()
  let startDate: Date | null = null

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'all':
      startDate = null
      break
  }

  let query = supabase
    .from('winners')
    .select(`
      user_id,
      item_value,
      profiles!winners_user_id_fkey (
        username
      )
    `)

  if (startDate) {
    query = query.gte('won_at', startDate.toISOString())
  }

  const { data: winners, error } = await query

  if (error || !winners) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  // Cast to expected type
  type LeaderboardRow = {
    user_id: string
    item_value: number | null
    profiles: { username: string } | null
  }

  // Agreger par utilisateur
  const userStats = new Map<string, { username: string; wins: number; totalValue: number }>()

  for (const winner of winners as LeaderboardRow[]) {
    const userId = winner.user_id
    const username = winner.profiles?.username || 'Joueur anonyme'
    const value = winner.item_value ? Number(winner.item_value) : 0

    const existing = userStats.get(userId)
    if (existing) {
      existing.wins += 1
      existing.totalValue += value
    } else {
      userStats.set(userId, { username, wins: 1, totalValue: value })
    }
  }

  // Trier par totalValue et prendre les top N
  const sorted = Array.from(userStats.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit)
    .map((stats, index) => ({
      rank: index + 1,
      username: stats.username,
      wins: stats.wins,
      totalValue: stats.totalValue,
    }))

  return sorted
}

/**
 * Recupere les statistiques globales pour la landing page
 */
export async function getGlobalStats(): Promise<{
  totalWinnings: number
  totalGames: number
  playersOnline: number
}> {
  const supabase = await createClient()

  // Total des gains
  const { data: winnersSum } = await supabase
    .from('winners')
    .select('item_value')

  type ValueRow = { item_value: number | null }
  const totalWinnings = (winnersSum as ValueRow[] | null)?.reduce(
    (sum, w) => sum + (Number(w.item_value) || 0),
    0
  ) || 0

  // Nombre de parties terminees
  const { count: totalGames } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ended')

  // Joueurs actifs (approximation: joueurs ayant clique dans les 5 dernieres minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count: recentClickers } = await supabase
    .from('clicks')
    .select('user_id', { count: 'exact', head: true })
    .gte('clicked_at', fiveMinutesAgo)

  return {
    totalWinnings: Math.round(totalWinnings),
    totalGames: totalGames || 0,
    playersOnline: Math.max(recentClickers || 0, 15), // Minimum 15 pour l'affichage
  }
}
