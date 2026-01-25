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
  SLOTS_PAYOUTS,
  SLOTS_SYMBOLS,
} from '@/types/miniGames'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get midnight of today in French timezone (Europe/Paris)
 */
function getTodayMidnightFrench(): Date {
  // Get current time in French timezone
  const now = new Date()
  const frenchTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))

  // Set to midnight
  frenchTime.setHours(0, 0, 0, 0)

  // Calculate the offset and return UTC equivalent
  const offsetMs = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTime()

  return new Date(frenchTime.getTime() + offsetMs)
}

/**
 * Get midnight of tomorrow in French timezone (Europe/Paris)
 */
function getTomorrowMidnightFrench(): Date {
  const midnight = getTodayMidnightFrench()
  midnight.setDate(midnight.getDate() + 1)
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

  const todayMidnight = getTodayMidnightFrench()
  const tomorrowMidnight = getTomorrowMidnightFrench()

  // Get today's FREE plays for all game types (ignore paid plays)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plays, error } = await (supabase as any)
    .from('mini_game_plays')
    .select('game_type, played_at')
    .eq('user_id', user.id)
    .eq('is_free_play', true)
    .gte('played_at', todayMidnight.toISOString())
    .order('played_at', { ascending: false })

  if (error) {
    return { success: false, error: 'Erreur lors de la récupération des parties' }
  }

  const typedPlays = (plays || []) as { game_type: MiniGameType; played_at: string }[]

  // Build eligibility map
  const gameTypes: MiniGameType[] = ['wheel', 'scratch', 'pachinko', 'slots', 'coinflip', 'dice']
  const eligibility: MiniGameEligibility = {
    wheel: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    scratch: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    pachinko: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    slots: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    coinflip: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    dice: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
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
 * Play a mini-game and receive credits
 */
export async function playMiniGame(gameType: MiniGameType): Promise<ActionResult<MiniGameResult & { segmentIndex?: number; slotIndex?: number; slotsSymbols?: number[]; coinResult?: 'heads' | 'tails'; diceResults?: [number, number] }>> {
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
  let slotsSymbols: number[] | undefined
  let coinResult: 'heads' | 'tails' | undefined
  let diceResults: [number, number] | undefined

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
    case 'slots': {
      // Generate 3 random symbol indices
      slotsSymbols = [
        Math.floor(Math.random() * SLOTS_SYMBOLS.length),
        Math.floor(Math.random() * SLOTS_SYMBOLS.length),
        Math.floor(Math.random() * SLOTS_SYMBOLS.length),
      ]
      // Random payout from distribution
      const slotsPayoutIndex = Math.floor(Math.random() * SLOTS_PAYOUTS.length)
      creditsWon = SLOTS_PAYOUTS[slotsPayoutIndex]
      break
    }
    case 'coinflip': {
      // 10% chance to win (heads), 90% chance to lose (tails)
      const isWin = Math.random() < 0.1
      coinResult = isWin ? 'heads' : 'tails'
      creditsWon = isWin ? 10 : 0
      break
    }
    case 'dice': {
      // Generate 2 dice values (1-6)
      diceResults = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]
      // Calculate credits based on dice sum (min 2, max 10)
      const diceSum = diceResults[0] + diceResults[1]
      // Map sum (2-12) to credits (2-10)
      // 2-3: 2, 4-5: 3, 6-7: 4, 8-9: 6, 10-11: 8, 12: 10
      if (diceSum <= 3) creditsWon = 2
      else if (diceSum <= 5) creditsWon = 3
      else if (diceSum <= 7) creditsWon = 4
      else if (diceSum <= 9) creditsWon = 6
      else if (diceSum <= 11) creditsWon = 8
      else creditsWon = 10 // Double 6!
      break
    }
    default:
      creditsWon = 0
  }

  // Insert play record (free play)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('mini_game_plays')
    .insert({
      user_id: user.id,
      game_type: gameType,
      credits_won: creditsWon,
      is_free_play: true,
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
      slotsSymbols,
      coinResult,
      diceResults,
    },
  }
}

// Coût en crédits par type de jeu
const PLAY_COSTS: Record<MiniGameType, number> = {
  wheel: 3,
  scratch: 3,
  pachinko: 3,
  slots: 5,
  coinflip: 3,
  dice: 5,
}

/**
 * Play a mini-game with credits (paid play, no daily limit)
 */
export async function playMiniGamePaid(gameType: MiniGameType): Promise<ActionResult<MiniGameResult & { segmentIndex?: number; slotIndex?: number; slotsSymbols?: number[]; coinResult?: 'heads' | 'tails'; diceResults?: [number, number] }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Check if user has enough total credits (daily + earned)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('credits, earned_credits')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'Erreur lors de la récupération du profil' }
  }

  const playCost = PLAY_COSTS[gameType]
  const totalCredits = profile.credits + profile.earned_credits
  if (totalCredits < playCost) {
    return { success: false, error: `Crédits insuffisants. Il vous faut ${playCost} crédits pour jouer.` }
  }

  // Deduct credits (use daily credits first, then earned credits)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newTotal, error: deductError } = await (supabase as any)
    .rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: playCost,
    })

  if (deductError || newTotal === -1) {
    return { success: false, error: 'Erreur lors du débit des crédits' }
  }

  // Calculate result based on game type
  let creditsWon: number
  let segmentIndex: number | undefined
  let slotIndex: number | undefined
  let slotsSymbols: number[] | undefined
  let coinResult: 'heads' | 'tails' | undefined
  let diceResults: [number, number] | undefined

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
    case 'slots': {
      slotsSymbols = [
        Math.floor(Math.random() * SLOTS_SYMBOLS.length),
        Math.floor(Math.random() * SLOTS_SYMBOLS.length),
        Math.floor(Math.random() * SLOTS_SYMBOLS.length),
      ]
      const slotsPayoutIndex = Math.floor(Math.random() * SLOTS_PAYOUTS.length)
      creditsWon = SLOTS_PAYOUTS[slotsPayoutIndex]
      break
    }
    case 'coinflip': {
      // 10% chance to win (heads), 90% chance to lose (tails)
      const isWin = Math.random() < 0.1
      coinResult = isWin ? 'heads' : 'tails'
      creditsWon = isWin ? 10 : 0
      break
    }
    case 'dice': {
      // Generate 2 dice values (1-6)
      diceResults = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]
      // Calculate credits based on dice sum (min 2, max 10)
      const diceSumPaid = diceResults[0] + diceResults[1]
      // Map sum (2-12) to credits (2-10)
      // 2-3: 2, 4-5: 3, 6-7: 4, 8-9: 6, 10-11: 8, 12: 10
      if (diceSumPaid <= 3) creditsWon = 2
      else if (diceSumPaid <= 5) creditsWon = 3
      else if (diceSumPaid <= 7) creditsWon = 4
      else if (diceSumPaid <= 9) creditsWon = 6
      else if (diceSumPaid <= 11) creditsWon = 8
      else creditsWon = 10 // Double 6!
      break
    }
    default:
      creditsWon = 0
  }

  // Insert play record (paid play - for history tracking)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('mini_game_plays')
    .insert({
      user_id: user.id,
      game_type: gameType,
      credits_won: creditsWon,
      is_free_play: false,
    })

  // Add winnings to earned_credits (permanent)
  let newTotalCredits = newTotal as number
  if (creditsWon > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData } = await (supabase as any)
      .rpc('add_mini_game_credits', {
        p_user_id: user.id,
        p_amount: creditsWon,
      })
    newTotalCredits = rpcData || newTotalCredits + creditsWon
  }

  return {
    success: true,
    data: {
      creditsWon,
      newTotalCredits,
      segmentIndex,
      slotIndex,
      slotsSymbols,
      coinResult,
      diceResults,
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
