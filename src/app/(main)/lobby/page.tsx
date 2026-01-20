import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { checkAndResetDailyCredits } from '@/actions/credits'
import { LobbyClient } from './LobbyClient'
import { GameCardSkeleton } from '@/components/lobby'
import { SOON_THRESHOLD } from '@/lib/constants/rotation'
import type { GameWithItem } from '@/types/database'

export const dynamic = 'force-dynamic'

/**
 * Get the last 19h reset time in Paris timezone
 * Games won before this time should not be shown (they were "reset")
 */
function getLastResetTime(): Date {
  const now = new Date()

  // Get current time in Paris (UTC+1 in winter, UTC+2 in summer)
  const parisFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    hour12: false,
  })
  const parisHour = parseInt(parisFormatter.format(now), 10)

  // Calculate last 19h reset
  const resetTime = new Date(now)

  // Set to Paris 19:00
  if (parisHour >= 19) {
    // Today at 19h Paris
    resetTime.setHours(now.getHours() - parisHour + 19, 0, 0, 0)
  } else {
    // Yesterday at 19h Paris
    resetTime.setDate(resetTime.getDate() - 1)
    resetTime.setHours(now.getHours() - parisHour + 19, 0, 0, 0)
  }

  return resetTime
}

async function getLobbyData() {
  const supabase = await createClient()

  // Check and reset daily credits if needed
  const creditsResult = await checkAndResetDailyCredits()
  const credits = creditsResult.success ? (creditsResult.data?.credits ?? 0) : 0
  const wasReset = creditsResult.success
    ? (creditsResult.data?.wasReset ?? false)
    : false

  // Get the last reset time (19h Paris)
  const lastResetTime = getLastResetTime()

  // Get active games with their items
  const { data: activeGames } = await supabase
    .from('games')
    .select(
      `
      *,
      item:items(*)
    `
    )
    .in('status', ['active', 'final_phase'])
    .order('created_at', { ascending: false })
    .limit(100)

  // Get waiting games that are within the "soon" window (15 min before start_time)
  const soonThreshold = new Date(Date.now() + SOON_THRESHOLD).toISOString()
  const { data: soonGames } = await supabase
    .from('games')
    .select(
      `
      *,
      item:items(*)
    `
    )
    .eq('status', 'waiting')
    .lte('start_time', soonThreshold)
    .order('start_time', { ascending: true })
    .limit(20)

  // Get recently ended games (ended after last 19h reset, based on end_time)
  const { data: endedGames } = await supabase
    .from('games')
    .select(
      `
      *,
      item:items(*)
    `
    )
    .eq('status', 'ended')
    .gte('end_time', lastResetTime.getTime())
    .order('end_time', { ascending: false })
    .limit(20)

  // Combine all games
  const allActiveGames = (activeGames as GameWithItem[] | null) ?? []
  const allSoonGames = (soonGames as GameWithItem[] | null) ?? []
  const recentlyEndedGames = (endedGames as GameWithItem[] | null) ?? []

  // Merge: soon first, then active, then ended
  const games = [
    ...allSoonGames,
    ...allActiveGames,
    ...recentlyEndedGames,
  ]

  return { games, credits, wasReset }
}

function LobbyLoading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton */}
      <div className="py-6 md:py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 bg-white/10 rounded-lg w-48 mb-2 animate-pulse" />
              <div className="h-4 bg-white/5 rounded-lg w-64 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-white/10 rounded-xl w-24 animate-pulse" />
              <div className="h-10 bg-white/10 rounded-xl w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="px-4 md:px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-white/10 rounded-full w-24 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Games grid skeleton */}
      <div className="px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <GameCardSkeleton count={10} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function LobbyPage() {
  const { games, credits, wasReset } = await getLobbyData()

  return (
    <Suspense fallback={<LobbyLoading />}>
      <LobbyClient
        initialGames={games}
        credits={credits}
        wasReset={wasReset}
      />
    </Suspense>
  )
}
