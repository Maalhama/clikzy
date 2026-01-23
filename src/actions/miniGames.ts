'use server'

import { createClient } from '@/lib/supabase/server'
import {
  MiniGameType,
  MiniGameEligibility,
  MiniGameResult,
  MiniGamePlay,
  WHEEL_SEGMENTS,
  SCRATCH_VALUES,
  PACHINKO_SLOTS,
} from '@/types/miniGames'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get midnight of today in UTC
 */
function getTodayMidnight(): Date {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(0, 0, 0, 0)
  return midnight
}

/**
 * Get midnight of tomorrow in UTC
 */
function getTomorrowMidnight(): Date {
  const midnight = getTodayMidnight()
  midnight.setUTCDate(midnight.getUTCDate() + 1)
  return midnight
}

/**
 * Check if user can play each mini-game today
 */
export async function getMiniGameEligibility(): Promise<ActionResult<MiniGameEligibility>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  const todayMidnight = getTodayMidnight()
  const tomorrowMidnight = getTomorrowMidnight()

  // Get today's plays for all game types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plays, error } = await (supabase as any)
    .from('mini_game_plays')
    .select('game_type, played_at')
    .eq('user_id', user.id)
    .gte('played_at', todayMidnight.toISOString())
    .order('played_at', { ascending: false })

  if (error) {
    return { success: false, error: 'Erreur lors de la récupération des parties' }
  }

  const typedPlays = (plays || []) as { game_type: MiniGameType; played_at: string }[]

  // Build eligibility map
  const gameTypes: MiniGameType[] = ['wheel', 'scratch', 'pachinko']
  const eligibility: MiniGameEligibility = {
    wheel: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    scratch: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    pachinko: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
  }

  for (const gameType of gameTypes) {
    const play = typedPlays.find(p => p.game_type === gameType)
    if (play) {
      eligibility[gameType] = {
        canPlay: false,
        lastPlayedAt: play.played_at,
        nextPlayAt: tomorrowMidnight.toISOString(),
      }
    }
  }

  return { success: true, data: eligibility }
}

/**
 * Calculate result based on game type
 */
function calculateGameResult(gameType: MiniGameType): number {
  switch (gameType) {
    case 'wheel': {
      // Random segment from wheel
      const segmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length)
      return WHEEL_SEGMENTS[segmentIndex]
    }
    case 'scratch': {
      // Random value from scratch card (weighted)
      const valueIndex = Math.floor(Math.random() * SCRATCH_VALUES.length)
      return SCRATCH_VALUES[valueIndex]
    }
    case 'pachinko': {
      // Random slot from pachinko
      const slotIndex = Math.floor(Math.random() * PACHINKO_SLOTS.length)
      return PACHINKO_SLOTS[slotIndex]
    }
    default:
      return 0
  }
}

/**
 * Play a mini-game and receive credits
 */
export async function playMiniGame(gameType: MiniGameType): Promise<ActionResult<MiniGameResult & { segmentIndex?: number; slotIndex?: number }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Check eligibility
  const eligibilityResult = await getMiniGameEligibility()
  if (!eligibilityResult.success || !eligibilityResult.data) {
    return { success: false, error: eligibilityResult.error || 'Erreur de vérification' }
  }

  if (!eligibilityResult.data[gameType].canPlay) {
    return { success: false, error: 'Vous avez déjà joué à ce jeu aujourd\'hui. Revenez demain !' }
  }

  // Calculate result based on game type
  let creditsWon: number
  let segmentIndex: number | undefined
  let slotIndex: number | undefined

  switch (gameType) {
    case 'wheel': {
      segmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length)
      creditsWon = WHEEL_SEGMENTS[segmentIndex]
      break
    }
    case 'scratch': {
      const valueIndex = Math.floor(Math.random() * SCRATCH_VALUES.length)
      creditsWon = SCRATCH_VALUES[valueIndex]
      break
    }
    case 'pachinko': {
      slotIndex = Math.floor(Math.random() * PACHINKO_SLOTS.length)
      creditsWon = PACHINKO_SLOTS[slotIndex]
      break
    }
    default:
      creditsWon = 0
  }

  // Insert play record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('mini_game_plays')
    .insert({
      user_id: user.id,
      game_type: gameType,
      credits_won: creditsWon,
    })

  if (insertError) {
    return { success: false, error: 'Erreur lors de l\'enregistrement de la partie' }
  }

  // Add credits to user profile if won
  let newTotalCredits = 0
  if (creditsWon > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any)
      .rpc('add_mini_game_credits', {
        p_user_id: user.id,
        p_amount: creditsWon,
      })

    if (rpcError) {
      console.error('Error adding credits:', rpcError)
      // Still return success since play was recorded
    }

    newTotalCredits = rpcData || 0
  } else {
    // Get current credits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    newTotalCredits = profile?.credits || 0
  }

  return {
    success: true,
    data: {
      creditsWon,
      newTotalCredits,
      segmentIndex,
      slotIndex,
    },
  }
}

/**
 * Get user's mini-game history
 */
export async function getMiniGameHistory(limit = 20): Promise<ActionResult<MiniGamePlay[]>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mini_game_plays')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, error: 'Erreur lors de la récupération de l\'historique' }
  }

  return { success: true, data: data as MiniGamePlay[] }
}
