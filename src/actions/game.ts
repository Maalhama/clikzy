'use server'

import { createClient } from '@/lib/supabase/server'
import { GAME_CONSTANTS } from '@/lib/constants'
import { checkAndAwardBadges, type Badge } from '@/actions/badges'
import { checkClickFraud, auditLog } from '@/lib/security'
import type { Game, Click, Item, Profile } from '@/types/database'

type GameWithItem = Game & {
  item: Item
}

type ProfileCredits = Pick<Profile, 'credits' | 'earned_credits' | 'username' | 'total_clicks'>

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Perform a click on a game
 * - Validates user has credits
 * - Deducts credit
 * - Records click
 * - Resets timer if in final phase (<1 minute)
 */
export async function clickGame(gameId: string): Promise<ActionResult<{ newEndTime?: number; newBadges?: Badge[] }>> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Fraud detection check
  const fraudCheck = checkClickFraud(user.id, gameId, 'server-action')
  if (!fraudCheck.allowed) {
    auditLog('game.fraud_detected', {
      gameId,
      riskScore: fraudCheck.riskScore,
      flags: fraudCheck.flags,
    }, { userId: user.id, severity: 'critical' })
    return { success: false, error: 'Action bloquée pour raison de sécurité' }
  }

  // Get user profile to check credits (both daily and earned)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('credits, earned_credits, username, total_clicks')
    .eq('id', user.id)
    .single()

  const profile = profileData as ProfileCredits | null

  if (!profile) {
    return { success: false, error: 'Profil non trouvé' }
  }

  // Check total credits (daily + earned)
  const totalCredits = (profile.credits ?? 0) + (profile.earned_credits ?? 0)
  if (totalCredits < GAME_CONSTANTS.CREDIT_COST_PER_CLICK) {
    return { success: false, error: 'Crédits insuffisants' }
  }

  // Get game to validate status (with item for the feed)
  const { data: gameData } = await supabase
    .from('games')
    .select('*, item:items(name)')
    .eq('id', gameId)
    .single()

  const game = gameData as (Game & { item: { name: string } | null }) | null

  if (!game) {
    return { success: false, error: 'Partie non trouvée' }
  }

  if (game.status !== 'active' && game.status !== 'final_phase') {
    return { success: false, error: 'Cette partie n\'accepte plus de clics' }
  }

  // Calculate new end time if in final phase
  let newEndTime: number | undefined
  const now = Date.now()
  const timeLeft = game.end_time - now

  // If less than 1 minute remaining, reset to 1 minute
  if (timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
    newEndTime = now + GAME_CONSTANTS.TIMER_RESET_VALUE
  }

  // Clic ATOMIQUE via la RPC perform_click : déduction (daily puis earned) + insertion du clic
  // + maj de la partie (last_click, total_clicks, timer en phase finale, battle_start_time)
  // + maj total_clicks du profil, le tout dans UNE transaction verrouillée (FOR UPDATE → règle
  // les races de séquence/dernier-clic). SECURITY DEFINER → fonctionne avec la RLS games fermée (C1).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clickResult, error: clickError } = await (supabase.rpc as any)('perform_click', {
    p_game_id: gameId,
    p_user_id: user.id,
    p_username: profile.username,
    p_item_name: game.item?.name || 'Produit',
  })

  if (clickError) {
    return { success: false, error: 'Erreur lors du clic' }
  }
  const result = Array.isArray(clickResult) ? clickResult[0] : clickResult
  if (!result?.ok) {
    return {
      success: false,
      error: result?.reason === 'insufficient_credits'
        ? 'Crédits insuffisants'
        : result?.reason === 'game_not_active'
        ? 'Cette partie n\'accepte plus de clics'
        : 'Erreur lors du clic',
    }
  }

  // 5. Check for new badges and return them
  let newBadges: Badge[] = []
  try {
    const badgeResult = await checkAndAwardBadges()
    newBadges = badgeResult.newBadges
  } catch (error) {
    console.error('Error checking badges:', error)
  }

  // Audit log successful click
  auditLog('game.click', {
    gameId,
    newEndTime,
    totalClicks: game.total_clicks + 1,
    inFinalPhase: !!newEndTime,
  }, { userId: user.id, username: profile.username })

  return { success: true, data: { newEndTime, newBadges } }
}

/**
 * Get active games with their items
 */
export async function getActiveGames(): Promise<ActionResult<GameWithItem[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      item:items(*)
    `)
    .in('status', ['active', 'final_phase', 'waiting'])
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: 'Erreur lors de la récupération des parties' }
  }

  return { success: true, data: data as GameWithItem[] }
}

/**
 * Get a single game by ID
 */
export async function getGame(gameId: string): Promise<ActionResult<GameWithItem>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      item:items(*)
    `)
    .eq('id', gameId)
    .single()

  if (error) {
    return { success: false, error: 'Partie non trouvée' }
  }

  return { success: true, data: data as GameWithItem }
}

/**
 * Get user's current credits
 */
export async function getUserCredits(): Promise<ActionResult<number>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  const profile = profileData as { credits: number } | null

  if (!profile) {
    return { success: false, error: 'Profil non trouvé' }
  }

  return { success: true, data: profile.credits }
}

/**
 * Get recent clicks for a game
 */
export async function getGameClicks(
  gameId: string,
  limit: number = 10
): Promise<ActionResult<(Click & { username: string })[]>> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clicks')
    .select(`
      *,
      profile:profiles(username)
    `)
    .eq('game_id', gameId)
    .order('clicked_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, error: 'Erreur lors de la récupération des clics' }
  }

  type ClickWithProfile = Click & { profile: { username: string } | null }

  // Transform data to flatten username
  const clicks = ((data || []) as ClickWithProfile[]).map(click => ({
    ...click,
    username: click.profile?.username || 'Anonyme',
  }))

  return { success: true, data: clicks as (Click & { username: string })[] }
}

/**
 * End a game and determine the winner
 * This would typically be called by a server-side cron job or edge function
 */
export async function endGame(gameId: string): Promise<ActionResult<{ winnerId: string | null }>> {
  const supabase = await createClient()

  // Get the game
  const { data: gameData } = await supabase
    .from('games')
    .select('*, item:items(*)')
    .eq('id', gameId)
    .single()

  const game = gameData as GameWithItem | null

  if (!game) {
    return { success: false, error: 'Partie non trouvée' }
  }

  if (game.status === 'ended') {
    return { success: false, error: 'Partie déjà terminée' }
  }

  // Determine winner (last clicker)
  const winnerId = game.last_click_user_id

  // Update game status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('games')
    .update({
      status: 'ended',
      winner_id: winnerId,
    })
    .eq('id', gameId)

  if (updateError) {
    return { success: false, error: 'Erreur lors de la fin de partie' }
  }

  // If there's a winner, record the win
  if (winnerId) {
    // Create winner record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('winners').insert({
      game_id: gameId,
      user_id: winnerId,
      item_id: game.item.id,
      item_name: game.item.name,
      item_value: game.item.retail_value,
    })

    // Update winner's stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileData } = await (supabase as any)
      .from('profiles')
      .select('total_wins')
      .eq('id', winnerId)
      .single()

    const profile = profileData as { total_wins: number | null } | null

    if (profile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ total_wins: (profile.total_wins ?? 0) + 1 })
        .eq('id', winnerId)
    }
  }

  return { success: true, data: { winnerId } }
}
