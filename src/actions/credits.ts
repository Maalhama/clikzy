'use server'

import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// Compare deux instants sur le jour calendaire Europe/Paris (DST-safe via Intl).
function isSameParisDay(a: Date, b: Date): boolean {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' })
  return fmt.format(a) === fmt.format(b)
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
 * Récupère le bonus VIP quotidien (+10 crédits sur earned_credits, permanent).
 * Délègue à la RPC SECURITY DEFINER `collect_vip_bonus` : ATOMIQUE, basée sur
 * `last_vip_bonus_at` (colonne dédiée, plus de conflit avec le reset quotidien), alignée Paris.
 */
export async function collectVIPDailyBonus(): Promise<ActionResult<{ creditsAdded: number; newTotal: number; canCollectAgainAt: string }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('collect_vip_bonus', { p_user_id: user.id, p_amount: VIP_DAILY_BONUS })
  if (error) {
    return { success: false, error: 'Erreur lors de la récupération du bonus' }
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.ok) {
    const reason = row?.reason
    const message =
      reason === 'not_vip' ? 'Réservé aux membres V.I.P'
      : reason === 'expired' ? 'Ton abonnement V.I.P a expiré'
      : 'Tu as déjà récupéré ton bonus aujourd\'hui. Reviens demain !'
    return { success: false, error: message }
  }

  // Solde courant pour la réponse (l'UI se resynchronise aussi via le realtime crédits)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: p } = await (supabase as any)
    .from('profiles')
    .select('credits, earned_credits')
    .eq('id', user.id)
    .single()
  const newTotal = (p?.credits ?? 0) + (p?.earned_credits ?? (row.earned ?? 0))

  return {
    success: true,
    data: {
      creditsAdded: VIP_DAILY_BONUS,
      newTotal,
      canCollectAgainAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  }
}

/**
 * Indique si l'utilisateur VIP peut récupérer son bonus du jour (helper UI).
 * La frontière de jour est calculée en Europe/Paris (cohérent avec la RPC).
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
    .select('is_vip, vip_expires_at, last_vip_bonus_at')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    is_vip: boolean
    vip_expires_at: string | null
    last_vip_bonus_at: string | null
  } | null

  if (!profile || !profile.is_vip) {
    return { success: true, data: { canCollect: false, nextCollectTime: null } }
  }

  if (profile.vip_expires_at && new Date(profile.vip_expires_at) < new Date()) {
    return { success: true, data: { canCollect: false, nextCollectTime: null } }
  }

  const last = profile.last_vip_bonus_at ? new Date(profile.last_vip_bonus_at) : null
  const canCollect = !last || !isSameParisDay(last, new Date())

  return {
    success: true,
    data: {
      canCollect,
      nextCollectTime: canCollect ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  }
}
