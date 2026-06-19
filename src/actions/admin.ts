'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkAdminStatus } from '@/lib/auth/adminCheck'
import { sendShippingEmail } from '@/lib/email'
import { CREDIT_PACKS } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import type { Profile, Game, Item, Winner } from '@/types/database'

// Types for admin data
export interface AdminStats {
  totalUsers: number
  totalGames: number
  totalItems: number
  activeGames: number
  totalWins: number
  totalClicks: number
  totalRevenue: number
}

export interface AdminUser extends Profile {
  email?: string
}

export interface AdminGame extends Game {
  item?: Item
}

/** Revenu estimé (packs + rachat malin + cadeaux). Source unique partagée stats/santé. */
async function computeRevenueEstimate(sb: ReturnType<typeof createServiceClient>): Promise<number> {
  const [packBuys, binBuys, giftBuys] = await Promise.all([
    sb.from('pack_purchases').select('pack_id'),
    sb.from('buy_it_now_purchases').select('price_paid'),
    sb.from('gift_codes').select('amount_paid'),
  ])
  const packPrice: Record<string, number> = Object.fromEntries(CREDIT_PACKS.map((p) => [p.id, p.price]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packRevenue = (packBuys.data ?? []).reduce((s: number, r: any) => s + (packPrice[r.pack_id] ?? 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const binRevenue = (binBuys.data ?? []).reduce((s: number, r: any) => s + Number(r.price_paid || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const giftRevenue = (giftBuys.data ?? []).reduce((s: number, r: any) => s + Number(r.amount_paid || 0), 0) / 100
  return Math.round((packRevenue + binRevenue + giftRevenue) * 100) / 100
}

// Get admin dashboard stats
export async function getAdminStats(): Promise<AdminStats | null> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return null

  // service client : compte/agrège TOUS les profils (profiles est en RLS own-row).
  const supabase = createServiceClient()

  const [usersResult, gamesResult, itemsResult, activeGamesResult, winsResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('games').select('*', { count: 'exact', head: true }),
    supabase.from('items').select('*', { count: 'exact', head: true }),
    supabase.from('games').select('*', { count: 'exact', head: true }).in('status', ['waiting', 'active', 'final_phase']),
    supabase.from('winners').select('*', { count: 'exact', head: true }),
  ])

  // Get total clicks from all profiles
  const { data: clicksData } = await supabase
    .from('profiles')
    .select('total_clicks')

  const totalClicks = clicksData?.reduce((acc: number, p: { total_clicks: number | null }) => acc + (p.total_clicks || 0), 0) || 0

  return {
    totalUsers: usersResult.count || 0,
    totalGames: gamesResult.count || 0,
    totalItems: itemsResult.count || 0,
    activeGames: activeGamesResult.count || 0,
    totalWins: winsResult.count || 0,
    totalClicks,
    totalRevenue: await computeRevenueEstimate(supabase),
  }
}

export interface AdminHealth {
  totalUsers: number
  realPlayers: number
  recentSignups7d: number
  payingUsers: number
  conversionPct: number
  realClicks: number
  botClicks: number
  activeVips: number
  revenueEstimate: number
}

// Santé business : vrais joueurs vs bots, conversion, revenus estimés (clé pour le lancement).
export async function getAdminHealth(): Promise<AdminHealth | null> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return null
  const supabase = createServiceClient()
  const sb = supabase
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const [usersRes, vipRes, signupRes, realClicksRes, botClicksRes, realClickers, packBuys, revenueEstimate] =
    await Promise.all([
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_vip', true),
      sb.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', since7d),
      sb.from('clicks').select('*', { count: 'exact', head: true }).eq('is_bot', false),
      sb.from('clicks').select('*', { count: 'exact', head: true }).eq('is_bot', true),
      sb.from('clicks').select('user_id').eq('is_bot', false).not('user_id', 'is', null),
      sb.from('pack_purchases').select('user_id'),
      computeRevenueEstimate(sb),
    ])
  const totalUsers = usersRes.count ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realPlayers = new Set((realClickers.data ?? []).map((r: any) => r.user_id)).size
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payers = new Set((packBuys.data ?? []).map((r: any) => r.user_id))
  return {
    totalUsers,
    realPlayers,
    recentSignups7d: signupRes.count ?? 0,
    payingUsers: payers.size,
    conversionPct: totalUsers > 0 ? Math.round((payers.size / totalUsers) * 1000) / 10 : 0,
    realClicks: realClicksRes.count ?? 0,
    botClicks: botClicksRes.count ?? 0,
    activeVips: vipRes.count ?? 0,
    revenueEstimate,
  }
}

// Get users list
export async function getAdminUsers(limit: number = 50, offset: number = 0): Promise<AdminUser[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []

  // service client : liste admin de TOUS les profils (profiles est en RLS own-row).
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (data as AdminUser[]) || []
}

// Get games list
export async function getAdminGames(limit: number = 50, offset: number = 0): Promise<AdminGame[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('games')
    .select('*, item:items(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (data as AdminGame[]) || []
}

// Get items list
export async function getAdminItems(limit: number = 50, offset: number = 0): Promise<Item[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (data as Item[]) || []
}

// Get winners list
export async function getAdminWinners(limit: number = 50, offset: number = 0): Promise<Winner[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('winners')
    .select('*')
    .order('won_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (data as Winner[]) || []
}

export interface BuyItNowOrder {
  id: string
  user_id: string
  game_id: string
  item_name: string
  price_paid: number
  shipping_status: string
  tracking_number: string | null
  created_at: string
  username: string | null
}

// Liste des achats « Rachat malin » à expédier (admin)
export async function getBuyItNowOrders(limit = 50, offset = 0): Promise<BuyItNowOrder[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('buy_it_now_purchases')
    .select('id, user_id, game_id, item_name, price_paid, shipping_status, tracking_number, created_at, profiles:user_id(username)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    game_id: r.game_id,
    item_name: r.item_name,
    price_paid: Number(r.price_paid),
    shipping_status: r.shipping_status,
    tracking_number: r.tracking_number,
    created_at: r.created_at,
    username: r.profiles?.username ?? null,
  }))
}

// Met à jour le statut d'expédition d'un achat Rachat malin (+ email au suivi)
export async function updateBuyItNowShipping(
  purchaseId: string,
  status: 'pending' | 'processing' | 'shipped' | 'delivered',
  trackingNumber?: string,
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }
  const supabase = createServiceClient()

  const updateData: Record<string, unknown> = { shipping_status: status }
  if (status === 'shipped' && trackingNumber) {
    updateData.tracking_number = trackingNumber
    updateData.shipped_at = new Date().toISOString()
  }
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString()

  const { error } = await supabase.from('buy_it_now_purchases').update(updateData).eq('id', purchaseId)
  if (error) return { success: false, error: error.message }

  // Email de suivi à l'expédition (best-effort, non bloquant)
  if (status === 'shipped' && trackingNumber) {
    try {
      const { data: p } = await supabase
        .from('buy_it_now_purchases')
        .select('user_id, item_name')
        .eq('id', purchaseId)
        .single()
      if (p?.user_id) {
        const { data: userRes } = await supabase.auth.admin.getUserById(p.user_id)
        const to = userRes?.user?.email
        if (to) {
          const { data: prof } = await supabase.from('profiles').select('username').eq('id', p.user_id).single()
          await sendShippingEmail(to, prof?.username || 'Joueur', p.item_name || 'Ton lot', trackingNumber)
        }
      }
    } catch (e) {
      console.error('[ADMIN] Envoi email suivi rachat malin échoué:', e)
    }
  }

  revalidatePath('/admin')
  return { success: true }
}

// ----- JAUGE : items gagnés (l'user a payé 2× la valeur) à honorer/expédier -----
export interface GaugeWinOrder {
  id: string
  user_id: string
  item_id: string
  item_name: string
  paid_credits: number
  won_at: string
  shipping_status: string
  tracking_number: string | null
  username: string | null
  shipping: {
    firstname: string | null
    lastname: string | null
    address: string | null
    city: string | null
    postal_code: string | null
    country: string | null
    phone: string | null
  }
}

// Liste des items gagnés à la jauge à expédier (admin, avec adresse de livraison).
export async function getGaugeWins(limit = 50, offset = 0): Promise<GaugeWinOrder[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []
  const supabase = createServiceClient()
  // gauge_wins absent des types générés -> accès casté (idem pattern du projet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('gauge_wins')
    .select(
      'id, user_id, item_id, paid_credits, won_at, shipping_status, tracking_number, items:item_id(name), profiles:user_id(username, shipping_firstname, shipping_lastname, shipping_address, shipping_city, shipping_postal_code, shipping_country, shipping_phone)'
    )
    .order('won_at', { ascending: false })
    .range(offset, offset + limit - 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    item_id: r.item_id,
    item_name: r.items?.name ?? 'Item',
    paid_credits: Number(r.paid_credits),
    won_at: r.won_at,
    shipping_status: r.shipping_status,
    tracking_number: r.tracking_number,
    username: r.profiles?.username ?? null,
    shipping: {
      firstname: r.profiles?.shipping_firstname ?? null,
      lastname: r.profiles?.shipping_lastname ?? null,
      address: r.profiles?.shipping_address ?? null,
      city: r.profiles?.shipping_city ?? null,
      postal_code: r.profiles?.shipping_postal_code ?? null,
      country: r.profiles?.shipping_country ?? null,
      phone: r.profiles?.shipping_phone ?? null,
    },
  }))
}

// Met à jour l'expédition d'un item gagné à la jauge (+ email de suivi).
export async function updateGaugeWinShipping(
  winId: string,
  status: 'pending' | 'processing' | 'shipped' | 'delivered',
  trackingNumber?: string
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }
  const supabase = createServiceClient()
  const updateData: Record<string, unknown> = { shipping_status: status }
  if (status === 'shipped' && trackingNumber) {
    updateData.tracking_number = trackingNumber
    updateData.shipped_at = new Date().toISOString()
  }
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('gauge_wins').update(updateData).eq('id', winId)
  if (error) return { success: false, error: error.message }

  if (status === 'shipped' && trackingNumber) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: w } = await (supabase as any)
        .from('gauge_wins')
        .select('user_id, items:item_id(name)')
        .eq('id', winId)
        .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ww = w as any
      if (ww?.user_id) {
        const { data: userRes } = await supabase.auth.admin.getUserById(ww.user_id)
        const to = userRes?.user?.email
        if (to) {
          const { data: prof } = await supabase.from('profiles').select('username').eq('id', ww.user_id).single()
          await sendShippingEmail(to, prof?.username || 'Joueur', ww.items?.name || 'Ton lot', trackingNumber)
        }
      }
    } catch (e) {
      console.error('[ADMIN] Envoi email suivi jauge échoué:', e)
    }
  }

  revalidatePath('/admin')
  return { success: true }
}

// Update user credits
export async function updateUserCredits(userId: string, credits: number): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }

  if (credits < 0) {
    return { success: false, error: 'Les crédits ne peuvent pas être négatifs' }
  }

  const supabase = await createClient()

  // credits est verrouillé par le trigger : RPC DEFINER qui re-vérifie is_admin
  // du caller (auth.uid()) côté serveur.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('admin_set_credits', { p_user_id: userId, p_credits: credits })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// Toggle user admin status
export async function toggleUserAdmin(userId: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
  const { isAdmin: callerIsAdmin } = await checkAdminStatus()
  if (!callerIsAdmin) return { success: false, error: 'Non autorisé' }

  const supabase = await createClient()

  // is_admin est verrouillé par le trigger : RPC DEFINER qui re-vérifie is_admin
  // du caller (auth.uid()) côté serveur.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('admin_set_admin', { p_user_id: userId, p_is_admin: isAdmin })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// Create new item
export async function createItem(data: {
  name: string
  description?: string
  image_url: string
  retail_value?: number
}): Promise<{ success: boolean; error?: string; item?: Item }> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }

  if (!data.name || data.name.length < 2) {
    return { success: false, error: 'Nom requis (minimum 2 caractères)' }
  }

  if (!data.image_url) {
    return { success: false, error: 'Image URL requise' }
  }

  // items n'a pas de policy INSERT (RLS default-deny) : écriture via service_role
  // APRÈS la vérification admin ci-dessus.
  const supabase = createServiceClient()

  const { data: item, error } = await supabase
    .from('items')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      image_url: data.image_url.trim(),
      retail_value: data.retail_value || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, item: item as Item }
}

// Update shipping status
export async function updateShippingStatus(
  winnerId: string,
  status: 'pending' | 'address_needed' | 'processing' | 'shipped' | 'delivered',
  trackingNumber?: string
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }

  // winners n'a pas de policy UPDATE (RLS default-deny, durcie en C2) :
  // écriture via service_role APRÈS la vérification admin.
  const supabase = createServiceClient()

  const updateData: Record<string, unknown> = { shipping_status: status }

  if (status === 'shipped' && trackingNumber) {
    updateData.tracking_number = trackingNumber
    updateData.shipped_at = new Date().toISOString()
  }

  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('winners')
    .update(updateData)
    .eq('id', winnerId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Email de suivi au gagnant à l'expédition (best-effort, non bloquant)
  if (status === 'shipped' && trackingNumber) {
    try {
      const { data: w } = await supabase
        .from('winners')
        .select('user_id, username, item_name')
        .eq('id', winnerId)
        .single()
      if (w?.user_id) {
        const { data: userRes } = await supabase.auth.admin.getUserById(w.user_id)
        const to = userRes?.user?.email
        if (to) await sendShippingEmail(to, w.username || 'Joueur', w.item_name || 'Ton lot', trackingNumber)
      }
    } catch (e) {
      console.error('[ADMIN] Envoi email de suivi échoué:', e)
    }
  }

  revalidatePath('/admin')
  return { success: true }
}

export interface ModerationComment {
  id: string
  username: string
  content: string
  created_at: string
  game_id: string
  reports: number
}

/** Derniers commentaires (non supprimés) avec leur nombre de signalements (admin). */
export async function getModerationComments(limit = 50): Promise<ModerationComment[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []
  const supabase = createServiceClient()
  // tables non typées (comments.deleted_at / comment_reports récentes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: comments } = await (supabase as any)
    .from('comments')
    .select('id, username, content, created_at, game_id')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reports } = await (supabase as any).from('comment_reports').select('comment_id')
  const counts: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (reports ?? [])) counts[(r as any).comment_id] = (counts[(r as any).comment_id] ?? 0) + 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: ModerationComment[] = (comments ?? []).map((c: any) => ({
    id: c.id,
    username: c.username,
    content: c.content,
    created_at: c.created_at,
    game_id: c.game_id,
    reports: counts[c.id] ?? 0,
  }))
  out.sort((a, b) => b.reports - a.reports || (a.created_at < b.created_at ? 1 : -1))
  return out
}

/** Suppression (soft-delete) d'un commentaire par un admin. */
export async function adminDeleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin')
  return { success: true }
}
