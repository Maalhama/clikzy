import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

/**
 * ============================================
 * CRON BOT CLICKS - Clikzy v7.0
 * ============================================
 *
 * Ce cron gère:
 * - Les clics de bots (persistés en DB avec timestamps décalés)
 * - La fin des jeux (timer = 0)
 * - La création des records de gagnants
 *
 * Fréquence: toutes les 60 secondes
 * Génère plusieurs clics répartis sur les 60 dernières secondes
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
  item: { name: string }[] | { name: string } | null
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function getItemName(item: GameData['item']): string {
  if (Array.isArray(item) && item[0]?.name) return item[0].name
  if (item && typeof item === 'object' && 'name' in item) return item.name
  return 'Unknown'
}

// Seed déterministe pour la personnalité du jeu
function getGamePersonality(gameId: string): number {
  let hash = 0
  for (let i = 0; i < gameId.length; i++) {
    const char = gameId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 0.7 + (Math.abs(hash) % 60) / 100 // 0.7 à 1.3
}

// Calcule combien de clics simuler sur les 60 dernières secondes
function calculateBotClicks(game: GameData, now: number): number {
  const timeLeft = game.end_time - now
  if (timeLeft <= 0) return 0

  const personality = getGamePersonality(game.id)

  // Phase finale (< 60s): 3-5 clics par minute
  if (timeLeft <= 60000) {
    return Math.floor(3 + Math.random() * 3 * personality)
  }

  // Active (< 15min): 2-3 clics par minute
  if (timeLeft <= 15 * 60 * 1000) {
    return Math.floor(2 + Math.random() * 2 * personality)
  }

  // Building (< 30min): 1-2 clics par minute
  if (timeLeft <= 30 * 60 * 1000) {
    return Math.floor(1 + Math.random() * 2 * personality)
  }

  // Positioning (> 30min): 0-1 clic par minute
  return Math.random() < 0.6 * personality ? 1 : 0
}

// Génère des timestamps décalés sur les 60 dernières secondes
function generateClickTimestamps(count: number, now: number): number[] {
  const timestamps: number[] = []
  for (let i = 0; i < count; i++) {
    // Répartir les clics sur les 60 dernières secondes
    // Avec un peu d'aléatoire pour le réalisme
    const offset = Math.floor((60000 / count) * i + Math.random() * (60000 / count / 2))
    timestamps.push(now - 60000 + offset)
  }
  // Trier par ordre chronologique
  return timestamps.sort((a, b) => a - b)
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
        last_click_username, last_click_user_id,
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

    console.log(`[CRON] Processing ${activeGames.length} active games`)

    const results: Array<{
      gameId: string
      action: string
      clicks?: number
    }> = []

    let totalClicks = 0

    for (const game of activeGames as GameData[]) {
      const timeLeft = game.end_time - now
      const itemName = getItemName(game.item)

      // Si timer expiré → terminer le jeu
      if (timeLeft <= 0) {
        console.log(`[CRON] Game ${game.id.substring(0, 8)} ended - timer expired`)

        const ended = await endGame(supabase, game, itemName)

        results.push({
          gameId: game.id,
          action: ended ? 'ended' : 'already_ended'
        })
        continue
      }

      // Calculer combien de clics simuler
      const clickCount = calculateBotClicks(game, now)

      if (clickCount > 0) {
        // Générer les timestamps répartis sur les 60 dernières secondes
        const timestamps = generateClickTimestamps(clickCount, now)

        let currentEndTime = game.end_time
        let currentTotalClicks = game.total_clicks
        let lastUsername = game.last_click_username

        for (let i = 0; i < clickCount; i++) {
          const clickTime = timestamps[i]

          // Générer un username unique pour ce clic
          const clickSeed = `${game.id}-${clickTime}-${i}`
          const username = generateDeterministicUsername(clickSeed)

          // Insérer le clic en DB avec le timestamp décalé
          await supabase.from('clicks').insert({
            game_id: game.id,
            username,
            is_bot: true,
            item_name: itemName,
            clicked_at: new Date(clickTime).toISOString(),
          })

          currentTotalClicks++
          lastUsername = username

          // Reset timer seulement si < 60s au moment du clic
          const clickTimeLeft = currentEndTime - clickTime
          if (clickTimeLeft <= 60000 && clickTimeLeft > 0) {
            currentEndTime = clickTime + 60000
          }
        }

        // Update le jeu avec les nouveaux clics
        const finalTimeLeft = currentEndTime - now
        const newStatus = finalTimeLeft <= 60000 ? 'final_phase' : game.status

        await supabase
          .from('games')
          .update({
            total_clicks: currentTotalClicks,
            last_click_username: lastUsername,
            end_time: currentEndTime,
            status: newStatus,
          })
          .eq('id', game.id)

        totalClicks += clickCount

        results.push({
          gameId: game.id,
          action: `${clickCount} bot clicks (spread over 60s)`,
          clicks: clickCount
        })

        console.log(`[CRON] ${game.id.substring(0, 8)}: ${clickCount} clicks, timeLeft=${Math.floor(finalTimeLeft/1000)}s`)
      } else {
        results.push({
          gameId: game.id,
          action: `active (${Math.floor(timeLeft / 1000)}s left)`,
          clicks: 0
        })
      }
    }

    const endedCount = results.filter(r => r.action === 'ended').length

    return NextResponse.json({
      message: `Processed ${results.length} games, ${totalClicks} bot clicks, ${endedCount} ended`,
      processed: results.length,
      totalClicks,
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
