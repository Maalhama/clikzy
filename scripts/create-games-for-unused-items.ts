import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createGamesForUnusedItems() {
  console.log('Création de jeux pour les produits non utilisés...\n')

  // Get all games with their items
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('item_id')

  if (gamesError) {
    console.error('Error fetching games:', gamesError)
    return
  }

  // Get all available items
  const { data: allItems, error: itemsError } = await supabase
    .from('items')
    .select('id, name, retail_value')

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    return
  }

  if (!games || !allItems) {
    console.log('No data found')
    return
  }

  // Find unused items
  const usedItemIds = new Set(games.map(g => g.item_id))
  const unusedItems = allItems.filter(item => !usedItemIds.has(item.id))

  console.log(`Produits déjà utilisés: ${usedItemIds.size}`)
  console.log(`Produits non utilisés: ${unusedItems.length}\n`)

  if (unusedItems.length === 0) {
    console.log('✓ Tous les produits ont déjà un jeu !')
    return
  }

  // 19h00 heure française aujourd'hui (CET = UTC+1)
  const today = new Date()
  const franceOffset = 1
  const startTime19h = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    19 - franceOffset,
    0,
    0
  ).getTime()

  const now = Date.now()
  let createdCount = 0
  let activeCount = 0
  let endedCount = 0

  for (let i = 0; i < unusedItems.length; i++) {
    const item = unusedItems[i]

    // Durées variées: 5min à 4h depuis 19h00
    const durationMinutes = 5 + Math.floor(Math.random() * 235) // 5 à 240 minutes
    const endTime = startTime19h + durationMinutes * 60 * 1000
    const isEnded = endTime <= now
    const status = isEnded ? 'ended' : 'active'

    const { error: createError } = await supabase
      .from('games')
      .insert({
        item_id: item.id,
        status,
        start_time: new Date(startTime19h).toISOString(),
        end_time: endTime,
        initial_duration: 300000,
        final_phase_duration: 60000,
        total_clicks: Math.floor(Math.random() * (isEnded ? 500 : 200)) + (isEnded ? 50 : 0),
      })

    if (createError) {
      console.error(`✗ Erreur création jeu pour "${item.name}":`, createError)
    } else {
      if (isEnded) {
        console.log(`✗ "${item.name}" (${item.retail_value}€) - TERMINÉ`)
        endedCount++
      } else {
        const minutesLeft = Math.round((endTime - now) / 60000)
        console.log(`✓ "${item.name}" (${item.retail_value}€) - ACTIF (${minutesLeft} min)`)
        activeCount++
      }
      createdCount++
    }
  }

  console.log(`\n========================================`)
  console.log(`Création terminée !`)
  console.log(`  Jeux créés: ${createdCount}`)
  console.log(`  - Actifs:   ${activeCount}`)
  console.log(`  - Terminés: ${endedCount}`)
  console.log(`========================================`)
}

createGamesForUnusedItems().catch(console.error)
