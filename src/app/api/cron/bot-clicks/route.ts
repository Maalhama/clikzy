import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateUsername } from '@/lib/bots/usernameGenerator'

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

// Durée de bataille (avant de laisser quelqu'un gagner)
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

// Configuration du cron (toutes les 5 minutes)
const CRON_INTERVAL = 5 * 60 * 1000          // 5 minutes entre chaque exécution
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
 * Tries up to 10 times to get a different username
 */
function generateUniqueUsername(excludeUsername: string | null): string {
  let attempts = 0
  let username = generateUsername()

  while (username === excludeUsername && attempts < 10) {
    username = generateUsername()
    attempts++
  }

  return username
}

/**
 * Generate realistic timestamps for bot clicks
 * Simulates human-like delays between clicks during a battle
 *
 * @param baseTime - Starting timestamp
 * @param clickIndex - Index of the click (0, 1, 2...)
 * @param timeLeftMs - Time left in the game
 * @returns Realistic timestamp for this click
 */
function generateRealisticTimestamp(baseTime: number, clickIndex: number, timeLeftMs: number): number {
  if (clickIndex === 0) return baseTime

  // Base delay depends on how urgent the game is
  let minDelay: number
  let maxDelay: number

  if (timeLeftMs <= 10000) {
    // Critical phase (< 10s): very fast reactions
    minDelay = 200
    maxDelay = 1500
  } else if (timeLeftMs <= 30000) {
    // Urgent (< 30s): fast reactions
    minDelay = 500
    maxDelay = 3000
  } else if (timeLeftMs <= 60000) {
    // Final phase (< 1min): quick but not instant
    minDelay = 1000
    maxDelay = 8000
  } else {
    // Normal: more relaxed timing
    minDelay = 5000
    maxDelay = 30000
  }

  // Add cumulative delay for each subsequent click
  const delay = minDelay + Math.random() * (maxDelay - minDelay)
  return baseTime + (clickIndex * delay)
}

/**
 * Decide if bot should click based on time left and context
 */
function shouldBotClick(
  timeLeftMs: number,
  isResponseToRealPlayer: boolean,
  battleStartTime: Date | null,
  battleDuration: number
): { shouldClick: boolean; reason: string } {

  // RÉPONSE AUX VRAIS JOUEURS (DOPAMINE!)
  if (isResponseToRealPlayer && timeLeftMs <= FINAL_PHASE_THRESHOLD) {
    // 70% du temps, attendre que timer < 10 secondes (suspense!)
    if (timeLeftMs > SUSPENSE_THRESHOLD && Math.random() < SUSPENSE_CHANCE) {
      return { shouldClick: false, reason: 'suspense_wait' }
    }
    // Répondre avec haute probabilité
    if (Math.random() < PLAYER_RESPONSE_CHANCE) {
      return { shouldClick: true, reason: 'response_to_player' }
    }
    return { shouldClick: false, reason: 'response_skip' }
  }

  // CHECK BATTLE STATE (durée de bataille)
  if (battleStartTime && timeLeftMs <= FINAL_PHASE_THRESHOLD) {
    const battleElapsed = Date.now() - battleStartTime.getTime()
    const timeUntilBattleEnd = battleDuration - battleElapsed

    // Phase de ralentissement (5 dernières minutes de bataille)
    if (timeUntilBattleEnd <= WIND_DOWN_DURATION && timeUntilBattleEnd > 0) {
      if (Math.random() > WIND_DOWN_CLICK_CHANCE) {
        return { shouldClick: false, reason: 'wind_down' }
      }
    }

    // Bataille terminée - laisser quelqu'un gagner
    if (battleElapsed >= battleDuration) {
      return { shouldClick: false, reason: 'battle_ended' }
    }
  }

  // PROBABILITÉS SELON LE TEMPS RESTANT
  if (timeLeftMs <= FINAL_PHASE_THRESHOLD) {
    // Phase finale (< 1 minute): très actif
    if (Math.random() < FINAL_PHASE_CLICK_CHANCE) {
      return { shouldClick: true, reason: 'final_phase' }
    }
    return { shouldClick: false, reason: 'final_phase_skip' }
  }

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

    for (const game of activeGames) {
      const endTime = game.end_time as number
      const timeLeft = endTime - now
      const battleDuration = getBattleDuration(game.id)

      // Parse battle_start_time if exists
      const battleStartTime = game.battle_start_time
        ? new Date(game.battle_start_time)
        : null

      // Check if last click was from a real player (recently)
      const lastClickAt = game.last_click_at ? new Date(game.last_click_at).getTime() : 0
      const isRecentRealPlayer = isRealPlayerClick(game.last_click_user_id) &&
        (now - lastClickAt) < REAL_PLAYER_WINDOW

      // If game has ended, mark it and record winner
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
        battleDuration
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
        let newUsername = generateUniqueUsername(lastUsername)

        // Also ensure we don't repeat within this batch
        let batchAttempts = 0
        while (usedUsernames.has(newUsername) && batchAttempts < 10) {
          newUsername = generateUsername()
          batchAttempts++
        }

        usedUsernames.add(newUsername)
        lastUsername = newUsername

        // Generate realistic timestamp with human-like delays
        const clickTimestamp = generateRealisticTimestamp(now, i, timeLeft)

        // Store click for insertion
        botClicks.push({
          username: newUsername,
          item_name: getItemName(game.item),
          clicked_at: new Date(clickTimestamp).toISOString(),
        })

        // Trigger final phase if time < 1 minute
        if (game.status === 'active' && timeLeft <= FINAL_PHASE_THRESHOLD) {
          newEndTime = now + 60000 // Reset to 1 minute
          newStatus = 'final_phase'
          shouldSetBattleStart = true
        } else if (game.status === 'final_phase') {
          // In final phase, reset to 1 minute
          newEndTime = now + 60000
        }
      }

      // Build update data
      const updateData: Record<string, unknown> = {
        total_clicks: (game.total_clicks || 0) + clickCount,
        last_click_username: lastUsername,
        last_click_user_id: null, // Bot click = no user ID
        last_click_at: new Date().toISOString(),
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
