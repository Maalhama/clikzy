import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateUsername } from '@/lib/bots/usernameGenerator'

/**
 * Server-side bot system that simulates clicks on active games
 * This writes to the database so clicks persist across page loads
 *
 * Called by cron job every minute
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CRON_SECRET = process.env.CRON_SECRET

// Configuration
const FINAL_PHASE_THRESHOLD = 60 * 1000 // 1 minute - when to trigger final phase
const FINAL_PHASE_DURATION = 60 * 1000 // 1 minute final phase
const MIN_CLICKS_PER_GAME = 1
const MAX_CLICKS_PER_GAME = 5
const CLICK_CHANCE = 0.7 // 70% chance a game gets bot clicks

export async function GET(request: NextRequest) {
  // Verify authentication
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()

    // Get all active games (not ended, not waiting)
    const { data: activeGames, error: fetchError } = await supabase
      .from('games')
      .select('id, item_id, status, end_time, total_clicks, last_click_username, item:items(name)')
      .in('status', ['active', 'final_phase'])

    if (fetchError) {
      console.error('Error fetching games:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!activeGames || activeGames.length === 0) {
      return NextResponse.json({
        message: 'No active games',
        processed: 0,
      })
    }

    const results: Array<{
      gameId: string
      itemName: string
      clicks: number
      newStatus?: string
      winner?: string
    }> = []

    for (const game of activeGames) {
      // Skip some games randomly for more natural distribution
      if (Math.random() > CLICK_CHANCE) {
        continue
      }

      const endTime = game.end_time as number
      const timeRemaining = endTime - now

      // If game has ended, determine winner
      if (timeRemaining <= 0) {
        const winnerUsername = game.last_click_username || 'Champion'

        // Update game to ended status
        await supabase
          .from('games')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
          })
          .eq('id', game.id)

        results.push({
          gameId: game.id,
          itemName: getItemName(game.item),
          clicks: 0,
          newStatus: 'ended',
          winner: winnerUsername,
        })
        continue
      }

      // Generate bot clicks
      const clickCount = MIN_CLICKS_PER_GAME + Math.floor(Math.random() * (MAX_CLICKS_PER_GAME - MIN_CLICKS_PER_GAME + 1))

      let lastUsername = game.last_click_username
      let newEndTime = endTime
      let newStatus = game.status

      for (let i = 0; i < clickCount; i++) {
        const botUsername = generateUsername()
        lastUsername = botUsername

        // Check if we should trigger final phase
        const currentTimeRemaining = newEndTime - now

        if (game.status === 'active' && currentTimeRemaining <= FINAL_PHASE_THRESHOLD) {
          // Trigger final phase
          newEndTime = now + FINAL_PHASE_DURATION
          newStatus = 'final_phase'
        } else if (game.status === 'final_phase') {
          // In final phase, each click extends by a bit (5-15 seconds)
          const extension = 5000 + Math.floor(Math.random() * 10000)
          newEndTime = Math.min(newEndTime + extension, now + FINAL_PHASE_DURATION)
        }
      }

      // Update game with bot clicks
      const { error: updateError } = await supabase
        .from('games')
        .update({
          total_clicks: (game.total_clicks || 0) + clickCount,
          last_click_username: lastUsername,
          last_click_at: new Date().toISOString(),
          end_time: newEndTime,
          status: newStatus,
        })
        .eq('id', game.id)

      if (updateError) {
        console.error(`Error updating game ${game.id}:`, updateError)
        continue
      }

      results.push({
        gameId: game.id,
        itemName: getItemName(game.item),
        clicks: clickCount,
        newStatus: newStatus !== game.status ? newStatus : undefined,
      })
    }

    const totalClicks = results.reduce((sum, r) => sum + r.clicks, 0)

    console.log(`Bot clicks: ${totalClicks} clicks across ${results.length} games`)

    return NextResponse.json({
      message: `Processed ${results.length} games with ${totalClicks} bot clicks`,
      processed: results.length,
      totalClicks,
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
