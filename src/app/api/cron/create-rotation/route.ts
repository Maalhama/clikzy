import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getNextRotationTime, DEFAULT_GAME_DURATION } from '@/lib/constants/rotation'

// Cette route crée les jeux pour la PROCHAINE rotation
// Les jeux sont créés en 'waiting' et apparaissent dans "Bientôt" 15min avant

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Clé secrète pour sécuriser l'endpoint
const CRON_SECRET = process.env.CRON_SECRET

// Configuration
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

    // 1. Supprimer tous les jeux terminés (nettoyage avant nouvelle rotation)
    const { data: deletedEnded } = await supabase
      .from('games')
      .delete()
      .eq('status', 'ended')
      .select('id')

    const endedCount = deletedEnded?.length || 0
    if (endedCount > 0) {
      console.log(`Cleaned up ${endedCount} ended games`)
    }

    // 2. Supprimer les anciens jeux en attente (garder la place pour la nouvelle rotation)
    const { data: deletedWaiting } = await supabase
      .from('games')
      .delete()
      .eq('status', 'waiting')
      .select('id')

    const waitingCount = deletedWaiting?.length || 0
    if (waitingCount > 0) {
      console.log(`Cleaned up ${waitingCount} old waiting games`)
    }

    // Obtenir la prochaine rotation (utilise la fonction utilitaire)
    const utcStartTime = getNextRotationTime()

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

    // Créer les jeux en status 'waiting' (seront activés par activate-games)
    const games = selectedItems.map(item => ({
      item_id: item.id,
      status: 'waiting' as const,
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

    // Calculer l'heure Paris pour le log
    const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
    })

    return NextResponse.json({
      message: `Created ${createdGames?.length || 0} games for rotation`,
      created: createdGames?.length || 0,
      cleaned: {
        ended: endedCount,
        waiting: waitingCount,
      },
      games: createdGames?.map(g => ({
        id: g.id,
        name: getItemName(g.item),
      })),
      rotation: {
        startTime: utcStartTime.toISOString(),
        endTime: new Date(endTime).toISOString(),
        parisTime: parisFormatter.format(utcStartTime),
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
