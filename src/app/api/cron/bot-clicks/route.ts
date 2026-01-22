import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * ============================================
 * CRON DE GESTION DES JEUX - Clikzy v9.0
 * ============================================
 *
 * Ce cron gère:
 * - La mise à jour des leaders (last_click_username) pour simuler l'activité
 * - La fin des jeux (timer = 0)
 * - La création des records de gagnants
 *
 * Les clics visuels sont simulés côté FRONTEND.
 * Le cron maintient l'état DB pour la persistance entre visites.
 *
 * Fréquence: toutes les 60 secondes
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
  item: { name: string }[] | { name: string } | null
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

        // Mettre à jour le status si nécessaire
        if (timeLeft <= 60000 && game.status !== 'final_phase') {
          updates.status = 'final_phase'
        }

        // Simuler un clic de bot SEULEMENT si le dernier clic n'est pas d'un joueur réel
        // (last_click_user_id = null signifie que c'est un bot ou pas de clic)
        if (!game.last_click_user_id) {
          const minuteSeed = Math.floor(now / 60000)
          const botUsername = generateDeterministicUsername(`${game.id}-cron-${minuteSeed}`)

          updates.last_click_username = botUsername

          // En phase finale, reset le timer aussi
          if (timeLeft <= 60000) {
            updates.end_time = now + 60000
            action = `bot_click_final (${botUsername})`
          } else {
            action = `bot_click (${botUsername})`
          }
        } else {
          // Un joueur réel est leader - on ne fait rien
          action = `real_player_leading (${game.last_click_username})`
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
