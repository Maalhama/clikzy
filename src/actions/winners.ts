'use server'

import { createClient } from '@/lib/supabase/server'

export interface WinnerData {
  id: string
  username: string
  itemName: string
  itemValue: number | null
  itemImage: string
  wonAt: string
  totalClicksInGame: number | null
}

/**
 * Récupère les derniers gagnants pour la landing page
 * Garde les gagnants des dernières 24h minimum, indépendamment des rotations de jeux
 */
export async function getRecentWinners(limit: number = 50): Promise<WinnerData[]> {
  const supabase = await createClient()

  // Toujours montrer les gagnants des dernières 24h minimum
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: winners, error } = await supabase
    .from('winners')
    .select(`
      id,
      username,
      item_name,
      item_value,
      total_clicks_in_game,
      won_at,
      is_bot,
      profiles!winners_user_id_fkey (
        username
      ),
      items!winners_item_id_fkey (
        image_url
      )
    `)
    .gte('won_at', twentyFourHoursAgo)
    .order('won_at', { ascending: false })
    .limit(limit)

  if (error || !winners) {
    console.error('Error fetching winners:', error)
    return []
  }

  // Cast to expected type
  type WinnerRow = {
    id: string
    username: string | null
    item_name: string
    item_value: number | null
    total_clicks_in_game: number | null
    won_at: string
    is_bot: boolean
    profiles: { username: string } | null
    items: { image_url: string } | null
  }

  return (winners as WinnerRow[]).map((w) => ({
    id: w.id,
    // Use winners.username for bots, profiles.username for real players
    username: w.username || w.profiles?.username || 'Joueur anonyme',
    itemName: w.item_name,
    itemValue: w.item_value ? Number(w.item_value) : null,
    itemImage: w.items?.image_url || '/products/airpods-4-neon.png',
    wonAt: w.won_at,
    totalClicksInGame: w.total_clicks_in_game,
  }))
}

export type WallWinner = {
  id: string
  username: string
  itemName: string
  itemValue: number | null
  itemImage: string
  wonAt: string
  shippingStatus: string
  shippedAt: string | null
  deliveredAt: string | null
}

/** Mur public des gagnants avec suivi de livraison (preuve de confiance). */
export async function getWinnersWall(limit: number = 60): Promise<WallWinner[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('winners')
    .select(`
      id, username, item_name, item_value, won_at,
      shipping_status, shipped_at, delivered_at,
      profiles!winners_user_id_fkey ( username ),
      items!winners_item_id_fkey ( image_url )
    `)
    .order('won_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[]
  const RANK: Record<string, number> = { delivered: 0, shipped: 1, processing: 2, address_needed: 3, pending: 4 }
  return rows
    .map((w) => ({
      id: w.id,
      username: w.username || w.profiles?.username || 'Joueur anonyme',
      itemName: w.item_name,
      itemValue: w.item_value ? Number(w.item_value) : null,
      itemImage: w.items?.image_url || '/products/airpods-4-neon.png',
      wonAt: w.won_at,
      shippingStatus: w.shipping_status || 'pending',
      shippedAt: w.shipped_at ?? null,
      deliveredAt: w.delivered_at ?? null,
    }))
    .sort((a, b) => (RANK[a.shippingStatus] ?? 5) - (RANK[b.shippingStatus] ?? 5))
}
