'use server'

import { createClient } from '@/lib/supabase/server'

export type DailyQuest = {
  key: string
  title: string
  description: string | null
  target: number
  xpReward: number
  creditsReward: number
  progress: number
  claimed: boolean
  completed: boolean
}

export type Progression = {
  level: number
  xp: number
  xpIntoLevel: number
  xpForLevel: number
  streak: number
  canClaimLogin: boolean
  quests: DailyQuest[]
}

type ActionResult<T> = { success: boolean; data?: T; error?: string }

// Doit rester aligné avec xp_to_level() en SQL : pour être niveau L, xp >= 50*L*(L-1).
function levelFloor(level: number): number {
  return 50 * level * (level - 1)
}

/**
 * État de progression du joueur : niveau/XP, streak, quêtes du jour.
 * Lecture seule (les écritures passent par les RPC sécurisées).
 */
export async function getProgression(): Promise<ActionResult<Progression>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('xp, level, streak_count, streak_last_day')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as {
    xp: number | null
    level: number | null
    streak_count: number | null
    streak_last_day: string | null
  } | null
  if (!profile) return { success: false, error: 'Profil non trouvé' }

  const level = profile.level ?? 1
  const xp = Number(profile.xp ?? 0)
  const xpIntoLevel = Math.max(0, xp - levelFloor(level))
  const xpForLevel = 100 * level // XP nécessaire pour passer level -> level+1

  const todayParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
  const canClaimLogin = profile.streak_last_day !== todayParis

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questRows } = await (supabase.rpc as any)('daily_quests_status')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quests: DailyQuest[] = ((questRows as any[]) || []).map((q) => ({
    key: q.key,
    title: q.title,
    description: q.description,
    target: q.target,
    xpReward: q.xp_reward,
    creditsReward: q.credits_reward,
    progress: Math.min(q.progress ?? 0, q.target),
    claimed: !!q.claimed,
    completed: (q.progress ?? 0) >= q.target,
  }))

  return {
    success: true,
    data: { level, xp, xpIntoLevel, xpForLevel, streak: profile.streak_count ?? 0, canClaimLogin, quests },
  }
}

/** Récupère la récompense de connexion du jour (streak). Idempotent (1/jour Paris). */
export async function claimDailyLogin(): Promise<ActionResult<{ streak: number; xpGained: number; creditsGained: number; already: boolean }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('claim_daily_login', { p_user_id: user.id })
  if (error) return { success: false, error: 'Erreur lors de la récupération' }
  const row = Array.isArray(data) ? data[0] : data
  return {
    success: true,
    data: { streak: row.streak, xpGained: row.xp_gained, creditsGained: row.credits_gained, already: row.already },
  }
}

/** Réclame la récompense d'une quête (validée serveur depuis les vraies données). */
export async function claimQuest(key: string): Promise<ActionResult<{ xpReward: number; creditsReward: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('claim_quest', { p_quest_key: key })
  if (error) return { success: false, error: 'Erreur' }
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.ok) {
    const msg =
      row?.reason === 'already_claimed' ? 'Déjà récupéré'
      : row?.reason === 'not_completed' ? 'Quête non terminée'
      : 'Indisponible'
    return { success: false, error: msg }
  }
  return { success: true, data: { xpReward: row.xp_reward, creditsReward: row.credits_reward } }
}
