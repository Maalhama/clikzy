'use server'

import { createClient } from '@/lib/supabase/server'
import { GAME_CONSTANTS } from '@/lib/constants'
import { checkAndAwardBadges } from '@/actions/badges'
import type { Game, Click, Item, Profile } from '@/types/database'

type GameWithItem = Game & {
  item: Item
}

type ProfileCredits = Pick<Profile, 'credits' | 'username' | 'total_clicks'>

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
export async function clickGame(gameId: string): Promise<ActionResult<{ newEndTime?: number }>> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Get user profile to check credits
  const { data: profileData } = await supabase
    .from('profiles')
    .select('credits, username, total_clicks')
    .eq('id', user.id)
    .single()

  const profile = profileData as ProfileCredits | null

  if (!profile) {
    return { success: false, error: 'Profil non trouvé' }
  }

  if (profile.credits < GAME_CONSTANTS.CREDIT_COST_PER_CLICK) {
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

  // Get next sequence number for this game
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: seqData } = await (supabase.rpc as any)('get_next_sequence', { p_game_id: gameId })

  const sequence = (seqData as number) ?? 1

  // Start transaction-like operations
  // 1. Deduct credit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: creditError } = await (supabase.rpc as any)('decrement_credits', { p_user_id: user.id, p_amount: GAME_CONSTANTS.CREDIT_COST_PER_CLICK })

  if (creditError) {
    return { success: false, error: 'Erreur lors de la déduction des crédits' }
  }

  // 2. Record click (with username and item_name for the live feed)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: clickError } = await (supabase as any)
    .from('clicks')
    .insert({
      game_id: gameId,
      user_id: user.id,
      username: profile.username,
      item_name: game.item?.name || 'Produit',
      is_bot: false,
      sequence_number: sequence,
      credits_spent: GAME_CONSTANTS.CREDIT_COST_PER_CLICK,
    })

  if (clickError) {
    // Try to refund credit on failure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)('decrement_credits', { p_user_id: user.id, p_amount: -GAME_CONSTANTS.CREDIT_COST_PER_CLICK })
    return { success: false, error: 'Erreur lors de l\'enregistrement du clic' }
  }

  // 3. Update game
  const updateData: Partial<Game> = {
    last_click_user_id: user.id,
    last_click_username: profile.username,
    last_click_at: new Date(now).toISOString(),
    total_clicks: game.total_clicks + 1,
  }

  if (newEndTime) {
    updateData.end_time = newEndTime
    updateData.status = 'final_phase'
    // Set battle_start_time if entering final phase for the first time
    // This is critical for bots to maintain the battle for 30-119 minutes
    if (game.status === 'active') {
      updateData.battle_start_time = new Date(now).toISOString()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('games')
    .update(updateData)
    .eq('id', gameId)

  if (updateError) {
    return { success: false, error: 'Erreur lors de la mise à jour de la partie' }
  }

  // 4. Update user stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('profiles')
    .update({
      total_clicks: (profile.total_clicks ?? 0) + 1,
    })
    .eq('id', user.id)

  // 5. Check for new badges (non-blocking)
  checkAndAwardBadges().catch(console.error)

  return { success: true, data: { newEndTime } }
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
