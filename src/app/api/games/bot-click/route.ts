import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API de mise à jour du LEADER affiché (simulation frontend, flair visuel).
 *
 * IMPORTANT : cette route NE contrôle PAS le timer ni la fin de partie.
 * Le cron backend (`/api/cron/bot-clicks`, toutes les minutes) est le SEUL
 * maître du cycle de vie : maintien du timer en phase finale, durée de la
 * bataille (aléatoire par partie) et clôture. Ainsi une partie vit et se
 * termine de la même façon que quelqu'un regarde ou non — avant, le frontend
 * resetait le timer chaque seconde, ce qui maintenait les parties en vie tant
 * qu'un joueur regardait, puis elles se cloturaient quand il quittait.
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

    // Met à jour UNIQUEMENT le leader affiché — pas le timer (géré par le cron backend)
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
