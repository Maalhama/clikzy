import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDuplicateGames() {
  console.log('Vérification des doublons...\n')

  // Get all games with their items
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, item_id')

  if (gamesError) {
    console.error('Error fetching games:', gamesError)
    return
  }

  // Get all available items
  const { data: allItems, error: itemsError } = await supabase
    .from('items')
    .select('id, name')

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    return
  }

  if (!games || !allItems) {
    console.log('No data found')
    return
  }

  console.log(`Total jeux: ${games.length}`)
  console.log(`Total produits disponibles: ${allItems.length}\n`)

  // Find duplicates
  const itemUsage = new Map<string, string[]>() // item_id -> game_ids[]

  for (const game of games) {
    const existing = itemUsage.get(game.item_id) || []
    existing.push(game.id)
    itemUsage.set(game.item_id, existing)
  }

  // Find items used more than once
  const duplicates: { itemId: string; gameIds: string[] }[] = []
  for (const [itemId, gameIds] of itemUsage) {
    if (gameIds.length > 1) {
      duplicates.push({ itemId, gameIds })
    }
  }

  if (duplicates.length === 0) {
    console.log('✓ Aucun doublon trouvé !')
    return
  }

  console.log(`⚠ ${duplicates.length} produits sont utilisés plusieurs fois:\n`)

  // Find unused items
  const usedItemIds = new Set(games.map(g => g.item_id))
  const unusedItems = allItems.filter(item => !usedItemIds.has(item.id))

  console.log(`Produits non utilisés disponibles: ${unusedItems.length}\n`)

  // Fix duplicates
  let unusedIndex = 0
  let fixedCount = 0

  for (const dup of duplicates) {
    const item = allItems.find(i => i.id === dup.itemId)
    console.log(`Produit "${item?.name}" utilisé ${dup.gameIds.length} fois`)

    // Keep the first game, replace items in others
    for (let i = 1; i < dup.gameIds.length; i++) {
      if (unusedIndex >= unusedItems.length) {
        console.log(`  ⚠ Plus de produits disponibles pour remplacer`)
        break
      }

      const newItem = unusedItems[unusedIndex]
      unusedIndex++

      const { error: updateError } = await supabase
        .from('games')
        .update({ item_id: newItem.id })
        .eq('id', dup.gameIds[i])

      if (updateError) {
        console.error(`  ✗ Erreur mise à jour game ${dup.gameIds[i]}:`, updateError)
      } else {
        console.log(`  ✓ Game ${dup.gameIds[i].slice(0, 8)}... → "${newItem.name}"`)
        fixedCount++
      }
    }
  }

  console.log(`\n========================================`)
  console.log(`Correction terminée !`)
  console.log(`  Doublons corrigés: ${fixedCount}`)
  console.log(`========================================`)
}

fixDuplicateGames().catch(console.error)
