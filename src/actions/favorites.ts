'use server'

import { createClient } from '@/lib/supabase/server'

// Favoris persistés en base (par joueur connecté). RLS own-row : chaque action
// est scoppée à auth.uid(). Les visiteurs anonymes gardent leurs favoris en
// localStorage côté client (cf. useFavorites).

export async function getMyFavorites(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  // user_favorites absente des types générés -> client non typé sur cette table.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_favorites')
    .select('game_id')
    .eq('user_id', user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => r.game_id as string)
}

export async function addFavorite(gameId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_favorites')
    .upsert({ user_id: user.id, game_id: gameId }, { onConflict: 'user_id,game_id' })
  if (error) {
    console.error('[FAVORITES] addFavorite error:', error)
    return { success: false }
  }
  return { success: true }
}

export async function removeFavorite(gameId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('game_id', gameId)
  if (error) {
    console.error('[FAVORITES] removeFavorite error:', error)
    return { success: false }
  }
  return { success: true }
}
