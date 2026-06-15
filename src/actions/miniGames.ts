'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { computeMiniGameOutcome, makeFairGenerator } from '@/lib/provablyFair'
import { selfExcludedUntil, selfExclusionError } from '@/lib/selfExclusion'
import {
  MiniGameType,
  MiniGameEligibility,
  MiniGameResult,
} from '@/types/miniGames'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get midnight of today in French timezone (Europe/Paris)
 */
function getTodayMidnightFrench(): Date {
  const now = new Date()
  // Heure murale Europe/Paris au format ISO-like (sv-SE) : "YYYY-MM-DD HH:mm:ss"
  const parisStr = now.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
  const parisDay = parisStr.slice(0, 10) // "YYYY-MM-DD" (jour calendaire Paris)
  // Offset Paris (ms) à cet instant : (heure murale Paris interprétée comme UTC) - UTC réel
  const offsetMs = new Date(parisStr.replace(' ', 'T') + 'Z').getTime() - now.getTime()
  // Minuit Paris = (00:00 du jour Paris interprété UTC) - offset → instant UTC correct (DST-safe)
  return new Date(new Date(parisDay + 'T00:00:00Z').getTime() - offsetMs)
}

/**
 * Get midnight of tomorrow in French timezone (Europe/Paris)
 */
function getTomorrowMidnightFrench(): Date {
  const midnight = getTodayMidnightFrench()
  midnight.setDate(midnight.getDate() + 1)
  return midnight
}

/**
 * Check if user can play each mini-game today
 */
export async function getMiniGameEligibility(): Promise<ActionResult<MiniGameEligibility>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  const todayMidnight = getTodayMidnightFrench()
  const tomorrowMidnight = getTomorrowMidnightFrench()

  // Get today's FREE plays for all game types (ignore paid plays)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plays, error } = await (supabase as any)
    .from('mini_game_plays')
    .select('game_type, played_at')
    .eq('user_id', user.id)
    .eq('is_free_play', true)
    .gte('played_at', todayMidnight.toISOString())
    .order('played_at', { ascending: false })

  if (error) {
    return { success: false, error: 'Erreur lors de la récupération des parties' }
  }

  const typedPlays = (plays || []) as { game_type: MiniGameType; played_at: string }[]

  // Build eligibility map
  const gameTypes: MiniGameType[] = ['wheel', 'scratch', 'pachinko', 'slots', 'coinflip', 'dice']
  const eligibility: MiniGameEligibility = {
    wheel: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    scratch: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    pachinko: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    slots: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    coinflip: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
    dice: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
  }

  for (const gameType of gameTypes) {
    const play = typedPlays.find(p => p.game_type === gameType)
    if (play) {
      eligibility[gameType] = {
        canPlay: false,
        lastPlayedAt: play.played_at,
        nextPlayAt: tomorrowMidnight.toISOString(),
      }
    }
  }

  return { success: true, data: eligibility }
}

/**
 * Play a mini-game and receive credits
 */
export async function playMiniGame(gameType: MiniGameType): Promise<ActionResult<MiniGameResult & { segmentIndex?: number; slotIndex?: number; slotsSymbols?: number[]; coinResult?: 'heads' | 'tails'; diceResults?: [number, number] }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Jeu responsable : compte en pause -> pas de mini-jeu.
  const excl = await selfExcludedUntil(supabase, user.id)
  if (excl) return { success: false, error: selfExclusionError(excl) }

  // Check eligibility
  const eligibilityResult = await getMiniGameEligibility()
  if (!eligibilityResult.success || !eligibilityResult.data) {
    return { success: false, error: eligibilityResult.error || 'Erreur de vérification' }
  }

  if (!eligibilityResult.data[gameType].canPlay) {
    return { success: false, error: 'Vous avez déjà joué à ce jeu aujourd\'hui. Revenez demain !' }
  }

  // Résultat provably-fair (commit-reveal) : seeds consommés côté serveur,
  // résultat déterministe vérifiable = HMAC(server_seed, client_seed:nonce:cursor).
  const fairAdmin = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fairRows } = await (fairAdmin.rpc as any)('consume_fairness', { p_user: user.id })
  const fair = Array.isArray(fairRows) ? fairRows[0] : fairRows
  const fairNonce: number = fair?.nonce ?? 0
  const { creditsWon, segmentIndex, slotIndex, slotsSymbols, coinResult, diceResults } =
    computeMiniGameOutcome(gameType, makeFairGenerator(fair?.server_seed ?? '', fair?.client_seed ?? '', fairNonce))

  // Enregistrement ATOMIQUE de la partie gratuite : l'index unique partiel
  // (user_id, game_type, play_day) WHERE is_free_play sérialise les requêtes
  // parallèles (TOCTOU) -> un conflit 23505 = déjà joué aujourd'hui. C'est ce
  // gate, pas le check JS d'éligibilité ci-dessus, qui fait autorité.
  // Écriture via service_role : plus aucune policy INSERT côté client (durcissement).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (fairAdmin as any)
    .from('mini_game_plays')
    .insert({
      user_id: user.id,
      game_type: gameType,
      credits_won: creditsWon,
      is_free_play: true,
      fair_nonce: fairNonce,
    })

  if (insertError) {
    if ((insertError as { code?: string }).code === '23505') {
      return { success: false, error: 'Vous avez déjà joué à ce jeu aujourd\'hui. Revenez demain !' }
    }
    return { success: false, error: 'Erreur lors de l\'enregistrement de la partie' }
  }

  // Crédit des gains via service_role : add_mini_game_credits est révoquée de
  // `authenticated` pour empêcher tout mint direct via PostgREST.
  let newTotalCredits = 0
  if (creditsWon > 0) {
    const admin = createServiceClient()
    const { data: rpcData, error: rpcError } = await admin
      .rpc('add_mini_game_credits', {
        p_user_id: user.id,
        p_amount: creditsWon,
      })

    if (rpcError) {
      console.error('Error adding credits:', rpcError)
      // Still return success since play was recorded
    }

    newTotalCredits = (rpcData as number) || 0
  } else {
    // Get current credits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    newTotalCredits = profile?.credits || 0
  }

  return {
    success: true,
    data: {
      creditsWon,
      newTotalCredits,
      segmentIndex,
      slotIndex,
      slotsSymbols,
      coinResult,
      diceResults,
    },
  }
}

// Coût en crédits par type de jeu
const PLAY_COSTS: Record<MiniGameType, number> = {
  wheel: 3,
  scratch: 3,
  pachinko: 3,
  slots: 5,
  coinflip: 3,
  dice: 5,
}

/**
 * Play a mini-game with credits (paid play, no daily limit)
 */
export async function playMiniGamePaid(gameType: MiniGameType): Promise<ActionResult<MiniGameResult & { segmentIndex?: number; slotIndex?: number; slotsSymbols?: number[]; coinResult?: 'heads' | 'tails'; diceResults?: [number, number] }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Jeu responsable : compte en pause -> pas de mini-jeu payant.
  const excl = await selfExcludedUntil(supabase, user.id)
  if (excl) return { success: false, error: selfExclusionError(excl) }

  // Check if user has enough total credits (daily + earned)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('credits, earned_credits')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'Erreur lors de la récupération du profil' }
  }

  const playCost = PLAY_COSTS[gameType]
  const totalCredits = profile.credits + profile.earned_credits
  if (totalCredits < playCost) {
    return { success: false, error: `Crédits insuffisants. Il vous faut ${playCost} crédits pour jouer.` }
  }

  // Deduct credits (use daily credits first, then earned credits)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newTotal, error: deductError } = await (supabase as any)
    .rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: playCost,
    })

  if (deductError || newTotal === -1) {
    return { success: false, error: 'Erreur lors du débit des crédits' }
  }

  // Résultat provably-fair (commit-reveal) : seeds consommés côté serveur,
  // résultat déterministe vérifiable = HMAC(server_seed, client_seed:nonce:cursor).
  const fairAdmin = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fairRows } = await (fairAdmin.rpc as any)('consume_fairness', { p_user: user.id })
  const fair = Array.isArray(fairRows) ? fairRows[0] : fairRows
  const fairNonce: number = fair?.nonce ?? 0
  const { creditsWon, segmentIndex, slotIndex, slotsSymbols, coinResult, diceResults } =
    computeMiniGameOutcome(gameType, makeFairGenerator(fair?.server_seed ?? '', fair?.client_seed ?? '', fairNonce))

  // Insert play record (paid play - for history tracking).
  // Écriture via service_role : plus aucune policy INSERT côté client (durcissement).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: paidInsertError } = await (fairAdmin as any)
    .from('mini_game_plays')
    .insert({
      user_id: user.id,
      game_type: gameType,
      credits_won: creditsWon,
      is_free_play: false,
      fair_nonce: fairNonce,
    })
  if (paidInsertError) {
    // Crédits déjà débités/gagnés : on log pour audit sans bloquer le retour joueur.
    console.error('[miniGamePaid] enregistrement de la partie échoué:', paidInsertError)
  }

  // Add winnings to earned_credits (permanent) via service_role
  // (add_mini_game_credits révoquée de `authenticated`).
  let newTotalCredits = newTotal as number
  if (creditsWon > 0) {
    const admin = createServiceClient()
    const { data: rpcData } = await admin
      .rpc('add_mini_game_credits', {
        p_user_id: user.id,
        p_amount: creditsWon,
      })
    newTotalCredits = (rpcData as number) || newTotalCredits + creditsWon
  }

  return {
    success: true,
    data: {
      creditsWon,
      newTotalCredits,
      segmentIndex,
      slotIndex,
      slotsSymbols,
      coinResult,
      diceResults,
    },
  }
}

