import { createClient } from '@/lib/supabase/server'
import { LandingClient } from '@/components/landing'
import type { Winner as DbWinner, Profile, Game, Item } from '@/types/database'

interface Winner {
  id: string
  username: string
  item_name: string
  item_value: number
  won_at: string
  avatar_url?: string
}

interface FeaturedGame {
  id: string
  item_name: string
  item_image_url: string
  item_value: number
  end_time: number
  total_clicks: number
  last_click_username: string | null
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

interface FeaturedItem {
  name: string
  image_url: string
  retail_value: number
  description?: string
}

async function getLandingData() {
  const supabase = await createClient()

  // Fetch recent winners
  const { data: winnersData } = await supabase
    .from('winners')
    .select('id, item_name, item_value, won_at, user_id')
    .order('won_at', { ascending: false })
    .limit(10)

  const typedWinners = winnersData as Pick<DbWinner, 'id' | 'item_name' | 'item_value' | 'won_at' | 'user_id'>[] | null

  // Fetch profiles for winners
  const userIds = typedWinners ? typedWinners.map((w) => w.user_id).filter(Boolean) : []
  const { data: profilesData } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)
    : { data: [] }

  const typedProfiles = profilesData as Pick<Profile, 'id' | 'username' | 'avatar_url'>[] | null
  const profilesMap = new Map(
    (typedProfiles || []).map((p) => [p.id, p])
  )

  const winners: Winner[] = (typedWinners || []).map((w) => {
    const profile = profilesMap.get(w.user_id)
    return {
      id: w.id,
      username: profile?.username || 'Anonyme',
      item_name: w.item_name,
      item_value: w.item_value || 0,
      won_at: w.won_at,
      avatar_url: profile?.avatar_url || undefined,
    }
  })

  // Fetch featured game (active or final_phase)
  const { data: gameData } = await supabase
    .from('games')
    .select('id, end_time, total_clicks, last_click_username, status, item_id')
    .in('status', ['active', 'final_phase'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const typedGame = gameData as Pick<Game, 'id' | 'end_time' | 'total_clicks' | 'last_click_username' | 'status' | 'item_id'> | null

  let featuredGame: FeaturedGame | null = null
  let featuredItem: FeaturedItem | null = null

  if (typedGame && typedGame.item_id) {
    // Fetch the item separately
    const { data: itemData } = await supabase
      .from('items')
      .select('name, image_url, retail_value')
      .eq('id', typedGame.item_id)
      .single()

    const typedItem = itemData as Pick<Item, 'name' | 'image_url' | 'retail_value'> | null

    if (typedItem) {
      featuredGame = {
        id: typedGame.id,
        item_name: typedItem.name,
        item_image_url: typedItem.image_url,
        item_value: typedItem.retail_value || 0,
        end_time: typedGame.end_time,
        total_clicks: typedGame.total_clicks,
        last_click_username: typedGame.last_click_username,
        status: typedGame.status as FeaturedGame['status'],
      }
      featuredItem = {
        name: typedItem.name,
        image_url: typedItem.image_url,
        retail_value: typedItem.retail_value || 0,
      }
    }
  }

  // If no active game, try to get any item for showcase
  if (!featuredItem) {
    const { data: itemData } = await supabase
      .from('items')
      .select('name, image_url, retail_value, description')
      .order('retail_value', { ascending: false })
      .limit(1)
      .single()

    const typedFallbackItem = itemData as Pick<Item, 'name' | 'image_url' | 'retail_value' | 'description'> | null

    if (typedFallbackItem) {
      featuredItem = {
        name: typedFallbackItem.name,
        image_url: typedFallbackItem.image_url,
        retail_value: typedFallbackItem.retail_value || 0,
        description: typedFallbackItem.description || undefined,
      }
    }
  }

  // Fetch stats
  const { count: totalGames } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ended')

  const { data: totalWinningsData } = await supabase
    .from('winners')
    .select('item_value')

  const typedWinningsData = totalWinningsData as Pick<DbWinner, 'item_value'>[] | null
  const totalWinningsValue = (typedWinningsData || []).reduce(
    (sum, w) => sum + (w.item_value || 0),
    0
  )

  return {
    winners,
    featuredGame,
    featuredItem,
    stats: {
      totalWinningsValue: totalWinningsValue || 15000, // Fallback demo value
      totalGames: totalGames || 50, // Fallback demo value
    },
  }
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { winners, featuredGame, featuredItem, stats } = await getLandingData()

  return (
    <LandingClient
      isLoggedIn={!!user}
      initialWinners={winners}
      initialFeaturedGame={featuredGame}
      featuredItem={featuredItem}
      stats={stats}
    />
  )
}
