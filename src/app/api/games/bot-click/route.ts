import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API pour enregistrer un clic de bot dans la DB
 * Appelé par la simulation frontend pour synchroniser avec le lobby
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { gameId, username } = await request.json()

    if (!gameId || !username) {
      return NextResponse.json({ error: 'Missing gameId or username' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Mettre à jour le leader du jeu
    const { error } = await supabase
      .from('games')
      .update({
        last_click_username: username,
        last_click_user_id: null, // Bot, pas un vrai joueur
      })
      .eq('id', gameId)
      .in('status', ['active', 'final_phase'])

    if (error) {
      console.error('[BOT-CLICK API] Error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true, username })
  } catch (error) {
    console.error('[BOT-CLICK API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
