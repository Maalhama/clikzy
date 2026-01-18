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
 */
export async function checkAndResetDailyCredits(): Promise<ActionResult<{ credits: number; wasReset: boolean }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Get user's profile with last reset time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('credits, last_credits_reset')
    .eq('id', user.id)
    .single()

  const profile = profileData as { credits: number; last_credits_reset: string } | null

  if (!profile) {
    return { success: false, error: 'Profil non trouvé' }
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
        wasReset: true
      }
    }
  }

  // No reset needed
  return {
    success: true,
    data: {
      credits: profile.credits,
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
