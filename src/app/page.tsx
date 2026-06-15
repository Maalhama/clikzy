import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

interface Prize {
  id: string
  name: string
  image_url: string
  value: number
  status: 'available' | 'ending_soon' | 'ended'
}

// Client anon SANS cookies -> requête mise en cache possible (le client à cookies
// rendrait la requête dynamique, donc non-cachable). Lectures PUBLIQUES uniquement.
function publicLandingClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Données publiques de la landing, mises en CACHE 30 s : les requêtes DB sortent du
// chemin critique de chaque visite -> le HTML (hero) part quasi-instantané même si la
// base est lente. Le client rafraîchit ensuite les gagnants en temps réel
// (useLandingRealtime), donc la fraîcheur reste bonne.
const getLandingData = unstable_cache(
  async () => {
  const supabase = publicLandingClient()
  const now = Date.now()

  // Run all independent queries in parallel for faster data fetching
  const [
    winnersResult,
    gameResult,
    fallbackItemResult,
    activeGamesResult,
    totalItemsValueResult,
  ] = await Promise.all([
    // Fetch recent winners from last 72h (including bots)
    supabase
      .from('winners')
      .select('id, item_name, item_value, won_at, user_id, username, is_bot')
      .gte('won_at', new Date(now - 72 * 60 * 60 * 1000).toISOString())
      .order('won_at', { ascending: false })
      .limit(10),

    // Fetch featured game
    supabase
      .from('games')
      .select('id, end_time, total_clicks, last_click_username, status, item_id')
      .in('status', ['active', 'final_phase'])
      .gt('end_time', now)
      .order('end_time', { ascending: true })
      .limit(1)
      .single(),

    // Fetch fallback item (in case no active game)
    supabase
      .from('items')
      .select('name, image_url, retail_value, description')
      .order('retail_value', { ascending: false })
      .limit(1)
      .single(),

    // Fetch active games with items for prizes carousel
    supabase
      .from('games')
      .select('id, end_time, status, total_clicks, last_click_username, item:items(id, name, image_url, retail_value)')
      .in('status', ['active', 'final_phase'])
      .gt('end_time', now)
      .order('end_time', { ascending: true })
      .limit(6),

    // Fetch total value of all items (potential prizes) with count
    supabase
      .from('items')
      .select('retail_value', { count: 'exact' }),
  ])

  const typedWinners = winnersResult.data as Pick<DbWinner, 'id' | 'item_name' | 'item_value' | 'won_at' | 'user_id' | 'username' | 'is_bot'>[] | null

  // Fetch profiles for real winners only (not bots) to get avatar
  const realUserIds = typedWinners
    ? typedWinners.filter(w => w.user_id && !w.is_bot).map(w => w.user_id).filter(Boolean) as string[]
    : []
  // RPC DEFINER (colonnes publiques only) : profiles est en RLS own-row pour
  // authenticated, donc plus de lecture cross-user directe sur la table.
  let profilesData: Pick<Profile, 'id' | 'username' | 'avatar_url'>[] | null = []
  if (realUserIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.rpc as any)('get_public_profiles', { p_ids: realUserIds })
    profilesData = data
  }

  const typedProfiles = profilesData as Pick<Profile, 'id' | 'username' | 'avatar_url'>[] | null
  const profilesMap = new Map(
    (typedProfiles || []).map((p) => [p.id, p])
  )

  const winners: Winner[] = (typedWinners || []).map((w) => {
    const profile = w.user_id ? profilesMap.get(w.user_id) : null
    return {
      id: w.id,
      // Use username from winners table first (works for bots), fallback to profile
      username: w.username || profile?.username || 'Anonyme',
      item_name: w.item_name,
      item_value: w.item_value || 0,
      won_at: w.won_at ?? new Date(0).toISOString(),
      avatar_url: profile?.avatar_url ?? undefined,
    }
  })

  const typedGame = gameResult.data as Pick<Game, 'id' | 'end_time' | 'total_clicks' | 'last_click_username' | 'status' | 'item_id'> | null

  let featuredGame: FeaturedGame | null = null
  let featuredItem: FeaturedItem | null = null

  if (typedGame && typedGame.item_id) {
    // Fetch the item for the featured game
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
        end_time: typedGame.end_time ?? 0,
        total_clicks: typedGame.total_clicks ?? 0,
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

  // Use fallback item if no active game
  if (!featuredItem) {
    const typedFallbackItem = fallbackItemResult.data as Pick<Item, 'name' | 'image_url' | 'retail_value' | 'description'> | null

    if (typedFallbackItem) {
      featuredItem = {
        name: typedFallbackItem.name,
        image_url: typedFallbackItem.image_url,
        retail_value: typedFallbackItem.retail_value || 0,
        description: typedFallbackItem.description || undefined,
      }
    }
  }

  // Calculate total value of all items (potential prizes) and count
  const typedItemsData = totalItemsValueResult.data as { retail_value: number }[] | null
  const totalItemsValue = (typedItemsData || []).reduce(
    (sum, item) => sum + (item.retail_value || 0),
    0
  )
  const totalItemsCount = totalItemsValueResult.count || 0

  // Process active games for prizes carousel
  const activeGames = activeGamesResult.data as Array<{
    id: string
    end_time: number
    status: string
    total_clicks: number | null
    last_click_username: string | null
    item: { id: string; name: string; image_url: string; retail_value: number } | null
  }> | null

  // File de parties pour la carte hero « en direct » (rotation quand une partie se termine)
  const liveGames: FeaturedGame[] = (activeGames || [])
    .filter(g => g.item)
    .map(g => ({
      id: g.id,
      item_name: g.item!.name,
      item_image_url: g.item!.image_url,
      item_value: g.item!.retail_value || 0,
      end_time: g.end_time,
      total_clicks: g.total_clicks ?? 0,
      last_click_username: g.last_click_username,
      status: g.status as FeaturedGame['status'],
    }))

  const prizes: Prize[] = (activeGames || [])
    .filter(g => g.item)
    .map(g => {
      const timeLeft = g.end_time - now
      const isEndingSoon = timeLeft <= 120000 // 2 minutes
      return {
        id: g.id,
        name: g.item!.name,
        image_url: g.item!.image_url,
        value: g.item!.retail_value || 0,
        status: isEndingSoon ? 'ending_soon' as const : 'available' as const,
      }
    })

  return {
    winners,
    liveGames,
    featuredGame,
    featuredItem,
    prizes,
    stats: {
      totalWinningsValue: totalItemsValue || 15000,
      totalGames: totalItemsCount || 50,
    },
  }
  },
  ['landing-data'],
  { revalidate: 30 }
)

export default async function LandingPage() {
  const supabase = await createClient()

  // Auth + données du lobby en PARALLÈLE (évite un aller-retour bloquant -> le
  // hero arrive plus vite au refresh).
  const [{ data: { user } }, landingData] = await Promise.all([
    supabase.auth.getUser(),
    getLandingData(),
  ])
  const { winners, liveGames, featuredGame, featuredItem, prizes, stats } = landingData

  return (
    <LandingClient
      isLoggedIn={!!user}
      initialWinners={winners}
      initialFeaturedGame={featuredGame}
      liveGames={liveGames}
      featuredItem={featuredItem}
      prizes={prizes}
      stats={stats}
    />
  )
}
