import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/clicks/recent
 * Fetches the most recent clicks for the live feed
 *
 * Query params:
 * - limit: number of clicks to return (default: 20, max: 50)
 * - game_id: optional filter by game ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const gameId = searchParams.get('game_id')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('clicks')
      .select('id, game_id, username, item_name, is_bot, clicked_at')
      .order('clicked_at', { ascending: false })
      .limit(limit)

    if (gameId) {
      query = query.eq('game_id', gameId)
    }

    const { data: clicks, error } = await query

    if (error) {
      console.error('Error fetching recent clicks:', error)
      return NextResponse.json({ error: 'Failed to fetch clicks' }, { status: 500 })
    }

    // Transform to match the expected format for LiveClicksFeed
    const formattedClicks = (clicks || []).map(click => ({
      id: click.id,
      username: click.username || 'Anonyme',
      game_id: click.game_id,
      item_name: click.item_name || 'Produit',
      is_bot: click.is_bot,
      timestamp: new Date(click.clicked_at).getTime(),
    }))

    return NextResponse.json({
      clicks: formattedClicks,
      count: formattedClicks.length,
    })
  } catch (error) {
    console.error('Error in recent clicks API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
