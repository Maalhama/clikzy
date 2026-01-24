'use server'

import { createClient } from '@/lib/supabase/server'

export interface GameHistoryItem {
  id: string
  gameId: string
  itemName: string
  itemValue: number | null
  itemImage: string
  clickCount: number
  playedAt: string
  won: boolean
  winnerUsername: string | null
}

/**
 * Get user's game participation history
 */
export async function getGameHistory(limit: number = 20): Promise<GameHistoryItem[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get all games where user has clicked, with their click count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userClicks, error: clicksError } = await (supabase as any)
    .from('clicks')
    .select('game_id, clicked_at')
    .eq('user_id', user.id)
    .order('clicked_at', { ascending: false })

  if (clicksError || !userClicks) {
    console.error('Error fetching user clicks:', clicksError)
    return []
  }

  // Group clicks by game_id and count them
  const gameClickCounts = new Map<string, { count: number; lastClickAt: string }>()
  for (const click of userClicks) {
    const existing = gameClickCounts.get(click.game_id)
    if (existing) {
      existing.count++
    } else {
      gameClickCounts.set(click.game_id, { count: 1, lastClickAt: click.clicked_at })
    }
  }

  // Get unique game IDs (most recent first)
  const gameIds = Array.from(gameClickCounts.keys()).slice(0, limit)

  if (gameIds.length === 0) {
    return []
  }

  // Fetch game details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: games, error: gamesError } = await (supabase as any)
    .from('games')
    .select(`
      id,
      status,
      winner_id,
      last_click_username,
      ended_at,
      items (
        name,
        retail_value,
        image_url
      )
    `)
    .in('id', gameIds)
    .eq('status', 'ended')

  if (gamesError || !games) {
    console.error('Error fetching games:', gamesError)
    return []
  }

  // Build history items
  const history: GameHistoryItem[] = games.map((game: {
    id: string
    status: string
    winner_id: string | null
    last_click_username: string | null
    ended_at: string | null
    items: { name: string; retail_value: number | null; image_url: string } | null
  }) => {
    const clickData = gameClickCounts.get(game.id)
    return {
      id: `${game.id}-${user.id}`,
      gameId: game.id,
      itemName: game.items?.name || 'Lot inconnu',
      itemValue: game.items?.retail_value || null,
      itemImage: game.items?.image_url || '/products/airpods-4-neon.png',
      clickCount: clickData?.count || 0,
      playedAt: clickData?.lastClickAt || game.ended_at || new Date().toISOString(),
      won: game.winner_id === user.id,
      winnerUsername: game.last_click_username || null,
    }
  })

  // Sort by playedAt descending
  history.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())

  return history
}

/**
 * Get game history stats for user
 */
export async function getGameHistoryStats(): Promise<{
  totalGames: number
  totalClicks: number
  wins: number
  winRate: number
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { totalGames: 0, totalClicks: 0, wins: 0, winRate: 0 }
  }

  // Get profile stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('total_clicks, total_wins')
    .eq('id', user.id)
    .single()

  // Count distinct games played
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clicks } = await (supabase as any)
    .from('clicks')
    .select('game_id')
    .eq('user_id', user.id)

  const uniqueGames = new Set(clicks?.map((c: { game_id: string }) => c.game_id) || [])
  const totalGames = uniqueGames.size
  const totalClicks = profile?.total_clicks || 0
  const wins = profile?.total_wins || 0
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0

  return {
    totalGames,
    totalClicks,
    wins,
    winRate: Math.round(winRate * 10) / 10,
  }
}
