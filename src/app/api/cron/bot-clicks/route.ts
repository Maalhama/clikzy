import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateUsername, generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

/**
 * Server-side bot system with FULL INTELLIGENCE
 * Replicates the client-side bot behavior but persists to database
 *
 * RÉALISME:
 * - Chaque clic vient d'un bot DIFFÉRENT du précédent
 * - Timestamps variés et réalistes entre les clics
 * - Patterns de clics qui simulent de vrais utilisateurs
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

// ============================================
// CONFIGURATION DES BOTS INTELLIGENTS
// (Même config que useLobbyBots.ts)
// ============================================

// Durée de bataille EN PHASE FINALE (avant de laisser quelqu'un gagner)
// Note: Le jeu commence avec 1h de timer, puis la bataille dure 30min-1h59min
// Durée totale max = 1h + 1h59min = 2h59min
const MIN_BATTLE_DURATION = 30 * 60 * 1000   // 30 minutes minimum
const MAX_BATTLE_DURATION = 119 * 60 * 1000  // 1h59 maximum

// Phase de ralentissement progressif avant fin de bataille
const WIND_DOWN_DURATION = 5 * 60 * 1000     // 5 minutes de ralentissement
const WIND_DOWN_CLICK_CHANCE = 0.3           // 30% de chance pendant le ralentissement

// Seuils de temps pour le comportement des bots
const FINAL_PHASE_THRESHOLD = 60 * 1000      // < 1 minute = phase finale
const INTERESTED_THRESHOLD = 5 * 60 * 1000   // < 5 minutes = bots intéressés
const CASUAL_THRESHOLD = 60 * 60 * 1000      // < 1 heure = clics occasionnels

// Probabilités de clic selon la phase
const FINAL_PHASE_CLICK_CHANCE = 0.95        // 95% de chance de cliquer en phase finale
const INTERESTED_CLICK_CHANCE = 0.7          // 70% quand intéressé
const CASUAL_CLICK_CHANCE = 0.3              // 30% occasionnel
const RARE_CLICK_CHANCE = 0.05               // 5% quand beaucoup de temps

// Réponse aux vrais joueurs (DOPAMINE!)
const SUSPENSE_THRESHOLD = 10 * 1000         // Attendre que le timer soit < 10s
const SUSPENSE_CHANCE = 0.7                  // 70% du temps, attendre le suspense
const PLAYER_RESPONSE_CHANCE = 0.98          // 98% de chance de répondre à un vrai joueur
const REAL_PLAYER_WINDOW = 30 * 1000         // Considérer un clic comme "récent" si < 30s

// Configuration du cron (toutes les 1 minute)
const CRON_INTERVAL = 1 * 60 * 1000          // 1 minute entre chaque exécution
const CLICKS_PER_CRON_MIN = 0                // Min clics par jeu par exécution
const CLICKS_PER_CRON_MAX = 3                // Max clics par jeu par exécution

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Hash function for deterministic random based on game ID
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
 * Get deterministic battle duration for a game
 * Same game always gets same battle duration
 */
function getBattleDuration(gameId: string): number {
  const hash = hashString(gameId)
  const range = MAX_BATTLE_DURATION - MIN_BATTLE_DURATION
  return MIN_BATTLE_DURATION + (hash % range)
}

/**
 * Check if a click was from a real player (not a bot)
 * Real players have user IDs, bots don't
 */
function isRealPlayerClick(lastClickUserId: string | null): boolean {
  return lastClickUserId !== null && lastClickUserId !== ''
}

/**
 * Generate a unique bot username different from the excluded one
 * Uses deterministic username based on game + timestamp for consistency
 */
function generateUniqueUsername(excludeUsername: string | null, gameId: string, timestamp: number): string {
  // Use deterministic username based on game + timestamp
  const seed = `${gameId}-${timestamp}`
  let username = generateDeterministicUsername(seed)

  let attempts = 0
  while (username === excludeUsername && attempts < 10) {
    username = generateDeterministicUsername(`${seed}-${attempts}`)
    attempts++
  }

  return username
}

/**
 * Generate realistic timestamps for bot clicks
 * Simulates human-like delays between clicks during a battle
 *
 * FIX: Delays are now much smaller because each click adds its own delay.
 * With 3 clicks and max delay of 5s each, total offset is max 15s, giving timer of ~75s (acceptable).
 *
 * @param baseTime - Starting timestamp
 * @param clickIndex - Index of the click (0, 1, 2...)
 * @param timeLeftMs - Time left in the game
 * @returns Realistic timestamp for this click
 */
function generateRealisticTimestamp(baseTime: number, clickIndex: number, timeLeftMs: number): number {
  if (clickIndex === 0) return baseTime

  // Base delay depends on how urgent the game is
  // REDUCED delays to prevent timer showing 74-81s instead of 60s
  let minDelay: number
  let maxDelay: number

  if (timeLeftMs <= 10000) {
    // Critical phase (< 10s): very fast reactions
    minDelay = 500
    maxDelay = 2000
  } else if (timeLeftMs <= 30000) {
    // Urgent (< 30s): fast reactions
    minDelay = 1000
    maxDelay = 3000
  } else if (timeLeftMs <= 60000) {
    // Final phase (< 1min): quick but not instant
    minDelay = 1500
    maxDelay = 5000
  } else {
    // Normal: more relaxed timing
    minDelay = 3000
    maxDelay = 10000
  }

  // Generate a SINGLE random delay (not cumulative, not multiplicative)
  const delay = minDelay + Math.random() * (maxDelay - minDelay)

  // Return baseTime + just this delay (will be spread across multiple calls)
  return baseTime + delay
}

/**
 * Decide if bot should click based on time left and context
 *
 * CRITICAL: Bots MUST maintain the battle for the full duration (30-119 min)
 * even when no real players are present. This ensures realistic game activity.
 */
function shouldBotClick(
  timeLeftMs: number,
  isResponseToRealPlayer: boolean,
  battleStartTime: Date | null,
  battleDuration: number,
  gameStatus: string // 'active' | 'final_phase'
): { shouldClick: boolean; reason: string } {

  // CHECK BATTLE STATE FIRST (durée de bataille)
  // Use game status instead of timer to handle 65s buffer correctly
  const isInFinalPhase = gameStatus === 'final_phase' || timeLeftMs <= FINAL_PHASE_THRESHOLD

  if (battleStartTime && isInFinalPhase) {
    const battleElapsed = Date.now() - battleStartTime.getTime()
    const timeUntilBattleEnd = battleDuration - battleElapsed

    // Bataille terminée - laisser quelqu'un gagner
    if (battleElapsed >= battleDuration) {
      return { shouldClick: false, reason: 'battle_ended' }
    }

    // CRITICAL: Battle is still ongoing - bot MUST click to keep game alive
    // This ensures the battle lasts the full 30-119 minutes

    // Phase de ralentissement (5 dernières minutes de bataille)
    if (timeUntilBattleEnd <= WIND_DOWN_DURATION) {
      // During wind-down, reduce click rate but STILL click sometimes
      if (Math.random() < WIND_DOWN_CLICK_CHANCE) {
        return { shouldClick: true, reason: 'wind_down_click' }
      }
      return { shouldClick: false, reason: 'wind_down_skip' }
    }

    // RÉPONSE AUX VRAIS JOUEURS (DOPAMINE!) - only during active battle
    if (isResponseToRealPlayer) {
      // 70% du temps, attendre que timer < 10 secondes (suspense!)
      if (timeLeftMs > SUSPENSE_THRESHOLD && Math.random() < SUSPENSE_CHANCE) {
        // But if timer is very low, MUST click to keep game alive
        if (timeLeftMs <= 15000) {
          return { shouldClick: true, reason: 'keep_alive_suspense' }
        }
        return { shouldClick: false, reason: 'suspense_wait' }
      }
      return { shouldClick: true, reason: 'response_to_player' }
    }

    // Normal battle: ALWAYS click to maintain the game
    // Add small variation for realism (98% click rate during battle)
    if (Math.random() < 0.98) {
      return { shouldClick: true, reason: 'battle_maintain' }
    }
    // 2% chance to skip, but only if timer has enough buffer
    if (timeLeftMs > 30000) {
      return { shouldClick: false, reason: 'battle_variance' }
    }
    // Timer too low, must click
    return { shouldClick: true, reason: 'battle_keep_alive' }
  }

  // FINAL PHASE but no battle started yet - start the battle!
  if (isInFinalPhase) {
    // CRITICAL: In final phase, bots MUST ALWAYS click to prevent premature game end
    // We remove the random chance here - bots always maintain the game (100% click rate)
    return { shouldClick: true, reason: 'final_phase_maintain' }
  }

  // PROBABILITÉS SELON LE TEMPS RESTANT (hors phase finale)
  if (timeLeftMs <= INTERESTED_THRESHOLD) {
    // Intéressé (< 5 minutes): actif
    if (Math.random() < INTERESTED_CLICK_CHANCE) {
      return { shouldClick: true, reason: 'interested' }
    }
    return { shouldClick: false, reason: 'interested_skip' }
  }

  if (timeLeftMs <= CASUAL_THRESHOLD) {
    // Occasionnel (< 1 heure): quelques clics
    if (Math.random() < CASUAL_CLICK_CHANCE) {
      return { shouldClick: true, reason: 'casual' }
    }
    return { shouldClick: false, reason: 'casual_skip' }
  }

  // Beaucoup de temps (> 1 heure): très rare
  if (Math.random() < RARE_CLICK_CHANCE) {
    return { shouldClick: true, reason: 'rare' }
  }
  return { shouldClick: false, reason: 'rare_skip' }
}

// ============================================
// MAIN ENDPOINT
// ============================================

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()

    // Get all active games
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
      console.error('Error fetching games:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!activeGames || activeGames.length === 0) {
      return NextResponse.json({ message: 'No active games', processed: 0 })
    }

    const results: Array<{
      gameId: string
      itemName: string
      clicks: number
      reason: string
      newStatus?: string
      winner?: string
    }> = []

    // Track cumulative delay between games to spread clicks across time
    let gameProcessingDelay = 0

    for (const game of activeGames) {
      // Add random delay between games (0-20 seconds spread) to avoid all bots clicking at the same time
      gameProcessingDelay += Math.floor(Math.random() * 20000)
      const gameNow = now + gameProcessingDelay

      const endTime = game.end_time as number
      const timeLeft = endTime - gameNow
      const battleDuration = getBattleDuration(game.id)

      // Parse battle_start_time if exists
      const battleStartTime = game.battle_start_time
        ? new Date(game.battle_start_time)
        : null

      // Check if last click was from a real player (recently)
      const lastClickAt = game.last_click_at ? new Date(game.last_click_at).getTime() : 0
      const isRecentRealPlayer = isRealPlayerClick(game.last_click_user_id) &&
        (gameNow - lastClickAt) < REAL_PLAYER_WINDOW

      // If timer has reached 0, game is over - someone wins
      // Bots should click BEFORE timer reaches 0 (between 1-59s)
      if (timeLeft <= 0) {
        const winnerUsername = game.last_click_username || null
        const winnerId = game.last_click_user_id || null
        const itemName = getItemName(game.item)

        // Update game with winner info
        await supabase
          .from('games')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            winner_id: winnerId,
          })
          .eq('id', game.id)

        // Create winner record for both real players and bots
        if (winnerUsername || game.total_clicks > 0) {
          const isBot = !winnerId

          // Get username for real players from profile
          let username = winnerUsername
          if (winnerId && !username) {
            const { data: winnerProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', winnerId)
              .single()
            username = winnerProfile?.username || 'Joueur'
          }

          await supabase
            .from('winners')
            .insert({
              game_id: game.id,
              user_id: winnerId || null,
              username: username || 'Bot',
              item_id: game.item_id,
              item_name: itemName,
              total_clicks_in_game: game.total_clicks || 0,
              is_bot: isBot,
            })

          // Update real player's profile stats (not bots)
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

        results.push({
          gameId: game.id,
          itemName,
          clicks: 0,
          reason: 'game_ended',
          newStatus: 'ended',
          winner: winnerUsername || (game.total_clicks > 0 ? 'Bot' : 'Aucun'),
        })
        continue
      }

      // Decide if bot should click
      const decision = shouldBotClick(
        timeLeft,
        isRecentRealPlayer,
        battleStartTime,
        battleDuration,
        game.status as string
      )

      if (!decision.shouldClick) {
        results.push({
          gameId: game.id,
          itemName: getItemName(game.item),
          clicks: 0,
          reason: decision.reason,
        })
        continue
      }

      // Determine number of clicks (1-3 based on phase)
      let clickCount = 1
      if (timeLeft <= FINAL_PHASE_THRESHOLD) {
        clickCount = 1 + Math.floor(Math.random() * CLICKS_PER_CRON_MAX)
      } else if (timeLeft <= INTERESTED_THRESHOLD) {
        clickCount = 1 + Math.floor(Math.random() * 2)
      }

      // Generate bot clicks with REALISTIC behavior
      // Each click comes from a DIFFERENT bot than the previous one
      let lastUsername = game.last_click_username
      let newEndTime = endTime
      let newStatus = game.status
      let shouldSetBattleStart = false
      const botClicks: Array<{
        username: string
        item_name: string
        clicked_at: string
      }> = []

      // Track usernames used in this batch to avoid duplicates
      const usedUsernames = new Set<string>()
      if (lastUsername) {
        usedUsernames.add(lastUsername)
      }

      for (let i = 0; i < clickCount; i++) {
        // Generate unique username different from previous clicks
        let newUsername = generateUniqueUsername(lastUsername, game.id, gameNow + i)

        // Also ensure we don't repeat within this batch
        let batchAttempts = 0
        while (usedUsernames.has(newUsername) && batchAttempts < 10) {
          newUsername = generateUsername()
          batchAttempts++
        }

        usedUsernames.add(newUsername)
        lastUsername = newUsername

        // Generate realistic timestamp with human-like delays
        const clickTimestamp = generateRealisticTimestamp(gameNow, i, timeLeft)

        // Store click for insertion
        botClicks.push({
          username: newUsername,
          item_name: getItemName(game.item),
          clicked_at: new Date(clickTimestamp).toISOString(),
        })
      }

      // Trigger final phase if time < 1 minute
      // Reset to EXACTLY 60 seconds from gameNow (not last click) to ensure timer shows exactly 01:00
      if (game.status === 'active' && timeLeft <= FINAL_PHASE_THRESHOLD) {
        newEndTime = gameNow + 60000 // EXACTLY 60 seconds
        newStatus = 'final_phase'
        shouldSetBattleStart = true
      } else if (game.status === 'final_phase') {
        // In final phase, ALWAYS reset to EXACTLY 60 seconds (even if timer is negative)
        newEndTime = gameNow + 60000
      }

      // Get the timestamp of the LAST click for last_click_at field (feed live variety)
      const lastClickTimestamp = botClicks.length > 0
        ? new Date(botClicks[botClicks.length - 1].clicked_at).getTime()
        : gameNow

      // Build update data
      const updateData: Record<string, unknown> = {
        total_clicks: (game.total_clicks || 0) + clickCount,
        last_click_username: lastUsername,
        last_click_user_id: null, // Bot click = no user ID
        last_click_at: new Date(lastClickTimestamp).toISOString(),
        end_time: newEndTime,
        status: newStatus,
      }

      // Set battle start time when entering final phase
      if (shouldSetBattleStart && !battleStartTime) {
        updateData.battle_start_time = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', game.id)

      if (updateError) {
        console.error(`Error updating game ${game.id}:`, updateError)
        continue
      }

      // Insert bot clicks into clicks table for the live feed
      if (botClicks.length > 0) {
        const currentTotal = (game.total_clicks || 0)
        const clicksToInsert = botClicks.map((click, index) => ({
          game_id: game.id,
          user_id: null as string | null,
          username: click.username,
          item_name: click.item_name,
          is_bot: true,
          clicked_at: click.clicked_at,
          credits_spent: 0,
          sequence_number: currentTotal + index + 1,
        }))

        const { error: clicksError } = await supabase
          .from('clicks')
          .insert(clicksToInsert)

        if (clicksError) {
          console.error(`Error inserting clicks for game ${game.id}:`, clicksError)
        }
      }

      results.push({
        gameId: game.id,
        itemName: getItemName(game.item),
        clicks: clickCount,
        reason: decision.reason,
        newStatus: newStatus !== game.status ? newStatus : undefined,
      })
    }

    const totalClicks = results.reduce((sum, r) => sum + r.clicks, 0)
    const clickedGames = results.filter(r => r.clicks > 0).length

    console.log(`Bot intelligence: ${totalClicks} clicks on ${clickedGames}/${results.length} games`)

    return NextResponse.json({
      message: `Processed ${results.length} games, ${totalClicks} bot clicks`,
      processed: results.length,
      totalClicks,
      clickedGames,
      games: results,
    })
  } catch (error) {
    console.error('Bot cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

function getItemName(item: unknown): string {
  if (Array.isArray(item) && item[0]?.name) return item[0].name
  if (item && typeof item === 'object' && 'name' in item) return (item as { name: string }).name
  return 'Unknown'
}
