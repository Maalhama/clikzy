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

export interface CreditMovement {
  id: number
  delta: number
  balance_after: number
  reason: string
  created_at: string
}

/**
 * Relevé des mouvements de crédits permanents (earned_credits) du joueur connecté :
 * achats de packs, gains de mini-jeux, parrainage, conversions de jauge, etc.
 * Transparence « argent » (#7 audit 2026-06-19). Lecture seule, RLS own-row.
 */
export async function getMyCreditHistory(limit = 50): Promise<CreditMovement[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  // credit_ledger absente des types générés -> client non typé sur cette table.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('credit_ledger')
    .select('id, delta, balance_after, reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as CreditMovement[]
}
