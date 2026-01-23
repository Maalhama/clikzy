'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAdminStatus } from '@/lib/auth/adminCheck'
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

// Get admin dashboard stats
export async function getAdminStats(): Promise<AdminStats | null> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return null

  const supabase = await createClient()

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [usersResult, gamesResult, itemsResult, activeGamesResult, winsResult] = await Promise.all([
    (supabase as any).from('profiles').select('*', { count: 'exact', head: true }),
    (supabase as any).from('games').select('*', { count: 'exact', head: true }),
    (supabase as any).from('items').select('*', { count: 'exact', head: true }),
    (supabase as any).from('games').select('*', { count: 'exact', head: true }).in('status', ['waiting', 'active', 'final_phase']),
    (supabase as any).from('winners').select('*', { count: 'exact', head: true }),
  ])
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Get total clicks from all profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clicksData } = await (supabase as any)
    .from('profiles')
    .select('total_clicks')

  const totalClicks = clicksData?.reduce((acc: number, p: { total_clicks: number }) => acc + (p.total_clicks || 0), 0) || 0

  return {
    totalUsers: usersResult.count || 0,
    totalGames: gamesResult.count || 0,
    totalItems: itemsResult.count || 0,
    activeGames: activeGamesResult.count || 0,
    totalWins: winsResult.count || 0,
    totalClicks,
    totalRevenue: 0, // TODO: Calculate from Stripe
  }
}

// Get users list
export async function getAdminUsers(limit: number = 50, offset: number = 0): Promise<AdminUser[]> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return []

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('winners')
    .select('*')
    .order('won_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (data as Winner[]) || []
}

// Update user credits
export async function updateUserCredits(userId: string, credits: number): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminStatus()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }

  if (credits < 0) {
    return { success: false, error: 'Les crédits ne peuvent pas être négatifs' }
  }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ credits })
    .eq('id', userId)

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)

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

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item, error } = await (supabase as any)
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

  const supabase = await createClient()

  const updateData: Record<string, unknown> = { shipping_status: status }

  if (status === 'shipped' && trackingNumber) {
    updateData.tracking_number = trackingNumber
    updateData.shipped_at = new Date().toISOString()
  }

  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('winners')
    .update(updateData)
    .eq('id', winnerId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
