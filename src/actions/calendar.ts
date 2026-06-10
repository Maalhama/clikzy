'use server'

import { createClient } from '@/lib/supabase/server'

export type CalendarDay = {
  day: string // YYYY-MM-DD
  kind: 'xp' | 'credits' | 'chest'
  amount: number
  rarity: string | null
  claimed: boolean
  claimable: boolean
}

type Res<T> = { success: boolean; data?: T; error?: string }

export async function getCalendarMonth(): Promise<Res<CalendarDay[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_calendar_month', { p_user_id: user.id })
  if (error) return { success: false, error: 'Erreur' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days: CalendarDay[] = ((data as any[]) ?? []).map((d) => ({
    day: d.day, kind: d.kind, amount: d.amount ?? 0, rarity: d.rarity ?? null,
    claimed: !!d.claimed, claimable: !!d.claimable,
  }))
  return { success: true, data: days }
}

export async function claimCalendarDay(): Promise<Res<{ already: boolean; kind: string; amount: number; rarity: string | null }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('claim_calendar_day', { p_user_id: user.id })
  if (error) return { success: false, error: 'Erreur' }
  const r = Array.isArray(data) ? data[0] : data
  if (!r?.ok) return { success: false, error: 'Erreur' }
  return { success: true, data: { already: !!r.already, kind: r.kind, amount: r.amount ?? 0, rarity: r.rarity ?? null } }
}
