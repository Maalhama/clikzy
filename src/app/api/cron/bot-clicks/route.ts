import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { generateUsername, generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

/**
 * ============================================
 * SYSTÈME DE BOTS CLIKZY v3.0
 * ============================================
 *
 * Architecture 100% serveur-side via cron-job.org (toutes les 60s)
 *
 * RÈGLES FONDAMENTALES:
 * 1. Timer reset TOUJOURS à EXACTEMENT 60 secondes
 * 2. En phase finale avec bataille active → bots cliquent à 95-100%
 * 3. Bataille dure 30min à 1h59min (déterministe par gameId)
 * 4. Les bots ne laissent JAMAIS un joueur réel gagner (sauf fin de bataille)
 * 5. Chaque jeu est traité indépendamment avec son propre décalage temporel
 */

// ============================================
// CONFIGURATION
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

const CONFIG = {
  // Durée de bataille en phase finale
  MIN_BATTLE_DURATION: 30 * 60 * 1000,   // 30 minutes
  MAX_BATTLE_DURATION: 119 * 60 * 1000,  // 1h59 max
  WIND_DOWN_DURATION: 5 * 60 * 1000,     // 5 dernières minutes = ralentissement
  WIND_DOWN_CLICK_CHANCE: 0.30,          // 30% pendant le ralentissement

  // Seuils de temps
  FINAL_PHASE_THRESHOLD: 60 * 1000,      // < 1 minute = phase finale
  INTERESTED_THRESHOLD: 5 * 60 * 1000,   // < 5 minutes = intéressé
  CASUAL_THRESHOLD: 60 * 60 * 1000,      // < 1 heure = occasionnel

  // Probabilités de clic selon la phase (HORS bataille)
  FINAL_PHASE_CLICK_CHANCE: 1.0,         // 100% TOUJOURS en phase finale
  INTERESTED_CLICK_CHANCE: 0.70,         // 70%
  CASUAL_CLICK_CHANCE: 0.30,             // 30%
  RARE_CLICK_CHANCE: 0.05,               // 5%

  // Probabilités pendant bataille active
  BATTLE_CLICK_CHANCE: 0.98,             // 98% pendant bataille
  BATTLE_URGENT_CLICK_CHANCE: 1.0,       // 100% si timer < 15s

  // Réponse aux joueurs réels
  PLAYER_RESPONSE_CHANCE: 0.98,          // 98% de répondre
  REAL_PLAYER_WINDOW: 30 * 1000,         // Clic réel récent = < 30s
  SUSPENSE_THRESHOLD: 10 * 1000,         // Attendre timer < 10s pour suspense
  SUSPENSE_CHANCE: 0.70,                 // 70% du temps on attend le suspense

  // Probabilités de TRAITEMENT d'un jeu ce tour (indépendance entre jeux)
  PROC_URGENT: 1.0,                      // < 10s: 100% traité
  PROC_VERY_URGENT: 0.85,                // < 30s: 85% traité
  PROC_FINAL: 0.65,                      // < 60s: 65% traité
  PROC_INTERESTED: 0.40,                 // < 5min: 40% traité
  PROC_CASUAL: 0.30,                     // > 5min: 30% traité

  // Nombre de clics générés selon urgence (AUGMENTÉ pour phase finale)
  CLICKS_PANIC: { min: 6, max: 10 },     // < 10s: 6-10 clics (PANIQUE!)
  CLICKS_URGENT: { min: 5, max: 8 },     // < 30s: 5-8 clics
  CLICKS_FINAL: { min: 4, max: 7 },      // < 60s: 4-7 clics
  CLICKS_INTERESTED: { min: 2, max: 4 }, // < 5min: 2-4 clics
  CLICKS_CASUAL: { min: 1, max: 2 },     // > 5min: 1-2 clics

  // Délais entre clics pour le feed live
  DELAY_PANIC: { min: 200, max: 800 },     // Ultra rapide
  DELAY_URGENT: { min: 500, max: 1500 },   // Très rapide
  DELAY_FINAL: { min: 1000, max: 3000 },   // Rapide
  DELAY_NORMAL: { min: 2000, max: 6000 },  // Normal

  // Décalage max entre jeux (pour timestamps variés)
  MAX_GAME_OFFSET: 15000,                // 0-15 secondes
} as const

// ============================================
// TYPES
// ============================================

interface GameData {
  id: string
  item_id: string
  status: string
  end_time: number
  total_clicks: number
  last_click_username: string | null
  last_click_user_id: string | null
  last_click_at: string | null
  battle_start_time: string | null
  item: { name: string }[] | { name: string } | null
}

interface ProcessResult {
  gameId: string
  itemName: string
  clicks: number
  reason: string
  newStatus?: string
  winner?: string
}

interface BotDecision {
  shouldClick: boolean
  reason: string
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Hash déterministe pour obtenir une durée de bataille stable par jeu
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Durée de bataille déterministe (30min à 1h59min)
 * Même gameId = même durée, toujours
 */
function getBattleDuration(gameId: string): number {
  const hash = hashString(gameId)
  const range = CONFIG.MAX_BATTLE_DURATION - CONFIG.MIN_BATTLE_DURATION
  return CONFIG.MIN_BATTLE_DURATION + (hash % range)
}

/**
 * Vérifie si le dernier clic vient d'un vrai joueur (pas un bot)
 */
function isRealPlayerClick(userId: string | null): boolean {
  return userId !== null && userId !== ''
}

/**
 * Extrait le nom de l'item depuis la structure Supabase
 */
function getItemName(item: GameData['item']): string {
  if (Array.isArray(item) && item[0]?.name) return item[0].name
  if (item && typeof item === 'object' && 'name' in item) return item.name
  return 'Unknown'
}

/**
 * Génère un username unique différent du précédent
 */
function generateUniqueUsername(
  excludeUsername: string | null,
  usedUsernames: Set<string>,
  gameId: string,
  timestamp: number
): string {
  const seed = `${gameId}-${timestamp}`
  let username = generateDeterministicUsername(seed)

  let attempts = 0
  while ((username === excludeUsername || usedUsernames.has(username)) && attempts < 10) {
    username = generateDeterministicUsername(`${seed}-${attempts}`)
    attempts++
  }

  // Fallback si vraiment on ne trouve pas
  if (username === excludeUsername || usedUsernames.has(username)) {
    username = generateUsername()
  }

  return username
}

/**
 * Génère un timestamp réaliste pour un clic (délai humain)
 */
function generateClickTimestamp(baseTime: number, clickIndex: number, timeLeftMs: number): number {
  if (clickIndex === 0) return baseTime

  let delay: { min: number; max: number }

  if (timeLeftMs <= 10000) {
    delay = CONFIG.DELAY_PANIC
  } else if (timeLeftMs <= 30000) {
    delay = CONFIG.DELAY_URGENT
  } else if (timeLeftMs <= 60000) {
    delay = CONFIG.DELAY_FINAL
  } else {
    delay = CONFIG.DELAY_NORMAL
  }

  return baseTime + delay.min + Math.random() * (delay.max - delay.min)
}

/**
 * Détermine le nombre de clics à générer selon l'urgence
 */
function getClickCount(timeLeftMs: number): number {
  let config: { min: number; max: number }

  if (timeLeftMs <= 10000) {
    config = CONFIG.CLICKS_PANIC
  } else if (timeLeftMs <= 30000) {
    config = CONFIG.CLICKS_URGENT
  } else if (timeLeftMs <= 60000) {
    config = CONFIG.CLICKS_FINAL
  } else if (timeLeftMs <= CONFIG.INTERESTED_THRESHOLD) {
    config = CONFIG.CLICKS_INTERESTED
  } else {
    config = CONFIG.CLICKS_CASUAL
  }

  return config.min + Math.floor(Math.random() * (config.max - config.min + 1))
}

/**
 * Probabilité de traiter un jeu ce tour (indépendance entre jeux)
 */
function getProcessingProbability(timeLeftMs: number): number {
  if (timeLeftMs <= 10000) return CONFIG.PROC_URGENT
  if (timeLeftMs <= 30000) return CONFIG.PROC_VERY_URGENT
  if (timeLeftMs <= 60000) return CONFIG.PROC_FINAL
  if (timeLeftMs <= CONFIG.INTERESTED_THRESHOLD) return CONFIG.PROC_INTERESTED
  return CONFIG.PROC_CASUAL
}

// ============================================
// LOGIQUE DE DÉCISION DES BOTS
// ============================================

/**
 * Décide si un bot doit cliquer sur ce jeu
 *
 * PRIORITÉS:
 * 1. Si bataille terminée → NE PAS cliquer (laisser gagner)
 * 2. Si wind-down (5 dernières min) → 30% de chance
 * 3. Si réponse à joueur réel → 98% (avec suspense si timer > 10s)
 * 4. Si bataille active → 98-100% selon urgence
 * 5. Si phase finale sans bataille → 100% toujours
 * 6. Sinon → probabilités progressives selon timer
 */
function shouldBotClick(
  timeLeftMs: number,
  isResponseToRealPlayer: boolean,
  battleStartTime: Date | null,
  battleDuration: number,
  gameStatus: string
): BotDecision {

  const isInFinalPhase = gameStatus === 'final_phase' || timeLeftMs <= CONFIG.FINAL_PHASE_THRESHOLD

  // ============ BATAILLE EN COURS ============
  if (battleStartTime && isInFinalPhase) {
    const battleElapsed = Date.now() - battleStartTime.getTime()
    const timeUntilBattleEnd = battleDuration - battleElapsed

    // Bataille TERMINÉE → laisser le gagnant remporter
    if (battleElapsed >= battleDuration) {
      return { shouldClick: false, reason: 'battle_ended' }
    }

    // WIND-DOWN (5 dernières minutes) → réduire les clics
    if (timeUntilBattleEnd <= CONFIG.WIND_DOWN_DURATION) {
      if (Math.random() < CONFIG.WIND_DOWN_CLICK_CHANCE) {
        return { shouldClick: true, reason: 'wind_down_click' }
      }
      return { shouldClick: false, reason: 'wind_down_skip' }
    }

    // Réponse à un VRAI JOUEUR (dopamine!)
    if (isResponseToRealPlayer) {
      // Créer du suspense: attendre que timer < 10s (70% du temps)
      if (timeLeftMs > CONFIG.SUSPENSE_THRESHOLD && Math.random() < CONFIG.SUSPENSE_CHANCE) {
        // Mais si timer devient critique, on doit cliquer quand même
        if (timeLeftMs <= 15000) {
          return { shouldClick: true, reason: 'keep_alive_suspense' }
        }
        return { shouldClick: false, reason: 'suspense_wait' }
      }
      return { shouldClick: true, reason: 'response_to_player' }
    }

    // BATAILLE NORMALE → cliquer selon urgence
    if (timeLeftMs <= 15000) {
      // ULTRA URGENT → 100%
      return { shouldClick: true, reason: 'battle_ultra_urgent' }
    }

    // Normal → 98%
    if (Math.random() < CONFIG.BATTLE_CLICK_CHANCE) {
      return { shouldClick: true, reason: 'battle_maintain' }
    }
    return { shouldClick: false, reason: 'battle_variance' }
  }

  // ============ PHASE FINALE (pas encore de bataille) ============
  if (isInFinalPhase) {
    // TOUJOURS cliquer pour démarrer/maintenir la bataille
    return { shouldClick: true, reason: 'final_phase_start' }
  }

  // ============ HORS PHASE FINALE ============
  if (timeLeftMs <= CONFIG.INTERESTED_THRESHOLD) {
    // < 5 minutes → 70%
    if (Math.random() < CONFIG.INTERESTED_CLICK_CHANCE) {
      return { shouldClick: true, reason: 'interested' }
    }
    return { shouldClick: false, reason: 'interested_skip' }
  }

  if (timeLeftMs <= CONFIG.CASUAL_THRESHOLD) {
    // < 1 heure → 30%
    if (Math.random() < CONFIG.CASUAL_CLICK_CHANCE) {
      return { shouldClick: true, reason: 'casual' }
    }
    return { shouldClick: false, reason: 'casual_skip' }
  }

  // > 1 heure → 5%
  if (Math.random() < CONFIG.RARE_CLICK_CHANCE) {
    return { shouldClick: true, reason: 'rare' }
  }
  return { shouldClick: false, reason: 'rare_skip' }
}

// ============================================
// ENDPOINT PRINCIPAL
// ============================================

export async function GET(request: NextRequest) {
  // Vérification auth
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()

    // ============ FETCH JEUX ACTIFS ============
    console.log('🔍 [BOT-CRON] Fetching active games...')

    const { data: activeGames, error: fetchError } = await supabase
      .from('games')
      .select(`
        id,
        item_id,
        status,
        end_time,
        total_clicks,
        last_click_username,
        last_click_user_id,
        last_click_at,
        battle_start_time,
        item:items(name)
      `)
      .in('status', ['active', 'final_phase'])

    if (fetchError) {
      console.error('❌ [BOT-CRON] Error fetching games:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!activeGames || activeGames.length === 0) {
      console.log('⚠️ [BOT-CRON] No active games')
      return NextResponse.json({ message: 'No active games', processed: 0 })
    }

    console.log(`✅ [BOT-CRON] Found ${activeGames.length} games:`,
      activeGames.map(g => ({
        id: g.id.substring(0, 8),
        status: g.status,
        timeLeft: Math.floor(((g.end_time as number) - now) / 1000) + 's',
        clicks: g.total_clicks
      }))
    )

    const results: ProcessResult[] = []

    // Mélanger l'ordre des jeux pour que le décalage soit imprévisible
    const shuffledGames = [...(activeGames as GameData[])].sort(() => Math.random() - 0.5)

    // ============ TRAITEMENT DE CHAQUE JEU ============
    for (let gameIndex = 0; gameIndex < shuffledGames.length; gameIndex++) {
      const game = shuffledGames[gameIndex]

      // Décalage UNIQUE par jeu basé sur sa position dans l'ordre mélangé
      // Chaque jeu a un décalage de 0-15s, réparti de manière aléatoire
      const gameOffset = Math.floor(Math.random() * 15000)

      const endTime = game.end_time
      const timeLeft = endTime - now
      const battleDuration = getBattleDuration(game.id)
      const itemName = getItemName(game.item)

      // Parse battle_start_time
      const battleStartTime = game.battle_start_time
        ? new Date(game.battle_start_time)
        : null

      // Vérifier si dernier clic = joueur réel récent
      const lastClickAt = game.last_click_at ? new Date(game.last_click_at).getTime() : 0
      const isRecentRealPlayer = isRealPlayerClick(game.last_click_user_id) &&
        (now - lastClickAt) < CONFIG.REAL_PLAYER_WINDOW

      // ============ PROBABILITÉ DE TRAITEMENT ============
      // Chaque jeu a une probabilité indépendante d'être traité ce tour
      const processingProb = getProcessingProbability(timeLeft)
      if (Math.random() > processingProb) {
        console.log(`⏭️ [${game.id.substring(0, 8)}] Skipped this round (prob: ${Math.round(processingProb * 100)}%)`)
        results.push({
          gameId: game.id,
          itemName,
          clicks: 0,
          reason: 'random_skip'
        })
        continue
      }

      // ============ DÉCISION: CLIQUER OU NON ============
      const decision = shouldBotClick(
        timeLeft,
        isRecentRealPlayer,
        battleStartTime,
        battleDuration,
        game.status
      )

      // ============ SI BOT NE CLIQUE PAS ============
      if (!decision.shouldClick) {
        // Timer expiré ET bot ne clique pas → FIN DU JEU
        if (timeLeft <= 0) {
          console.log(`🏆 [${game.id.substring(0, 8)}] Game ending - ${decision.reason}`)

          await endGame(supabase, game, itemName)

          results.push({
            gameId: game.id,
            itemName,
            clicks: 0,
            reason: decision.reason,
            newStatus: 'ended',
            winner: game.last_click_username || 'Bot'
          })
          continue
        }

        // Timer pas expiré → juste skip
        results.push({
          gameId: game.id,
          itemName,
          clicks: 0,
          reason: decision.reason
        })
        continue
      }

      // ============ GÉNÉRATION DES CLICS ============
      const clickCount = getClickCount(timeLeft)
      const usedUsernames = new Set<string>()
      if (game.last_click_username) {
        usedUsernames.add(game.last_click_username)
      }

      const botClicks: Array<{
        username: string
        clicked_at: string
      }> = []

      // Temps de base pour les clics (avec le décalage du jeu)
      const gameTime = now + gameOffset

      let lastUsername = game.last_click_username

      for (let i = 0; i < clickCount; i++) {
        const username = generateUniqueUsername(lastUsername, usedUsernames, game.id, gameTime + i)
        usedUsernames.add(username)
        lastUsername = username

        const clickTimestamp = generateClickTimestamp(gameTime, i, timeLeft)

        botClicks.push({
          username,
          clicked_at: new Date(clickTimestamp).toISOString()
        })
      }

      // ============ CALCUL DU NOUVEAU ÉTAT ============
      let newEndTime = endTime
      let newStatus = game.status
      let shouldSetBattleStart = false

      // Passage en phase finale si timer < 1 minute
      if (game.status === 'active' && timeLeft <= CONFIG.FINAL_PHASE_THRESHOLD) {
        newStatus = 'final_phase'
        shouldSetBattleStart = true
      }

      // RESET TIMER À 60 SECONDES + DÉCALAGE ALÉATOIRE
      // Chaque jeu a un décalage différent (0-15s) pour désynchroniser les timers
      // Ex: Jeu A = 60s, Jeu B = 68s, Jeu C = 72s, etc.
      if (newStatus === 'final_phase') {
        newEndTime = now + 60000 + gameOffset
      }

      // ============ UPDATE DATABASE ============
      const lastClick = botClicks[botClicks.length - 1]

      const updateData: Record<string, unknown> = {
        total_clicks: (game.total_clicks || 0) + clickCount,
        last_click_username: lastClick.username,
        last_click_user_id: null,
        last_click_at: lastClick.clicked_at,
        end_time: newEndTime,
        status: newStatus,
      }

      if (shouldSetBattleStart && !battleStartTime) {
        updateData.battle_start_time = new Date().toISOString()
      }

      // IMPORTANT: Ajouter clause WHERE sur status pour éviter de réactiver un jeu terminé
      // Si le jeu a été terminé entre le fetch et l'update, l'update ne fera rien
      const { data: updateResult, error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', game.id)
        .in('status', ['active', 'final_phase'])
        .select('id')

      if (updateError) {
        console.error(`❌ [${game.id.substring(0, 8)}] Update error:`, updateError)
        continue
      }

      // Si l'update n'a rien modifié, le jeu a été terminé entre-temps
      if (!updateResult || updateResult.length === 0) {
        console.log(`⚠️ [${game.id.substring(0, 8)}] Game was ended by another process, skipping`)
        results.push({
          gameId: game.id,
          itemName,
          clicks: 0,
          reason: 'already_ended'
        })
        continue
      }

      // ============ INSERT CLICS DANS LE FEED ============
      const currentTotal = game.total_clicks || 0
      const clicksToInsert = botClicks.map((click, index) => ({
        game_id: game.id,
        user_id: null as string | null,
        username: click.username,
        item_name: itemName,
        is_bot: true,
        clicked_at: click.clicked_at,
        credits_spent: 0,
        sequence_number: currentTotal + index + 1,
      }))

      const { error: clicksError } = await supabase
        .from('clicks')
        .insert(clicksToInsert)

      if (clicksError) {
        console.error(`❌ [${game.id.substring(0, 8)}] Clicks insert error:`, clicksError)
      }

      console.log(`✅ [${game.id.substring(0, 8)}] ${clickCount} clicks - ${decision.reason}`)

      results.push({
        gameId: game.id,
        itemName,
        clicks: clickCount,
        reason: decision.reason,
        newStatus: newStatus !== game.status ? newStatus : undefined
      })
    }

    // ============ RÉSUMÉ ============
    const totalClicks = results.reduce((sum, r) => sum + r.clicks, 0)
    const clickedGames = results.filter(r => r.clicks > 0).length
    const endedGames = results.filter(r => r.newStatus === 'ended').length

    console.log(`📊 [BOT-CRON] Summary: ${totalClicks} clicks on ${clickedGames}/${results.length} games, ${endedGames} ended`)

    return NextResponse.json({
      message: `Processed ${results.length} games, ${totalClicks} bot clicks`,
      processed: results.length,
      totalClicks,
      clickedGames,
      endedGames,
      games: results
    })

  } catch (error) {
    console.error('❌ [BOT-CRON] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

// ============================================
// FONCTIONS AUXILIAIRES
// ============================================

/**
 * Termine un jeu et crée l'enregistrement du gagnant
 */
async function endGame(
  supabase: SupabaseClient,
  game: GameData,
  itemName: string
): Promise<boolean> {
  const winnerId = game.last_click_user_id || null
  const winnerUsername = game.last_click_username || 'Bot'
  const isBot = !winnerId

  // Update game status - ONLY if still active/final_phase (avoid race condition)
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

  // Si l'update n'a rien modifié, le jeu était déjà terminé
  if (!updateResult || updateResult.length === 0) {
    console.log(`⚠️ [${game.id.substring(0, 8)}] Game was already ended, skipping winner creation`)
    return false
  }

  // Récupérer le username si c'est un vrai joueur
  let finalUsername = winnerUsername
  if (winnerId && !finalUsername) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', winnerId)
      .single()
    finalUsername = profile?.username || 'Joueur'
  }

  // Créer l'enregistrement du gagnant
  if (game.total_clicks > 0 || winnerUsername) {
    await supabase.from('winners').insert({
      game_id: game.id,
      user_id: winnerId,
      username: finalUsername,
      item_id: game.item_id,
      item_name: itemName,
      total_clicks_in_game: game.total_clicks || 0,
      is_bot: isBot,
    })

    // Incrémenter les wins du joueur si c'est un vrai
    if (winnerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_wins')
        .eq('id', winnerId)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_wins: (profile.total_wins ?? 0) + 1 })
          .eq('id', winnerId)
      }
    }
  }

  return true
}
