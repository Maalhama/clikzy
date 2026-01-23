'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  requirement_type: string
  requirement_value: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  credits_reward: number
}

export interface UserBadge {
  id: string
  badge_id: string
  earned_at: string
  badge: Badge
}

export interface BadgeCheckResult {
  newBadges: Badge[]
  totalCreditsEarned: number
}

/**
 * Get all badges with user's earned status
 */
export async function getAllBadges(): Promise<{ badge: Badge; earned: boolean; earnedAt: string | null }[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get all badges
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: badges } = await (supabase as any)
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true })

  if (!badges) return []

  // Get user's earned badges
  let earnedBadgeIds: Set<string> = new Set()
  let earnedDates: Map<string, string> = new Map()

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userBadges } = await (supabase as any)
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id)

    if (userBadges) {
      earnedBadgeIds = new Set(userBadges.map((ub: { badge_id: string }) => ub.badge_id))
      earnedDates = new Map(userBadges.map((ub: { badge_id: string; earned_at: string }) => [ub.badge_id, ub.earned_at]))
    }
  }

  return badges.map((badge: Badge) => ({
    badge,
    earned: earnedBadgeIds.has(badge.id),
    earnedAt: earnedDates.get(badge.id) || null,
  }))
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(): Promise<UserBadge[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  return (data as UserBadge[]) || []
}

/**
 * Check and award badges based on user's stats
 * Call this after actions that might unlock badges (clicks, wins, referrals)
 */
export async function checkAndAwardBadges(): Promise<BadgeCheckResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { newBadges: [], totalCreditsEarned: 0 }
  }

  // Get user's current stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('total_clicks, total_wins, referral_count')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { newBadges: [], totalCreditsEarned: 0 }
  }

  // Count games played
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clicks } = await (supabase as any)
    .from('clicks')
    .select('game_id')
    .eq('user_id', user.id)

  const gamesPlayed = new Set(clicks?.map((c: { game_id: string }) => c.game_id) || []).size

  // Get all badges user doesn't have yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allBadges } = await (supabase as any)
    .from('badges')
    .select('*')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: earnedBadges } = await (supabase as any)
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id)

  const earnedBadgeIds = new Set(earnedBadges?.map((b: { badge_id: string }) => b.badge_id) || [])

  const stats = {
    clicks: profile.total_clicks || 0,
    wins: profile.total_wins || 0,
    games: gamesPlayed,
    referrals: profile.referral_count || 0,
  }

  const newBadges: Badge[] = []
  let totalCreditsEarned = 0

  // Check each badge
  for (const badge of (allBadges || []) as Badge[]) {
    if (earnedBadgeIds.has(badge.id)) continue

    const statValue = stats[badge.requirement_type as keyof typeof stats] || 0

    if (statValue >= badge.requirement_value) {
      // Award badge
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_badges')
        .insert({ user_id: user.id, badge_id: badge.id })

      if (!error) {
        newBadges.push(badge)
        totalCreditsEarned += badge.credits_reward
      }
    }
  }

  // Award all credits at once
  if (totalCreditsEarned > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentProfile } = await (supabase as any)
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (currentProfile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ credits: (currentProfile.credits || 0) + totalCreditsEarned })
        .eq('id', user.id)
    }
  }

  if (newBadges.length > 0) {
    revalidatePath('/profile')
  }

  return { newBadges, totalCreditsEarned }
}

/**
 * Get badge stats for display
 */
export async function getBadgeStats(): Promise<{
  total: number
  earned: number
  byRarity: { rarity: string; total: number; earned: number }[]
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allBadges } = await (supabase as any)
    .from('badges')
    .select('id, rarity')

  if (!allBadges) {
    return { total: 0, earned: 0, byRarity: [] }
  }

  let earnedBadgeIds: Set<string> = new Set()

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userBadges } = await (supabase as any)
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id)

    if (userBadges) {
      earnedBadgeIds = new Set(userBadges.map((ub: { badge_id: string }) => ub.badge_id))
    }
  }

  // Count by rarity
  const rarityMap: Map<string, { total: number; earned: number }> = new Map()
  const rarities = ['common', 'rare', 'epic', 'legendary']

  for (const r of rarities) {
    rarityMap.set(r, { total: 0, earned: 0 })
  }

  for (const badge of allBadges) {
    const stats = rarityMap.get(badge.rarity) || { total: 0, earned: 0 }
    stats.total++
    if (earnedBadgeIds.has(badge.id)) {
      stats.earned++
    }
    rarityMap.set(badge.rarity, stats)
  }

  return {
    total: allBadges.length,
    earned: earnedBadgeIds.size,
    byRarity: rarities.map(r => ({
      rarity: r,
      ...rarityMap.get(r)!,
    })),
  }
}
