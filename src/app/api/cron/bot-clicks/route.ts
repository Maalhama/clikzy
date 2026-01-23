import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * ============================================
 * CRON DE GESTION DES JEUX - Clikzy v11.0
 * ============================================
 *
 * Ce cron gère:
 * - La mise à jour des leaders (last_click_username) pour simuler l'activité
 * - Le système de bataille en phase finale (30min à 1h59min)
 * - La fin des jeux (timer = 0)
 * - La création des records de gagnants
 *
 * Système de bataille:
 * - 0-90% de la durée: bots cliquent normalement
 * - 90-100%: probabilité de clic décroissante
 * - >100%: bots arrêtent, timer descend à 0
 *
 * Fréquence: 3 crons par minute sur cron-job.org (timeout 30s)
 * - Cron 1: /api/cron/bot-clicks (0-25s aléatoire)
 * - Cron 2: /api/cron/bot-clicks?delay=10 (10s + 0-15s = 10-25s)
 * - Cron 3: /api/cron/bot-clicks?delay=20 (20s + 0-5s = 20-25s)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

// ============================================
// GÉNÉRATEUR DE PSEUDOS DÉTERMINISTE
// (Réplique de src/lib/bots/usernameGenerator.ts)
// ============================================

const ALL_FIRST_NAMES = [
  // Français
  'Lucas', 'Hugo', 'Theo', 'Nathan', 'Mathis', 'Enzo', 'Louis', 'Gabriel',
  'Thomas', 'Antoine', 'Maxime', 'Alexandre', 'Emma', 'Léa', 'Chloé', 'Manon',
  'Camille', 'Sarah', 'Julie', 'Marie', 'Laura', 'Clara', 'Jade', 'Zoé',
  // Ibériques
  'Pablo', 'Diego', 'Carlos', 'Miguel', 'María', 'Carmen', 'Ana', 'Lucía',
  // Maghrébins
  'Mohamed', 'Ahmed', 'Youssef', 'Karim', 'Mehdi', 'Amine', 'Fatima', 'Amina',
  'Yasmine', 'Nadia', 'Samira', 'Nour', 'Lina', 'Sara', 'Rayan', 'Adam',
  // Africains
  'Mamadou', 'Moussa', 'Ibrahima', 'Ousmane', 'Fatou', 'Aminata', 'Awa',
]

const SUFFIXES = [
  '', '59', '62', '75', '69', '13', '33', '93', '94', '77', '78',
  '95', '96', '97', '98', '99', '00', '01', '02', '03', '04',
  '_off', '_real', '_fr', '_gaming', 'music', 'pro', 'x', 'zz',
  '2k', '123', '007',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function generateDeterministicUsername(seed: string): string {
  const hash = hashString(seed)
  const firstName = ALL_FIRST_NAMES[hash % ALL_FIRST_NAMES.length]
  const suffixIndex = Math.floor(hash / ALL_FIRST_NAMES.length) % SUFFIXES.length
  const suffix = SUFFIXES[suffixIndex]

  const patterns = [
    (fn: string, sfx: string) => fn.toLowerCase() + sfx,
    (fn: string, sfx: string) => fn + sfx,
    (fn: string, sfx: string) => fn.toLowerCase() + (sfx.startsWith('_') ? sfx : '_' + sfx),
    (fn: string, sfx: string) => fn.toLowerCase() + sfx.replace(/_/g, ''),
  ]

  const patternIndex = Math.floor(hash / (ALL_FIRST_NAMES.length * SUFFIXES.length)) % patterns.length
  const result = patterns[patternIndex](firstName, suffix)
  return result.replace(/__+/g, '_').replace(/_$/, '')
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
  // 0-90%: clics normaux (100% chance)
  // 90-100%: probabilité décroissante
  // >100%: plus de clics SAUF si joueur réel présent

  if (battleProgress >= 1) {
    // Bataille "terminée" mais joueur réel présent = continuer à se battre
    return hasRealPlayer
  }
  if (battleProgress < 0.9) return true

  // 90-100%: probabilité linéaire décroissante (sauf si joueur réel)
  if (hasRealPlayer) return true // Toujours cliquer si joueur réel présent

  const remainingProgress = (1 - battleProgress) / 0.1 // 1.0 à 0.0
  const seed = hashString(`${gameId}-${Math.floor(Date.now() / 60000)}`)
  const random = (seed % 100) / 100

  return random < remainingProgress
}

function getItemName(item: GameData['item']): string {
  if (Array.isArray(item) && item[0]?.name) return item[0].name
  if (item && typeof item === 'object' && 'name' in item) return item.name
  return 'Unknown'
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Support pour 3 crons décalés (timeout cron-job.org = 30s, donc max 25s)
  // - Cron 1: pas de delay → 0-25s aléatoire
  // - Cron 2: ?delay=10 → 10s + 0-15s = 10-25s
  // - Cron 3: ?delay=20 → 20s + 0-5s = 20-25s
  const delayParam = request.nextUrl.searchParams.get('delay')
  const fixedDelay = delayParam ? parseInt(delayParam, 10) : 0
  const validFixedDelay = fixedDelay > 0 && fixedDelay <= 20 ? fixedDelay : 0

  // Délai aléatoire ajusté pour que total < 25s
  const maxRandomDelay = Math.max(5, 25 - validFixedDelay)
  const randomDelay = Math.floor(Math.random() * maxRandomDelay)

  const totalDelay = validFixedDelay + randomDelay

  if (totalDelay > 0) {
    console.log(`[CRON] Waiting ${totalDelay}s (fixed: ${validFixedDelay}s + random: ${randomDelay}s)`)
    await new Promise(resolve => setTimeout(resolve, totalDelay * 1000))
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()

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
      return NextResponse.json({ message: 'No active games', processed: 0 })
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
        const isInFinalPhase = timeLeft <= 60000

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
            // La question est: prend-on le lead ou laissons-nous le joueur réel?

            if (hasRealPlayer) {
              // Un joueur réel est leader
              if (timeLeft <= 15000) {
                // SNIPE! Timer critique, on reprend le lead
                updates.last_click_username = botUsername
                updates.last_click_user_id = null
                updates.end_time = now + 60000
                action = `bot_snipe! (${botUsername}) stole from ${game.last_click_username} at ${Math.floor(timeLeft/1000)}s`
              } else if (timeLeft <= 30000) {
                // Timer bas mais pas critique - 50% chance de sniper pour créer du suspense
                const snipeSeed = hashString(`${game.id}-snipe-${Math.floor(now / 10000)}`)
                if (snipeSeed % 2 === 0) {
                  updates.last_click_username = botUsername
                  updates.last_click_user_id = null
                  updates.end_time = now + 60000
                  action = `bot_early_snipe (${botUsername}) at ${Math.floor(timeLeft/1000)}s [battle: ${Math.round(battleProgress * 100)}%/${battleDurationMin}min]`
                } else {
                  // Laisser le timer descendre, créer du suspense
                  action = `real_player_leading (${game.last_click_username}) - ${Math.floor(timeLeft/1000)}s left, building suspense...`
                }
              } else {
                // Timer > 30s avec joueur réel - ne pas cliquer, laisser le timer descendre naturellement
                action = `real_player_leading (${game.last_click_username}) - ${Math.floor(timeLeft/1000)}s left, waiting...`
              }
            } else {
              // Pas de joueur réel - bot clique normalement pour maintenir la bataille
              updates.last_click_username = botUsername
              updates.last_click_user_id = null
              updates.end_time = now + 60000
              action = `bot_click_final (${botUsername}) [battle: ${Math.round(battleProgress * 100)}%/${battleDurationMin}min]`
            }
          } else {
            // Bataille terminée ET pas de joueur réel - laisser timer descendre
            action = `battle_ended (${Math.round(battleProgress * 100)}%) - no real player, letting timer run down`
          }
        } else {
          // Phase normale - les bots cliquent comme des vrais joueurs
          updates.last_click_username = botUsername
          updates.last_click_user_id = null // Bot prend le lead
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

        results.push({
          gameId: game.id,
          action
        })
      }
    }

    const endedCount = results.filter(r => r.action === 'ended').length

    return NextResponse.json({
      message: `Checked ${results.length} games, ${endedCount} ended`,
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
  const winnerUsername = game.last_click_username || 'Bot'
  const isBot = !winnerId

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
