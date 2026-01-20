import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cette route est appelée par Vercel Cron toutes les 3 heures
// pour créer les jeux de la nouvelle rotation

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Clé secrète pour sécuriser l'endpoint
const CRON_SECRET = process.env.CRON_SECRET

// Configuration
const TIMEZONE = 'Europe/Paris'
const DEFAULT_GAME_DURATION = 1 * 60 * 60 * 1000 // 1 heure
const GAMES_PER_ROTATION = 18

export async function GET(request: NextRequest) {
  // Vérifier l'authentification (Vercel Cron envoie un header spécial)
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date()

    // Calculer le start_time (maintenant, arrondi à l'heure)
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
    const startTime = new Date(parisTime)
    startTime.setMinutes(0, 0, 0)

    // Convertir en UTC pour stockage
    const parisOffset = getParisOffset(startTime)
    const utcStartTime = new Date(startTime.getTime() - parisOffset)

    // Calculer end_time (1h après start_time)
    const endTime = utcStartTime.getTime() + DEFAULT_GAME_DURATION

    // Récupérer des items disponibles
    const { data: availableItems, error: itemsError } = await supabase
      .from('items')
      .select('id, name')
      .limit(50)

    if (itemsError) {
      console.error('Error fetching items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    if (!availableItems || availableItems.length === 0) {
      return NextResponse.json({ error: 'No items available' }, { status: 400 })
    }

    // Vérifier les items qui ont déjà un jeu actif ou en attente
    const { data: existingGames } = await supabase
      .from('games')
      .select('item_id')
      .in('status', ['waiting', 'active', 'final_phase'])

    const usedItemIds = new Set((existingGames || []).map(g => g.item_id))
    const freeItems = availableItems.filter(item => !usedItemIds.has(item.id))

    if (freeItems.length === 0) {
      return NextResponse.json({
        message: 'All items already have active games',
        created: 0
      })
    }

    // Sélectionner aléatoirement des items
    const shuffled = freeItems.sort(() => Math.random() - 0.5)
    const selectedItems = shuffled.slice(0, Math.min(GAMES_PER_ROTATION, shuffled.length))

    // Créer les jeux
    const games = selectedItems.map(item => ({
      item_id: item.id,
      status: 'active' as const,
      start_time: utcStartTime.toISOString(),
      end_time: endTime,
      initial_duration: DEFAULT_GAME_DURATION,
      total_clicks: 0,
    }))

    const { data: createdGames, error: createError } = await supabase
      .from('games')
      .insert(games)
      .select('id, item:items(name), status')

    if (createError) {
      console.error('Error creating games:', createError)
      return NextResponse.json({ error: 'Failed to create games' }, { status: 500 })
    }

    // Log les jeux créés
    const getItemName = (item: unknown): string => {
      if (Array.isArray(item) && item[0]?.name) return item[0].name
      if (item && typeof item === 'object' && 'name' in item) return (item as { name: string }).name
      return 'Unknown'
    }

    const createdNames = createdGames?.map(g => getItemName(g.item)).join(', ') || ''
    console.log(`Created ${createdGames?.length || 0} games: ${createdNames}`)

    return NextResponse.json({
      message: `Created ${createdGames?.length || 0} games for rotation`,
      created: createdGames?.length || 0,
      games: createdGames?.map(g => ({
        id: g.id,
        name: getItemName(g.item),
      })),
      rotation: {
        startTime: utcStartTime.toISOString(),
        endTime: new Date(endTime).toISOString(),
        parisHour: parisTime.getHours(),
      }
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Support POST aussi
export async function POST(request: NextRequest) {
  return GET(request)
}

/**
 * Obtient le décalage horaire de Paris (en ms)
 */
function getParisOffset(date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const parisDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return parisDate.getTime() - utcDate.getTime()
}
