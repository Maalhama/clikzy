'use server'

import { createClient } from '@/lib/supabase/server'
import { INITIAL_CREDITS } from '@/lib/constants'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Check and reset daily credits if needed
 * Credits reset to 10 every day at midnight (00:00)
 * ONLY for users who haven't purchased credits
 * Returns total credits (daily + earned)
 */
export async function checkAndResetDailyCredits(): Promise<ActionResult<{ credits: number; earnedCredits: number; totalCredits: number; wasReset: boolean }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Get user's profile with last reset time and purchase status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('credits, earned_credits, last_credits_reset, has_purchased_credits')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    credits: number
    earned_credits: number
    last_credits_reset: string
    has_purchased_credits: boolean
  } | null

  if (!profile) {
    return { success: false, error: 'Profil non trouvé' }
  }

  const earnedCredits = profile.earned_credits ?? 0

  // Skip reset for users who have purchased credits
  if (profile.has_purchased_credits) {
    return {
      success: true,
      data: {
        credits: profile.credits,
        earnedCredits,
        totalCredits: profile.credits + earnedCredits,
        wasReset: false
      }
    }
  }

  // Check if reset is needed
  const lastReset = new Date(profile.last_credits_reset)
  const now = new Date()

  // Get today's midnight
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  // If last reset was before today's midnight, reset credits
  if (lastReset < todayMidnight) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        credits: INITIAL_CREDITS,
        last_credits_reset: now.toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      return { success: false, error: 'Erreur lors du reset des crédits' }
    }

    return {
      success: true,
      data: {
        credits: INITIAL_CREDITS,
        earnedCredits,
        totalCredits: INITIAL_CREDITS + earnedCredits,
        wasReset: true
      }
    }
  }

  // No reset needed
  return {
    success: true,
    data: {
      credits: profile.credits,
      earnedCredits,
      totalCredits: profile.credits + earnedCredits,
      wasReset: false
    }
  }
}

/**
 * Get user's current credits (with daily reset check)
 */
export async function getCreditsWithReset(): Promise<ActionResult<number>> {
  const result = await checkAndResetDailyCredits()

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, data: result.data?.credits }
}

const VIP_DAILY_BONUS = 10

/**
 * Collect VIP daily bonus (+10 credits)
 * VIP users can collect this once per day
 * Credits are added to earned_credits (permanent, never reset)
 */
export async function collectVIPDailyBonus(): Promise<ActionResult<{ creditsAdded: number; newTotal: number; canCollectAgainAt: string }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Get user's profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('credits, earned_credits, is_vip, vip_expires_at, last_credits_reset')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    credits: number
    earned_credits: number
    is_vip: boolean
    vip_expires_at: string | null
    last_credits_reset: string | null
  } | null

  if (!profile) {
    return { success: false, error: 'Profil non trouvé' }
  }

  // Verify user is VIP
  if (!profile.is_vip) {
    return { success: false, error: 'Réservé aux membres V.I.P' }
  }

  // Check VIP expiration
  if (profile.vip_expires_at && new Date(profile.vip_expires_at) < new Date()) {
    return { success: false, error: 'Ton abonnement V.I.P a expiré' }
  }

  // Check if already collected today
  const now = new Date()
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  const lastCollect = profile.last_credits_reset ? new Date(profile.last_credits_reset) : null

  if (lastCollect && lastCollect >= todayMidnight) {
    // Already collected today
    const tomorrowMidnight = new Date(todayMidnight)
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1)

    return {
      success: false,
      error: 'Tu as déjà récupéré ton bonus aujourd\'hui. Reviens demain !',
    }
  }

  // Add bonus to earned_credits (permanent)
  const newEarnedCredits = (profile.earned_credits || 0) + VIP_DAILY_BONUS
  const newTotal = profile.credits + newEarnedCredits

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      earned_credits: newEarnedCredits,
      last_credits_reset: now.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'Erreur lors de la récupération du bonus' }
  }

  // Calculate next collection time
  const tomorrowMidnight = new Date(todayMidnight)
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1)

  return {
    success: true,
    data: {
      creditsAdded: VIP_DAILY_BONUS,
      newTotal,
      canCollectAgainAt: tomorrowMidnight.toISOString(),
    },
  }
}

/**
 * Check if VIP user can collect daily bonus
 */
export async function canCollectVIPBonus(): Promise<ActionResult<{ canCollect: boolean; nextCollectTime: string | null }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('is_vip, vip_expires_at, last_credits_reset')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    is_vip: boolean
    vip_expires_at: string | null
    last_credits_reset: string | null
  } | null

  if (!profile || !profile.is_vip) {
    return { success: true, data: { canCollect: false, nextCollectTime: null } }
  }

  // Check VIP expiration
  if (profile.vip_expires_at && new Date(profile.vip_expires_at) < new Date()) {
    return { success: true, data: { canCollect: false, nextCollectTime: null } }
  }

  const now = new Date()
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  const lastCollect = profile.last_credits_reset ? new Date(profile.last_credits_reset) : null

  if (!lastCollect || lastCollect < todayMidnight) {
    // Can collect now
    return { success: true, data: { canCollect: true, nextCollectTime: null } }
  }

  // Already collected, return next time
  const tomorrowMidnight = new Date(todayMidnight)
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1)

  return {
    success: true,
    data: {
      canCollect: false,
      nextCollectTime: tomorrowMidnight.toISOString(),
    },
  }
}
