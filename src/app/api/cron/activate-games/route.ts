import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cette route peut être appelée par un cron job (Vercel, GitHub Actions, etc.)
// pour activer les jeux dont le start_time est atteint

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Clé secrète pour sécuriser l'endpoint (à définir dans .env)
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date().toISOString()

    // Trouver les jeux en attente dont le start_time est passé
    const { data: gamesToActivate, error: fetchError } = await supabase
      .from('games')
      .select('id, item:items(name), start_time')
      .eq('status', 'waiting')
      .lte('start_time', now)

    if (fetchError) {
      console.error('Error fetching games:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!gamesToActivate || gamesToActivate.length === 0) {
      return NextResponse.json({
        message: 'No games to activate',
        activated: 0,
      })
    }

    // Activer les jeux
    const gameIds = gamesToActivate.map(g => g.id)

    const { error: updateError } = await supabase
      .from('games')
      .update({ status: 'active' })
      .in('id', gameIds)

    if (updateError) {
      console.error('Error activating games:', updateError)
      return NextResponse.json({ error: 'Failed to activate games' }, { status: 500 })
    }

    // Log les jeux activés
    const getItemName = (item: unknown): string => {
      if (Array.isArray(item) && item[0]?.name) return item[0].name
      if (item && typeof item === 'object' && 'name' in item) return (item as { name: string }).name
      return 'Unknown'
    }

    const activatedNames = gamesToActivate.map(g => getItemName(g.item)).join(', ')
    console.log(`Activated ${gamesToActivate.length} games: ${activatedNames}`)

    return NextResponse.json({
      message: `Activated ${gamesToActivate.length} games`,
      activated: gamesToActivate.length,
      games: gamesToActivate.map(g => ({
        id: g.id,
        name: getItemName(g.item),
        start_time: g.start_time,
      })),
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Support POST aussi pour certains services de cron
export async function POST(request: NextRequest) {
  return GET(request)
}
