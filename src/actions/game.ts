'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { GAME_CONSTANTS, GAUGE_ENABLED, GAUGE_MULTIPLIER } from '@/lib/constants'
import { checkAndAwardBadges, type Badge } from '@/actions/badges'
import { checkClickFraud, auditLog } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'
import { selfExcludedUntil, selfExclusionError } from '@/lib/selfExclusion'
import type { Game, Click, Item, Profile } from '@/types/database'

type GameWithItem = Game & {
  item: Item
}

type ProfileCredits = Pick<Profile, 'credits' | 'earned_credits' | 'username' | 'total_clicks' | 'total_wins'>

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
export type GaugeState = { progress: number; target: number; completed: boolean; completedCount: number }

export async function clickGame(gameId: string): Promise<ActionResult<{ newEndTime?: number; newBadges?: Badge[]; gauge?: GaugeState }>> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Jeu responsable : compte en pause -> pas de clic.
  const excl = await selfExcludedUntil(supabase, user.id)
  if (excl) return { success: false, error: selfExclusionError(excl) }

  // Garde-fou de débit DISTRIBUÉ (#8) : 90 clics/min/user, partagé via Redis en prod
  // (résiste au serverless multi-instance, contrairement à checkClickFraud qui est en
  // mémoire par instance). Seuil haut -> n'impacte pas le jeu légitime.
  if (!(await rateLimiters.clicks(`click:${user.id}`)).success) {
    auditLog('security.rate_limited', { gameId, scope: 'game.click' }, { userId: user.id, severity: 'warning' })
    return { success: false, error: 'Tu cliques trop vite, ralentis un peu.' }
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
    .select('credits, earned_credits, username, total_clicks, total_wins')
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

  // Enchère « débutants » (Lot G — confiance) : réservée aux joueurs sans aucune
  // victoire. total_wins est un compteur PERMANENT (jamais reset), donc une fois
  // gagné le joueur n'est plus éligible. Seul point d'entrée du clic -> gate ici.
  if (game.beginners_only && (profile.total_wins ?? 0) > 0) {
    return { success: false, error: 'Enchère réservée aux débutants (joueurs sans victoire).' }
  }

  // Calculate new end time if in final phase
  let newEndTime: number | undefined
  const now = Date.now()
  const timeLeft = (game.end_time ?? 0) - now

  // If less than 1 minute remaining, reset to 1 minute
  if (timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
    newEndTime = now + GAME_CONSTANTS.TIMER_RESET_VALUE
  }

  // Clic ATOMIQUE via la RPC perform_click : déduction (daily puis earned) + insertion du clic
  // + maj de la partie (last_click, total_clicks, timer en phase finale, battle_start_time)
  // + maj total_clicks du profil, le tout dans UNE transaction verrouillée (FOR UPDATE → règle
  // les races de séquence/dernier-clic). SECURITY DEFINER → fonctionne avec la RLS games fermée (C1).
  // Appelé en SERVICE_ROLE : combiné au REVOKE de `authenticated` sur perform_click
  // (migration 20260616120006), le clic n'est plus appelable en direct via supabase.rpc
  // -> il passe OBLIGATOIREMENT par cette action, donc par checkClickFraud + la garde
  // d'auto-exclusion ci-dessus (fin du bypass de la détection de fraude au clic).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clickResult, error: clickError } = await (createServiceClient().rpc as any)('perform_click', {
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

  // JAUGE « cash réel » (feature en exploration) : la jauge mesure le CASH réellement
  // payé (centimes), pas un nombre de clics. Elle n'avance donc QUE si ce clic a dépensé
  // un crédit PAYANT (earned). perform_click consomme le daily gratuit d'abord → le clic
  // est payant ssi le solde daily AVANT le clic était insuffisant (= 0). increment_item_gauge
  // (service_role) calcule le coût cash réel du crédit (coût moyen pondéré, x2/VIP inclus).
  // Best-effort : un souci de jauge ne doit JAMAIS faire échouer le clic. Inerte en prod.
  const usedEarnedCredit = (profile.credits ?? 0) < GAME_CONSTANTS.CREDIT_COST_PER_CLICK
  let gauge: GaugeState | undefined
  if (GAUGE_ENABLED && game.item_id && usedEarnedCredit) {
    try {
      const svc = createServiceClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: gaugeData } = await (svc.rpc as any)('increment_item_gauge', {
        p_user_id: user.id,
        p_item_id: game.item_id,
      })
      const g = Array.isArray(gaugeData) ? gaugeData[0] : gaugeData
      if (g) {
        gauge = {
          progress: g.out_progress ?? 0,
          target: g.out_target ?? 0,
          completed: !!g.out_completed,
          completedCount: g.out_completed_count ?? 0,
        }
        if (gauge.completed) {
          // Item dû (l'user a payé 2× la valeur) -> alerte admin pour l'expédition
          // (la ligne gauge_wins est écrite par la RPC ; voir /admin onglet Jauge).
          import('@/lib/email')
            .then(({ sendAdminAlertEmail }) =>
              sendAdminAlertEmail(
                'Jauge complétée — item à expédier',
                `user ${user.id} (${profile.username})\nitem ${game.item?.name ?? game.item_id}\ngame ${gameId}\n→ /admin (onglet Jauge gagnée)`
              )
            )
            .catch((e) => console.error('[GAUGE] alerte admin échouée:', e))
        }
      }
    } catch (gaugeError) {
      console.error('Gauge increment failed (non-bloquant):', gaugeError)
    }
  }

  // Audit log successful click
  auditLog('game.click', {
    gameId,
    newEndTime,
    totalClicks: (game.total_clicks ?? 0) + 1,
    inFinalPhase: !!newEndTime,
  }, { userId: user.id, username: profile.username })

  return { success: true, data: { newEndTime, newBadges, gauge } }
}

/**
 * État initial de la jauge perso pour un MODÈLE d'item (affichage à l'ouverture de la
 * partie). Lecture seule via le client authentifié (RLS own-row sur user_item_gauges).
 * Jauge « cash réel » : progress/target sont en CENTIMES. Cible = valeur × GAUGE_MULTIPLIER
 * × 100 (aligné avec la RPC increment_item_gauge).
 */
export async function getItemGauge(itemId: string): Promise<GaugeState> {
  const supabase = await createClient()
  const { data: itemData } = await supabase
    .from('items')
    .select('retail_value')
    .eq('id', itemId)
    .single()
  const retail = Number((itemData as { retail_value: number | null } | null)?.retail_value ?? 0)
  const target = Math.max(1, Math.round(retail * GAUGE_MULTIPLIER * 100))

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { progress: 0, target, completed: false, completedCount: 0 }

  // user_item_gauges absent des types générés -> accès casté (idem pattern RPC du projet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gaugeData } = await (supabase as any)
    .from('user_item_gauges')
    .select('progress, completed_count')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle()
  const g = gaugeData as { progress: number; completed_count: number } | null
  return {
    progress: g?.progress ?? 0,
    target,
    completed: false,
    completedCount: g?.completed_count ?? 0,
  }
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
 * Get recent clicks for a game
 */
export async function getGameClicks(
  gameId: string,
  limit: number = 10
): Promise<ActionResult<(Click & { username: string })[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
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
 * Nombre de participants distincts récents sur une partie (« N en lice »).
 * Preuve sociale minimaliste : déduplique les pseudos parmi les clics les plus
 * récents (cap borné, pas de migration). Cohérent avec le reste de l'UI qui
 * traite les bots comme des joueurs (feed, leader). Lecture publique de `clicks`.
 */
export async function getGameContenders(gameId: string): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    // RPC COUNT(DISTINCT) bornée (15 min) : un seul entier au lieu de 400 lignes
    // ramenées et dédupliquées en JS à chaque tick × spectateur.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('count_game_contenders', { p_game_id: gameId })
    if (error) return { success: false, error: 'Erreur' }
    return { success: true, data: Number(data) || 0 }
  } catch {
    return { success: false, error: 'Erreur' }
  }
}

// NOTE : l'ancienne Server Action `endGame` (clôture d'une partie côté client session) a été
// SUPPRIMÉE — c'était du code MORT (jamais appelée) et un vecteur d'exploit (insertion arbitraire
// d'un winner + fin de partie forcée + total_wins). La clôture est gérée EXCLUSIVEMENT par le cron
// `bot-clicks` (service_role). Les policies RLS games UPDATE / winners INSERT sont restreintes
// au service_role (migration de durcissement).
