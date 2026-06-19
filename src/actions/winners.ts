'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

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
  deliveryPhotoUrl: string | null
}

/** Mur public des gagnants avec suivi de livraison (preuve de confiance). */
export async function getWinnersWall(limit: number = 60): Promise<WallWinner[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('winners')
    .select(`
      id, username, item_name, item_value, won_at,
      shipping_status, shipped_at, delivered_at,
      delivery_photo_url, delivery_photo_approved,
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
      // Photo publique uniquement si approuvée par la modération.
      deliveryPhotoUrl: w.delivery_photo_approved ? (w.delivery_photo_url ?? null) : null,
    }))
    .sort((a, b) => (RANK[a.shippingStatus] ?? 5) - (RANK[b.shippingStatus] ?? 5))
}

export interface MyDeliveredWin {
  id: string
  itemName: string
  deliveryPhotoUrl: string | null
  approved: boolean
}

/** Lots reçus/expédiés du joueur connecté, pour joindre une photo (preuve de livraison). */
export async function getMyDeliveredWins(): Promise<MyDeliveredWin[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('winners')
    .select('id, item_name, delivery_photo_url, delivery_photo_approved, shipping_status, won_at')
    .eq('user_id', user.id)
    .in('shipping_status', ['shipped', 'delivered'])
    .order('won_at', { ascending: false })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((w: any) => ({
    id: w.id,
    itemName: w.item_name,
    deliveryPhotoUrl: w.delivery_photo_url ?? null,
    approved: !!w.delivery_photo_approved,
  }))
}

/** Le gagnant joint une photo de son colis (passe en modération avant affichage public). */
export async function uploadDeliveryPhoto(winnerId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const file = formData.get('photo') as File
  if (!file || file.size === 0) return { success: false, error: 'Aucun fichier sélectionné' }
  if (file.size > 4 * 1024 * 1024) return { success: false, error: 'Le fichier ne doit pas dépasser 4 Mo' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { success: false, error: 'Format non supporté (JPG, PNG ou WebP)' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // Le lot doit appartenir au joueur.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: win } = await (supabase as any).from('winners').select('id, user_id').eq('id', winnerId).single()
  if (!win || win.user_id !== user.id) return { success: false, error: 'Lot introuvable' }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `deliveries/${winnerId}-${user.id.slice(0, 8)}.${ext}`
  const { error: upErr } = await supabase.storage.from('profiles').upload(path, file, { cacheControl: '3600', upsert: true })
  if (upErr) {
    console.error('[WINNERS] delivery photo upload error:', upErr.message)
    return { success: false, error: "Erreur lors de l'envoi de la photo" }
  }
  const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(path)

  // Écriture via service_role (winners en RLS) ; remet en attente de modération.
  const svc = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from('winners')
    .update({ delivery_photo_url: publicUrl, delivery_photo_approved: false }).eq('id', winnerId)
  if (error) return { success: false, error: 'Erreur lors de la mise à jour' }

  revalidatePath('/profile')
  return { success: true }
}
