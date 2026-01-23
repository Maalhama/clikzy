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

    // Vérifier si le jeu est en phase finale pour étendre le timer
    const { data: game } = await supabase
      .from('games')
      .select('status, end_time')
      .eq('id', gameId)
      .single()

    const now = Date.now()
    const isInFinalPhase = game?.status === 'final_phase' || (game?.end_time && game.end_time - now <= 120000)

    // Mettre à jour le leader du jeu et étendre le timer si en phase finale
    const updateData: Record<string, unknown> = {
      last_click_username: username,
      last_click_user_id: null, // Bot, pas un vrai joueur
    }

    if (isInFinalPhase) {
      updateData.end_time = now + 90000 // Étendre le timer à 90s
    }

    const { error } = await supabase
      .from('games')
      .update(updateData)
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
