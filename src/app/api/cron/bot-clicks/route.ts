import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * ============================================
 * CRON DE GESTION DES JEUX - Clikzy v5.0
 * ============================================
 *
 * Ce cron ne fait plus de clics de bots.
 * Les clics sont simulés côté FRONTEND (useBotSimulation).
 *
 * Ce cron gère uniquement:
 * - La fin des jeux (timer = 0)
 * - La création des records de gagnants
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

    console.log(`[CRON] Checking ${activeGames.length} games for completion`)

    const results: Array<{
      gameId: string
      action: string
    }> = []

    for (const game of activeGames as GameData[]) {
      const timeLeft = game.end_time - now

      // Si timer expiré → terminer le jeu
      if (timeLeft <= 0) {
        const itemName = getItemName(game.item)

        console.log(`[CRON] Game ${game.id.substring(0, 8)} ended - timer expired`)

        const ended = await endGame(supabase, game, itemName)

        results.push({
          gameId: game.id,
          action: ended ? 'ended' : 'already_ended'
        })
      } else {
        results.push({
          gameId: game.id,
          action: `active (${Math.floor(timeLeft / 1000)}s left)`
        })
      }
    }

    const endedCount = results.filter(r => r.action === 'ended').length

    return NextResponse.json({
      message: `Checked ${results.length} games, ended ${endedCount}`,
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
