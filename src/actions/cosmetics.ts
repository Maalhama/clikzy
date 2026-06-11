'use server'

import { createClient } from '@/lib/supabase/server'

export type Cosmetic = {
  id: string
  type: 'cursor' | 'trail' | 'frame'
  name: string
  rarity: string
  unlockLevel: number
  isPremium: boolean
  sortOrder: number
}
export type CosmeticsState = {
  catalog: Cosmetic[]
  equipped: { cursor: string; trail: string; frame: string }
  level: number
  ownedPremium: string[]
}
type Res<T> = { success: boolean; data?: T; error?: string }

export async function getCosmetics(): Promise<Res<CosmeticsState>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [{ data: cat }, { data: prof }, { data: owned }] = await Promise.all([
    sb.from('cosmetics_catalog').select('*').order('type').order('sort_order'),
    sb.from('profiles').select('level, cosmetic_cursor, cosmetic_trail, cosmetic_frame').eq('id', user.id).single(),
    sb.from('user_cosmetics').select('cosmetic_id').eq('user_id', user.id),
  ])

  const catalog: Cosmetic[] = (cat ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string, type: c.type as Cosmetic['type'], name: c.name as string,
    rarity: c.rarity as string, unlockLevel: c.unlock_level as number,
    isPremium: c.is_premium as boolean, sortOrder: c.sort_order as number,
  }))

  return {
    success: true,
    data: {
      catalog,
      equipped: {
        cursor: prof?.cosmetic_cursor ?? 'cursor_default',
        trail: prof?.cosmetic_trail ?? 'trail_none',
        frame: prof?.cosmetic_frame ?? 'frame_default',
      },
      level: prof?.level ?? 1,
      ownedPremium: (owned ?? []).map((o: { cosmetic_id: string }) => o.cosmetic_id),
    },
  }
}

export async function equipCosmetic(id: string): Promise<Res<null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('equip_cosmetic', { p_id: id })
  if (error) return { success: false, error: 'Erreur' }
  const r = Array.isArray(data) ? data[0] : data
  if (!r?.ok) return { success: false, error: r?.reason === 'locked' ? 'Pas encore débloqué' : 'Erreur' }
  return { success: true, data: null }
}
