import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkAndResetDailyCredits } from '@/actions/credits'
import { GameClient } from './game-client'
import type { Game, Item } from '@/types/database'

type GameWithItem = Game & {
  item: Item
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user first (needed for other queries)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Run all queries in parallel for faster loading
  const [gameResult, creditsResult, profileResult, clicksResult] = await Promise.all([
    supabase
      .from('games')
      .select('*, item:items(*)')
      .eq('id', id)
      .single(),
    checkAndResetDailyCredits(),
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single(),
    supabase
      .from('clicks')
      .select('*, profile:profiles(username)')
      .eq('game_id', id)
      .order('clicked_at', { ascending: false })
      .limit(10)
  ])

  const gameData = gameResult.data
  if (!gameData) {
    notFound()
  }

  const game = gameData as GameWithItem
  const credits = creditsResult.success ? (creditsResult.data?.credits ?? 0) : 0
  const profile = profileResult.data as { username: string } | null
  const username = profile?.username ?? 'Joueur'

  type ClickWithProfile = {
    id: string
    clicked_at: string
    profile: { username: string } | null
  }

  const recentClicks = (clicksResult.data as ClickWithProfile[] | null)?.map(click => ({
    id: click.id,
    username: click.profile?.username || 'Anonyme',
    clickedAt: click.clicked_at,
  })) ?? []

  return (
    <GameClient
      initialGame={game}
      initialCredits={credits}
      username={username}
      userId={user.id}
      recentClicks={recentClicks}
    />
  )
}
