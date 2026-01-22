import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { generateUsername, generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

/**
 * ============================================
 * SYSTÈME DE BOTS CLIKZY v4.0
 * ============================================
 *
 * RÈGLES SIMPLES:
 *
 * 1h → 30min:    1 clic toutes les ~3 minutes
 * 30min → 15min: 1 clic toutes les ~1min30
 * 15min → 1min:  1 clic toutes les ~1 minute
 * < 1min:        3 clics par minute (phase finale)
 *
 * Bataille: 30min à 1h59min, puis clics diminuent progressivement
 * Fin: Timer atteint 0 → gagnant affiché
 *
 * Chaque jeu est UNIQUE avec son propre comportement aléatoire
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

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

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Hash déterministe pour comportement unique par jeu
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
 * Durée de bataille unique par jeu (30min à 1h59min)
 */
function getBattleDuration(gameId: string): number {
  const hash = hashString(gameId)
  const minMs = 30 * 60 * 1000   // 30 min
  const maxMs = 119 * 60 * 1000  // 1h59
  return minMs + (hash % (maxMs - minMs))
}

/**
 * Facteur de "personnalité" du jeu (0.7 à 1.3)
 * Certains jeux ont des bots plus actifs, d'autres moins
 */
function getGamePersonality(gameId: string): number {
  const hash = hashString(gameId + '-personality')
  return 0.7 + (hash % 60) / 100  // 0.70 à 1.30
}

/**
 * Extrait le nom de l'item
 */
function getItemName(item: GameData['item']): string {
  if (Array.isArray(item) && item[0]?.name) return item[0].name
  if (item && typeof item === 'object' && 'name' in item) return item.name
  return 'Unknown'
}

/**
 * Génère un username unique différent du précédent
 */
function generateUniqueUsername(excludeUsername: string | null, gameId: string, timestamp: number): string {
  const seed = `${gameId}-${timestamp}`
  let username = generateDeterministicUsername(seed)

  let attempts = 0
  while (username === excludeUsername && attempts < 10) {
    username = generateDeterministicUsername(`${seed}-${attempts}`)
    attempts++
  }

  if (username === excludeUsername) {
    username = generateUsername()
  }

  return username
}

// ============================================
// LOGIQUE DES BOTS
// ============================================

/**
 * Détermine si le bot doit cliquer selon la phase du jeu
 *
 * Le cron tourne toutes les 60s. On utilise des probabilités:
 * - 1 clic / 3min = 33% de chance par tour de cron
 * - 1 clic / 1.5min = 67% de chance par tour de cron
 * - 1 clic / 1min = 100% de chance par tour de cron
 */
function shouldClickThisRound(
  timeLeftMs: number,
  gamePersonality: number,
  battleStartTime: Date | null,
  battleDuration: number
): { shouldClick: boolean; clickCount: number; reason: string } {

  const timeLeftMin = timeLeftMs / 60000

  // ============ PHASE FINALE (< 1 minute) ============
  if (timeLeftMs <= 60000) {

    // Vérifier si bataille en cours
    if (battleStartTime) {
      const battleElapsed = Date.now() - battleStartTime.getTime()
      const battleProgress = battleElapsed / battleDuration  // 0 à 1+

      // Bataille terminée → laisser le timer descendre à 0
      if (battleElapsed >= battleDuration) {
        return { shouldClick: false, clickCount: 0, reason: 'battle_ended_let_win' }
      }

      // Derniers 10% de la bataille → clics réduits progressivement
      if (battleProgress > 0.9) {
        const reduction = (battleProgress - 0.9) * 10  // 0 à 1
        const clickChance = 1 - reduction * 0.8  // 100% à 20%

        if (Math.random() > clickChance) {
          return { shouldClick: false, clickCount: 0, reason: 'battle_winding_down' }
        }

        // Moins de clics vers la fin
        const reducedClicks = Math.max(1, Math.floor(3 * (1 - reduction)))
        return { shouldClick: true, clickCount: reducedClicks, reason: 'battle_final_phase' }
      }

      // Bataille active → 3 clics par minute
      return { shouldClick: true, clickCount: 3, reason: 'battle_active' }
    }

    // Phase finale sans bataille encore → démarrer avec 3 clics
    return { shouldClick: true, clickCount: 3, reason: 'final_phase_start' }
  }

  // ============ PHASE ACTIVE (15min → 1min) ============
  if (timeLeftMs <= 15 * 60 * 1000) {
    // 1 clic par minute → 100% de chance par tour de cron
    const probability = 1.0 * gamePersonality
    if (Math.random() < probability) {
      return { shouldClick: true, clickCount: 1, reason: 'active_phase' }
    }
    return { shouldClick: false, clickCount: 0, reason: 'active_skip' }
  }

  // ============ PHASE BUILDING (30min → 15min) ============
  if (timeLeftMs <= 30 * 60 * 1000) {
    // 1 clic toutes les 1.5 minutes → 67% de chance par tour de cron
    const probability = 0.67 * gamePersonality
    if (Math.random() < probability) {
      return { shouldClick: true, clickCount: 1, reason: 'building_phase' }
    }
    return { shouldClick: false, clickCount: 0, reason: 'building_skip' }
  }

  // ============ PHASE POSITIONING (1h → 30min) ============
  if (timeLeftMs <= 60 * 60 * 1000) {
    // 1 clic toutes les 3 minutes → 33% de chance par tour de cron
    const probability = 0.33 * gamePersonality
    if (Math.random() < probability) {
      return { shouldClick: true, clickCount: 1, reason: 'positioning_phase' }
    }
    return { shouldClick: false, clickCount: 0, reason: 'positioning_skip' }
  }

  // ============ TRÈS TÔT (> 1h) ============
  // Très rare, 5% de chance
  const probability = 0.05 * gamePersonality
  if (Math.random() < probability) {
    return { shouldClick: true, clickCount: 1, reason: 'early_rare' }
  }
  return { shouldClick: false, clickCount: 0, reason: 'early_skip' }
}

/**
 * Génère les timestamps des clics espacés aléatoirement dans la minute
 *
 * Exemple pour 3 clics:
 * - Bot1 clique à un moment random (ex: après 13s)
 * - Bot2 clique quelques secondes après Bot1 (ex: après 9s)
 * - Bot3 clique quelques secondes après Bot2 (ex: après 32s)
 * Total: 13 + 9 + 32 = 54s (< 60s)
 */
function generateClickTimestamps(baseTime: number, clickCount: number): number[] {
  if (clickCount <= 0) return []
  if (clickCount === 1) return [baseTime]

  const timestamps: number[] = []
  const maxTotalDelay = 55000  // 55 secondes max pour laisser de la marge

  // Diviser le temps disponible entre les clics
  const avgDelay = maxTotalDelay / clickCount

  let currentTime = baseTime

  for (let i = 0; i < clickCount; i++) {
    // Délai aléatoire autour de la moyenne (50% à 150%)
    const minDelay = Math.floor(avgDelay * 0.3)
    const maxDelay = Math.floor(avgDelay * 1.5)
    const delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay))

    currentTime += delay
    timestamps.push(currentTime)
  }

  return timestamps
}

// ============================================
// ENDPOINT PRINCIPAL
// ============================================

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()

    // Récupérer les jeux actifs
    const { data: activeGames, error: fetchError } = await supabase
      .from('games')
      .select(`
        id, item_id, status, end_time, total_clicks,
        last_click_username, last_click_user_id, last_click_at,
        battle_start_time, item:items(name)
      `)
      .in('status', ['active', 'final_phase'])

    if (fetchError) {
      console.error('[BOT] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!activeGames || activeGames.length === 0) {
      return NextResponse.json({ message: 'No active games', processed: 0 })
    }

    console.log(`[BOT] Processing ${activeGames.length} games`)

    const results: Array<{
      gameId: string
      clicks: number
      reason: string
      newStatus?: string
    }> = []

    for (const game of activeGames as GameData[]) {
      const timeLeft = game.end_time - now
      const itemName = getItemName(game.item)
      const gamePersonality = getGamePersonality(game.id)
      const battleDuration = getBattleDuration(game.id)
      const battleStartTime = game.battle_start_time ? new Date(game.battle_start_time) : null

      // ============ TIMER EXPIRÉ → DÉCISION ============
      if (timeLeft <= 0) {
        // Vérifier si la bataille est terminée
        const battleEnded = battleStartTime &&
          (Date.now() - battleStartTime.getTime()) >= battleDuration

        // Si pas de bataille OU bataille terminée → FIN DU JEU
        if (!battleStartTime || battleEnded) {
          console.log(`[BOT] Game ${game.id.substring(0, 8)} ended - timer at 0, battle done`)

          await endGame(supabase, game, itemName)

          results.push({
            gameId: game.id,
            clicks: 0,
            reason: 'game_ended',
            newStatus: 'ended'
          })
          continue
        }

        // Bataille EN COURS mais timer négatif → on continue, les bots vont cliquer
        // C'est NORMAL - le cron tourne toutes les 60s, le timer peut passer en négatif entre deux tours
        console.log(`[BOT] Game ${game.id.substring(0, 8)} timer negative (${Math.floor(timeLeft/1000)}s) but battle ongoing, continuing...`)
      }

      // ============ DÉCISION DE CLIC ============
      const decision = shouldClickThisRound(
        timeLeft,
        gamePersonality,
        battleStartTime,
        battleDuration
      )

      if (!decision.shouldClick) {
        results.push({
          gameId: game.id,
          clicks: 0,
          reason: decision.reason
        })
        continue
      }

      // ============ GÉNÉRATION DES CLICS ============
      const clickTimestamps = generateClickTimestamps(now, decision.clickCount)
      const usedUsernames = new Set<string>()
      if (game.last_click_username) {
        usedUsernames.add(game.last_click_username)
      }

      const botClicks: Array<{ username: string; clicked_at: string }> = []
      let lastUsername = game.last_click_username

      for (let i = 0; i < clickTimestamps.length; i++) {
        const timestamp = clickTimestamps[i]
        let username = generateUniqueUsername(lastUsername, game.id, timestamp)

        // Éviter les doublons dans ce batch
        let attempts = 0
        while (usedUsernames.has(username) && attempts < 5) {
          username = generateUsername()
          attempts++
        }

        usedUsernames.add(username)
        lastUsername = username

        botClicks.push({
          username,
          clicked_at: new Date(timestamp).toISOString()
        })
      }

      // ============ CALCUL DU NOUVEL ÉTAT ============
      let newStatus = game.status
      let newEndTime = game.end_time
      let shouldSetBattleStart = false

      // Passage en phase finale si timer < 1 minute
      if (game.status === 'active' && timeLeft <= 60000) {
        newStatus = 'final_phase'
        shouldSetBattleStart = !battleStartTime
      }

      // Reset timer à EXACTEMENT 60 secondes en phase finale
      if (newStatus === 'final_phase') {
        newEndTime = now + 60000
      }

      // ============ UPDATE DATABASE ============
      const lastClick = botClicks[botClicks.length - 1]

      const updateData: Record<string, unknown> = {
        total_clicks: (game.total_clicks || 0) + botClicks.length,
        last_click_username: lastClick.username,
        last_click_user_id: null,
        last_click_at: lastClick.clicked_at,
        end_time: newEndTime,
        status: newStatus,
      }

      if (shouldSetBattleStart) {
        updateData.battle_start_time = new Date().toISOString()
      }

      // Update avec protection contre les race conditions
      const { data: updateResult, error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', game.id)
        .in('status', ['active', 'final_phase'])
        .select('id')

      if (updateError) {
        console.error(`[BOT] Update error for ${game.id.substring(0, 8)}:`, updateError)
        continue
      }

      // Si rien n'a été modifié, le jeu a été terminé entre-temps
      if (!updateResult || updateResult.length === 0) {
        results.push({ gameId: game.id, clicks: 0, reason: 'already_ended' })
        continue
      }

      // ============ INSERT CLICS DANS LE FEED ============
      const clicksToInsert = botClicks.map((click, index) => ({
        game_id: game.id,
        user_id: null as string | null,
        username: click.username,
        item_name: itemName,
        is_bot: true,
        clicked_at: click.clicked_at,
        credits_spent: 0,
        sequence_number: (game.total_clicks || 0) + index + 1,
      }))

      await supabase.from('clicks').insert(clicksToInsert)

      console.log(`[BOT] Game ${game.id.substring(0, 8)}: ${botClicks.length} clicks (${decision.reason})`)

      results.push({
        gameId: game.id,
        clicks: botClicks.length,
        reason: decision.reason,
        newStatus: newStatus !== game.status ? newStatus : undefined
      })
    }

    const totalClicks = results.reduce((sum, r) => sum + r.clicks, 0)

    return NextResponse.json({
      message: `Processed ${results.length} games, ${totalClicks} clicks`,
      processed: results.length,
      totalClicks,
      games: results
    })

  } catch (error) {
    console.error('[BOT] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

// ============================================
// FONCTION DE FIN DE JEU
// ============================================

async function endGame(
  supabase: SupabaseClient,
  game: GameData,
  itemName: string
): Promise<boolean> {
  const winnerId = game.last_click_user_id || null
  const winnerUsername = game.last_click_username || 'Bot'
  const isBot = !winnerId

  // Update avec protection
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
  if (winnerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', winnerId)
      .single()
    finalUsername = profile?.username || winnerUsername
  }

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

    // Incrémenter les wins si joueur réel
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
