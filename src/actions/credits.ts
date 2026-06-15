'use server'

import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Reset quotidien des crédits si nécessaire (10 crédits à minuit PARIS),
 * SAUF pour les utilisateurs ayant acheté des crédits.
 * Délègue à la RPC SECURITY DEFINER `reset_daily_credits` : ATOMIQUE et alignée Paris,
 * ce qui élimine le double-reset client/cron (un seul reset par jour Paris garanti par le WHERE).
 */
export async function checkAndResetDailyCredits(): Promise<ActionResult<{ credits: number; earnedCredits: number; totalCredits: number; wasReset: boolean }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('reset_daily_credits', { p_user_id: user.id })
  if (error) {
    return { success: false, error: 'Erreur lors du reset des crédits' }
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    return { success: false, error: 'Profil non trouvé' }
  }

  const credits = row.daily_credits ?? 0
  const earnedCredits = row.earned ?? 0
  return {
    success: true,
    data: {
      credits,
      earnedCredits,
      totalCredits: credits + earnedCredits,
      wasReset: !!row.was_reset,
    },
  }
}
