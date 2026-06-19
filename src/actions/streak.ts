'use server'

import { createClient } from '@/lib/supabase/server'

export interface StreakState {
  streak: number
  freezes: number
}

export async function getStreakState(): Promise<StreakState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { streak: 0, freezes: 0 }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('streak_count, streak_freezes')
    .eq('id', user.id)
    .single()
  return { streak: data?.streak_count ?? 0, freezes: data?.streak_freezes ?? 0 }
}

export async function buyStreakFreeze(): Promise<{ success: boolean; error?: string; freezes?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('buy_streak_freeze', { p_user_id: user.id })
  if (error) return { success: false, error: 'Erreur lors de l\'achat.' }
  const r = data as { ok?: boolean; reason?: string; freezes?: number } | null
  if (!r?.ok) {
    const msg =
      r?.reason === 'max_freezes' ? 'Tu as déjà le maximum de gels (3).'
      : r?.reason === 'insufficient_credits' ? 'Crédits insuffisants (100 requis).'
      : 'Achat impossible.'
    return { success: false, error: msg }
  }
  return { success: true, freezes: r.freezes }
}
