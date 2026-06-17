import type { Metadata } from 'next'
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

// SEO/partage par partie : sans ça, toutes les pages /game/[id] partagent le titre générique.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select('item:items(name, retail_value, image_url)')
    .eq('id', id)
    .single()
  const item = (data as { item: { name: string; retail_value: number | null; image_url: string | null } | null } | null)?.item
  if (!item?.name) return { title: 'Partie en cours — CLEEKZY' }
  const valeur = item.retail_value ? ` (${Math.round(Number(item.retail_value))}€)` : ''
  const title = `${item.name}${valeur} — au dernier clic | CLEEKZY`
  const description = `Clique pour remporter ${item.name}${valeur} sur CLEEKZY. Le dernier à cliquer avant la fin du timer gagne le lot, livré chez lui.`
  return {
    title,
    description,
    openGraph: { title, description, images: item.image_url ? [item.image_url] : undefined },
  }
}

export default async function GamePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Auth OPTIONNELLE : la page de jeu est consultable sans compte (rétention).
  // Le clic « Jouer » redirige vers l'inscription côté client si non connecté.
  const { data: { user } } = await supabase.auth.getUser()

  // Jeu + clics récents (publics) — pas besoin d'être connecté pour voir
  const [gameResult, clicksResult] = await Promise.all([
    supabase.from('games').select('*, item:items(*)').eq('id', id).single(),
    supabase
      .from('clicks')
      .select('*, profile:profiles(username)')
      .eq('game_id', id)
      .order('clicked_at', { ascending: false })
      .limit(10),
  ])

  const gameData = gameResult.data
  if (!gameData) {
    notFound()
  }

  const game = gameData as GameWithItem

  // Données personnelles uniquement si connecté
  let credits = 0
  let username = 'Joueur'
  if (user) {
    const [creditsResult, profileResult] = await Promise.all([
      checkAndResetDailyCredits(),
      supabase.from('profiles').select('username').eq('id', user.id).single(),
    ])
    credits = creditsResult.success ? (creditsResult.data?.totalCredits ?? 0) : 0
    const profile = profileResult.data as { username: string } | null
    username = profile?.username ?? 'Joueur'
  }

  type ClickWithProfile = {
    id: string
    clicked_at: string
    username: string | null
    is_bot: boolean
    profile: { username: string } | null
  }

  const recentClicks = (clicksResult.data as ClickWithProfile[] | null)?.map(click => ({
    id: click.id,
    username: click.username || click.profile?.username || 'Anonyme',
    clickedAt: click.clicked_at,
    isBot: click.is_bot,
  })) ?? []

  return (
    <GameClient
      initialGame={game}
      initialCredits={credits}
      username={username}
      userId={user?.id ?? null}
      recentClicks={recentClicks}
    />
  )
}
