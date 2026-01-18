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

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Get game with item
  const { data: gameData } = await supabase
    .from('games')
    .select(`
      *,
      item:items(*)
    `)
    .eq('id', id)
    .single()

  if (!gameData) {
    notFound()
  }

  const game = gameData as GameWithItem

  // Check and reset daily credits if needed
  const creditsResult = await checkAndResetDailyCredits()
  const credits = creditsResult.success ? (creditsResult.data?.credits ?? 0) : 0

  // Get username from profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const profile = profileData as { username: string } | null
  const username = profile?.username ?? 'Joueur'

  // Get recent clicks
  const { data: clicksData } = await supabase
    .from('clicks')
    .select(`
      *,
      profile:profiles(username)
    `)
    .eq('game_id', id)
    .order('clicked_at', { ascending: false })
    .limit(10)

  type ClickWithProfile = {
    id: string
    clicked_at: string
    profile: { username: string } | null
  }

  const recentClicks = (clicksData as ClickWithProfile[] | null)?.map(click => ({
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
