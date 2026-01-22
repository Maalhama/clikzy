import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { checkAndResetDailyCredits } from '@/actions/credits'
import { getRecentWinners } from '@/actions/winners'
import { LobbyClient } from './LobbyClient'
import { GameCardSkeleton } from '@/components/lobby'
import { SOON_THRESHOLD, ROTATION_HOURS } from '@/lib/constants/rotation'
import type { GameWithItem } from '@/types/database'

export const dynamic = 'force-dynamic'

/**
 * Get the time when ended games should start being shown
 * (since the last rotation started)
 * Games expire 1 minute before the next rotation
 */
function getEndedGamesStartTime(): number {
  const now = new Date()

  // Get current time in Paris
  const parisFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parisTimeStr = parisFormatter.format(now)
  const [parisHourStr, parisMinuteStr] = parisTimeStr.split(':')
  const parisHour = parseInt(parisHourStr, 10)
  const parisMinute = parseInt(parisMinuteStr, 10)

  // Find the current rotation hour (the most recent rotation that started)
  let currentRotationHour: number = ROTATION_HOURS[0]
  for (const hour of ROTATION_HOURS) {
    if (parisHour >= hour) {
      currentRotationHour = hour
    }
  }

  // Check if we're in the last minute before next rotation (expiry window)
  const rotationHoursArray = [...ROTATION_HOURS] as number[]
  const nextRotationIndex = rotationHoursArray.indexOf(currentRotationHour) + 1
  const nextRotationHour = nextRotationIndex < rotationHoursArray.length
    ? rotationHoursArray[nextRotationIndex]
    : rotationHoursArray[0] // Wrap to midnight

  // If we're 1 minute before the next rotation, don't show any ended games
  const minutesUntilNextRotation = ((nextRotationHour - parisHour + 24) % 24) * 60 - parisMinute
  if (minutesUntilNextRotation <= 1 && minutesUntilNextRotation >= 0) {
    // Return a future timestamp so no ended games are shown
    return Date.now() + 1000 * 60 * 60 * 24 // 24h in the future
  }

  // Calculate the start time of the current rotation in UTC
  const rotationStart = new Date(now)

  // Get Paris offset
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const parisDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const parisOffset = parisDate.getTime() - utcDate.getTime()

  // Set to current rotation hour in Paris, then convert to UTC
  rotationStart.setHours(now.getHours() - parisHour + currentRotationHour, 0, 0, 0)

  // If the current rotation hour is greater than current Paris hour, it was yesterday
  if (currentRotationHour > parisHour) {
    rotationStart.setDate(rotationStart.getDate() - 1)
  }

  return rotationStart.getTime()
}

async function getLobbyData() {
  const supabase = await createClient()

  // Get the time from which to show ended games (since current rotation)
  const endedGamesStartTime = getEndedGamesStartTime()
  const soonThreshold = new Date(Date.now() + SOON_THRESHOLD).toISOString()

  // Run all queries in parallel for faster loading
  const [creditsResult, activeGamesResult, soonGamesResult, endedGamesResult, winnersResult] = await Promise.all([
    checkAndResetDailyCredits(),
    supabase
      .from('games')
      .select('*, item:items(*)')
      .in('status', ['active', 'final_phase'])
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('games')
      .select('*, item:items(*)')
      .eq('status', 'waiting')
      .lte('start_time', soonThreshold)
      .order('start_time', { ascending: true })
      .limit(20),
    supabase
      .from('games')
      .select('*, item:items(*)')
      .eq('status', 'ended')
      .gte('end_time', endedGamesStartTime)
      .order('end_time', { ascending: false })
      .limit(100),
    getRecentWinners(10)
  ])

  const credits = creditsResult.success ? (creditsResult.data?.credits ?? 0) : 0
  const wasReset = creditsResult.success ? (creditsResult.data?.wasReset ?? false) : false

  // Combine all games
  const allActiveGames = (activeGamesResult.data as GameWithItem[] | null) ?? []
  const allSoonGames = (soonGamesResult.data as GameWithItem[] | null) ?? []
  const recentlyEndedGames = (endedGamesResult.data as GameWithItem[] | null) ?? []

  // Merge: soon first, then active, then ended
  const games = [
    ...allSoonGames,
    ...allActiveGames,
    ...recentlyEndedGames,
  ]

  const winners = winnersResult

  return { games, credits, wasReset, winners }
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
  const { games, credits, wasReset, winners } = await getLobbyData()

  return (
    <Suspense fallback={<LobbyLoading />}>
      <LobbyClient
        initialGames={games}
        credits={credits}
        wasReset={wasReset}
        winners={winners}
      />
    </Suspense>
  )
}
