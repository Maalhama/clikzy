import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getNextRotationTime, DEFAULT_GAME_DURATION } from '@/lib/constants/rotation'

// Cette route crée les jeux pour la PROCHAINE rotation
// Les jeux sont créés en 'waiting' et apparaissent dans "Bientôt" 15min avant

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Clé secrète pour sécuriser l'endpoint
const CRON_SECRET = process.env.CRON_SECRET

// Configuration
const GAMES_PER_ROTATION = 18
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000 // 2 secondes, doublé à chaque retry

// Fonction utilitaire pour attendre
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Exécute la logique principale avec retry en cas de rate limit
async function executeWithRetry(
  supabase: SupabaseClient,
  retryCount = 0
): Promise<NextResponse> {
  try {
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

    // 2. Supprimer les anciens jeux en attente (garder la place pour la nouvelle
    // rotation) — UNIQUEMENT ceux de plus de 30 min : un jeu waiting fraîchement
    // créé qui n'a pas encore été activé (cron bot-clicks en retard) est préservé.
    const { data: deletedWaiting } = await supabase
      .from('games')
      .delete()
      .eq('status', 'waiting')
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .select('id')

    const waitingCount = deletedWaiting?.length || 0
    if (waitingCount > 0) {
      console.log(`Cleaned up ${waitingCount} old waiting games`)
    }

    // Obtenir la prochaine rotation (utilise la fonction utilitaire)
    const utcStartTime = getNextRotationTime()

    // end_time est calculé PAR PARTIE plus bas (échelonné aléatoirement) pour
    // désynchroniser les fins — sinon toutes les parties d'une rotation se terminent
    // au même instant et les victoires se groupent.

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

    const usedItemIds = new Set((existingGames || []).map((g: { item_id: string }) => g.item_id))
    const freeItems = availableItems.filter((item: { id: string }) => !usedItemIds.has(item.id))

    if (freeItems.length === 0) {
      return NextResponse.json({
        message: 'All items already have active games',
        created: 0
      })
    }

    // Sélectionner aléatoirement des items
    const shuffled = freeItems.sort(() => Math.random() - 0.5)
    const selectedItems = shuffled.slice(0, Math.min(GAMES_PER_ROTATION, shuffled.length))

    // Créer les jeux en status 'waiting' (activés par le cron bot-clicks)
    // end_time ÉCHELONNÉ par partie : durée de base (1h) + décalage aléatoire de 0 à 90 min.
    // Les 18 parties d'une rotation se terminent ainsi à des moments différents
    // (~1 toutes les 5 min) au lieu de toutes ensemble. La bataille finale (30min-1h59)
    // ajoute encore de la dispersion par-dessus.
    const STAGGER_MAX_MS = 90 * 60 * 1000 // 90 min
    const games = selectedItems.map((item: { id: string }) => ({
      item_id: item.id,
      status: 'waiting' as const,
      start_time: utcStartTime.toISOString(),
      end_time: utcStartTime.getTime() + DEFAULT_GAME_DURATION + Math.floor(Math.random() * STAGGER_MAX_MS),
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

    const createdNames = createdGames?.map((g: { item: unknown }) => getItemName(g.item)).join(', ') || ''
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
      games: createdGames?.map((g: { id: string; item: unknown }) => ({
        id: g.id,
        name: getItemName(g.item),
      })),
      rotation: {
        startTime: utcStartTime.toISOString(),
        endTime: 'échelonné par partie (base 1h + 0 à 90 min aléatoire)',
        parisTime: parisFormatter.format(utcStartTime),
      }
    })
  } catch (error: unknown) {
    // Vérifier si c'est une erreur de rate limit
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('Too Many Requests')

    if (isRateLimitError && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount)
      console.log(`Rate limit hit, retrying in ${delay}ms... (${MAX_RETRIES - retryCount} retries left)`)
      await sleep(delay)
      return executeWithRetry(supabase, retryCount + 1)
    }

    throw error
  }
}

export async function GET(request: NextRequest) {
  // Auth fail-closed : CRON_SECRET obligatoire. Le header x-vercel-cron est forgeable → on ne s'y fie pas.
  const authHeader = request.headers.get('authorization')

  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    return await executeWithRetry(supabase)
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Support POST aussi
export async function POST(request: NextRequest) {
  return GET(request)
}
