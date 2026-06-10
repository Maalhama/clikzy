import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { sendWinnerEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
// M6 — générateur de pseudos partagé (plus de copie locale dupliquée ; aligné
// avec la simulation visuelle frontend qui utilise déjà cette même source).
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

/**
 * ============================================
 * CRON UNIFIÉ DE GESTION DES JEUX - Cleekzy v13.0
 * ============================================
 *
 * Ce cron gère TOUT le cycle de vie des jeux:
 * 1. Activation des jeux en attente (waiting → active)
 * 2. Simulation de l'activité des bots (mise à jour des leaders)
 * 3. Système de bataille en phase finale (30min à 1h59min)
 * 4. Fin des jeux (timer = 0) et création des records de gagnants
 *
 * Système de bataille:
 * - Phase normale: bots cliquent pour simuler l'activité
 * - Phase finale: bots maintiennent le timer jusqu'à fin de bataille
 * - Bataille terminée sans joueur réel: timer descend à 0
 *
 * Fréquence: 1 cron par minute sur cron-job.org
 * URL: /api/cron/bot-clicks
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET


function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}


interface GameData {
  id: string
  item_id: string
  status: string
  end_time: number
  total_clicks: number
  last_click_username: string | null
  last_click_user_id: string | null
  battle_start_time: string | null
  item: { name: string }[] | { name: string } | null
}

// ============================================
// SYSTÈME DE BATAILLE (durée limitée de la phase finale)
// ============================================

const BATTLE_MIN_DURATION = 30 * 60 * 1000  // 30 minutes min
const BATTLE_MAX_DURATION = 119 * 60 * 1000 // 1h59 max

function getBattleDuration(gameId: string): number {
  // Durée déterministe basée sur gameId (30min à 1h59min)
  const hash = hashString(gameId + '-battle')
  return BATTLE_MIN_DURATION + (hash % (BATTLE_MAX_DURATION - BATTLE_MIN_DURATION))
}

function getBattleProgress(gameId: string, battleStartTime: string | null): number {
  if (!battleStartTime) return 0

  const battleStart = new Date(battleStartTime).getTime()
  const elapsed = Date.now() - battleStart
  const totalDuration = getBattleDuration(gameId)

  return Math.min(1, elapsed / totalDuration)
}

function shouldBotClick(gameId: string, battleProgress: number, hasRealPlayer: boolean): boolean {
  // Tant que la bataille n'est pas terminée (< 100%), les bots DOIVENT cliquer
  // pour maintenir le timer et faire durer la bataille 30min à 1h59min

  if (battleProgress < 1) {
    // Bataille en cours - toujours cliquer pour maintenir le timer
    return true
  }

  // Bataille terminée (>= 100%)
  // Continuer seulement si un joueur réel est présent
  return hasRealPlayer
}

function getItemName(item: GameData['item']): string {
  if (Array.isArray(item) && item[0]?.name) return item[0].name
  if (item && typeof item === 'object' && 'name' in item) return item.name
  return 'Unknown'
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()
    const nowISO = new Date().toISOString()

    // ============================================
    // ÉTAPE 1: Activer les jeux en attente
    // ============================================
    const { data: gamesToActivate } = await supabase
      .from('games')
      .select('id, item:items(name)')
      .eq('status', 'waiting')
      .lte('start_time', nowISO)

    let activatedCount = 0
    if (gamesToActivate && gamesToActivate.length > 0) {
      const gameIds = gamesToActivate.map(g => g.id)
      const { error: activateError } = await supabase
        .from('games')
        .update({ status: 'active' })
        .in('id', gameIds)

      if (!activateError) {
        activatedCount = gamesToActivate.length
        console.log(`[CRON] Activated ${activatedCount} games`)
      }
    }

    // ============================================
    // ÉTAPE 2: Gérer les jeux actifs
    // ============================================
    // Récupérer les jeux actifs
    const { data: activeGames, error: fetchError } = await supabase
      .from('games')
      .select(`
        id, item_id, status, end_time, total_clicks,
        last_click_username, last_click_user_id, battle_start_time,
        item:items(name)
      `)
      .in('status', ['active', 'final_phase'])

    if (fetchError) {
      console.error('[CRON] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!activeGames || activeGames.length === 0) {
      return NextResponse.json({
        message: activatedCount > 0 ? `Activated ${activatedCount} games, no active games to process` : 'No active games',
        activated: activatedCount,
        processed: 0
      })
    }

    console.log(`[CRON] Checking ${activeGames.length} games`)

    const results: Array<{ gameId: string; action: string }> = []

    for (const game of activeGames as GameData[]) {
      const timeLeft = game.end_time - now

      if (timeLeft <= 0) {
        // Terminer le jeu
        const itemName = getItemName(game.item)
        console.log(`[CRON] Game ${game.id.substring(0, 8)} ended`)

        const ended = await endGame(supabase, game, itemName)
        results.push({
          gameId: game.id,
          action: ended ? 'ended' : 'already_ended'
        })
      } else {
        // Jeu encore actif - simuler l'activité des bots
        const updates: Record<string, unknown> = {}
        let action = `active (${Math.floor(timeLeft / 1000)}s left)`
        const isInFinalPhase = timeLeft <= 90000 // 90s - gives 1 cron cycle to maintain

        // Entrer en phase finale si nécessaire
        if (isInFinalPhase && game.status !== 'final_phase') {
          updates.status = 'final_phase'
        }

        // Toujours définir battle_start_time si en phase finale et pas encore défini
        if (isInFinalPhase && !game.battle_start_time) {
          updates.battle_start_time = new Date().toISOString()
          console.log(`[CRON] Setting battle_start_time for game ${game.id.substring(0, 8)}`)
        }

        // Calculer la progression de la bataille
        const battleProgress = getBattleProgress(game.id, game.battle_start_time)
        const battleDurationMin = Math.round(getBattleDuration(game.id) / 60000)

        // Logique de clic des bots
        const minuteSeed = Math.floor(now / 60000)
        const botUsername = generateDeterministicUsername(`${game.id}-cron-${minuteSeed}`)
        const hasRealPlayer = !!game.last_click_user_id

        if (isInFinalPhase) {
          // Phase finale - vérifier si les bots doivent encore cliquer
          // shouldBotClick retourne true si joueur réel présent (même après durée max)
          if (shouldBotClick(game.id, battleProgress, hasRealPlayer)) {
            // Tant que la bataille est en cours (< 100%), le bot DOIT cliquer pour maintenir le timer
            // Priorité absolue: maintenir le timer au-dessus de 0

            // Seuil aléatoire FIXE par jeu entre 65-85s pour désynchroniser les clics
            // Gap entre crons = 60s, donc seuil minimum = 65s pour garantir survie du timer
            const clickThresholdSeed = hashString(`${game.id}-click-threshold`)
            const clickThreshold = 65000 + (clickThresholdSeed % 20000) // 65s à 85s par jeu

            if (timeLeft <= clickThreshold) {
              // Timer sous le seuil de ce jeu - bot clique (simule plusieurs bots qui se battent)
              updates.last_click_username = botUsername
              updates.last_click_user_id = null
              // Reset 90s + jitter DÉTERMINISTE par partie (0-30s) : sinon toutes les parties
              // traitées dans le même tick reçoivent le même end_time et leurs fins se regroupent.
              updates.end_time = now + 90000 + (hashString(game.id) % 30000)
              updates.total_clicks = (game.total_clicks || 0) + Math.floor(Math.random() * 5) + 2 // +2 à +6 : bataille intense
              action = `bot_click_final (${botUsername}) SAVED at ${Math.floor(timeLeft/1000)}s! (threshold: ${Math.floor(clickThreshold/1000)}s) [battle: ${Math.round(battleProgress * 100)}%/${battleDurationMin}min]`
            } else {
              // Timer > seuil - laisser descendre
              action = `waiting (threshold: ${Math.floor(clickThreshold/1000)}s) - ${Math.floor(timeLeft/1000)}s left [battle: ${Math.round(battleProgress * 100)}%/${battleDurationMin}min]`
            }
          } else {
            // Bataille terminée ET pas de joueur réel - laisser timer descendre
            action = `battle_ended (${Math.round(battleProgress * 100)}%) - no real player, letting timer run down`
          }
        } else {
          // Phase normale - les bots cliquent comme des vrais joueurs (activité simulée)
          updates.last_click_username = botUsername
          updates.last_click_user_id = null // Bot prend le lead
          updates.total_clicks = (game.total_clicks || 0) + Math.floor(Math.random() * 3) + 1 // +1 à +3
          action = hasRealPlayer
            ? `bot_took_lead (${botUsername}) from ${game.last_click_username}`
            : `bot_click (${botUsername})`
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('games')
            .update(updates)
            .eq('id', game.id)
        }

        // Si un bot a pris le lead ce tick, enregistrer le clic dans `clicks`
        // (alimente le feed live /api/clicks/recent — sinon la table reste vide pour les bots)
        if (updates.last_click_username === botUsername) {
          // sequence_number = MAX+1 (cohérent avec perform_click, pas un compteur fabriqué)
          const { data: maxRow } = await supabase
            .from('clicks')
            .select('sequence_number')
            .eq('game_id', game.id)
            .order('sequence_number', { ascending: false })
            .limit(1)
            .maybeSingle()
          const nextSeq = ((maxRow?.sequence_number as number | null) ?? 0) + 1
          await supabase.from('clicks').insert({
            game_id: game.id,
            user_id: null,
            username: botUsername,
            item_name: getItemName(game.item),
            is_bot: true,
            sequence_number: nextSeq,
            credits_spent: 0,
          })
        }

        results.push({
          gameId: game.id,
          action
        })
      }
    }

    const endedCount = results.filter(r => r.action === 'ended').length

    return NextResponse.json({
      message: `Activated ${activatedCount}, checked ${results.length} games, ${endedCount} ended`,
      activated: activatedCount,
      processed: results.length,
      ended: endedCount,
      games: results
    })

  } catch (error) {
    console.error('[CRON] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

async function endGame(
  supabase: SupabaseClient,
  game: GameData,
  itemName: string
): Promise<boolean> {
  const winnerId = game.last_click_user_id || null
  const isBot = !winnerId
  // Si pas de username, générer un pseudo de bot cohérent
  const winnerUsername = game.last_click_username || generateDeterministicUsername(`${game.id}-winner`)

  // Update avec protection contre les race conditions
  const { data: updateResult } = await supabase
    .from('games')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      winner_id: winnerId,
    })
    .eq('id', game.id)
    .in('status', ['active', 'final_phase'])
    .select('id')

  if (!updateResult || updateResult.length === 0) {
    return false
  }

  // Créer le record du gagnant
  let finalUsername = winnerUsername
  let winnerEmail: string | null = null
  if (winnerId) {
    // username vit dans profiles ; l'email vit dans auth.users (pas profiles.email).
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', winnerId)
      .single()
    finalUsername = profile?.username || winnerUsername
    const { data: authUser } = await supabase.auth.admin.getUserById(winnerId)
    winnerEmail = authUser?.user?.email ?? null
  }

  // Récupérer la valeur de l'item
  const { data: itemData } = await supabase
    .from('items')
    .select('retail_value')
    .eq('id', game.item_id)
    .single()
  const itemValue = itemData?.retail_value || 0

  if (game.total_clicks > 0 || winnerUsername) {
    await supabase.from('winners').insert({
      game_id: game.id,
      user_id: winnerId,
      username: finalUsername,
      item_id: game.item_id,
      item_name: itemName,
      item_value: itemValue,
      total_clicks_in_game: game.total_clicks || 0,
      is_bot: isBot,
    })

    // Incrémenter les wins si joueur réel (incrément ATOMIQUE, donnée permanente)
    if (winnerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_total_wins', { p_user_id: winnerId })
      // Gamification : +200 XP pour une victoire (progression, n'affecte pas les tirages)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('award_xp', { p_user_id: winnerId, p_amount: 200 })

      // Notification push de victoire (non-bloquant)
      sendPushToUser(winnerId, {
        title: 'Victoire !',
        body: `Tu as remporté ${itemName} (${itemValue}€) — bravo !`,
        url: '/profile',
        tag: 'win',
      }).catch((err) => console.error('[CRON] Failed to send winner push:', err))

      // Envoyer l'email de victoire (non-bloquant)
      if (winnerEmail) {
        sendWinnerEmail(winnerEmail, finalUsername, itemName, itemValue).catch((err) => {
          console.error('[CRON] Failed to send winner email:', err)
        })
        console.log(`[CRON] Winner email queued for ${winnerEmail}`)
      }
    }
  }

  return true
}
