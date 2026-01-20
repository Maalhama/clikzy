import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixDuplicateItems() {
  // Get all items
  const { data: items, error } = await supabase
    .from('items')
    .select('id, name, retail_value, created_at')
    .order('name')
    .order('created_at')

  if (error) {
    console.error('Error fetching items:', error)
    return
  }

  // Find duplicates by name
  const itemsByName = new Map<string, any[]>()
  items.forEach(item => {
    if (!itemsByName.has(item.name)) {
      itemsByName.set(item.name, [])
    }
    itemsByName.get(item.name)!.push(item)
  })

  console.log('=== ITEMS EN DOUBLE ===')
  const itemsToDelete: string[] = []
  const gamesToDelete: string[] = []

  for (const [name, itemList] of itemsByName) {
    if (itemList.length > 1) {
      console.log(`\n${name} (${itemList.length} occurrences):`)

      // Keep the first one (oldest), delete the rest
      itemList.forEach((item, idx) => {
        const mark = idx === 0 ? '✓ GARDER' : '✗ SUPPRIMER'
        console.log(`  ${mark} - ID: ${item.id}`)
        if (idx > 0) {
          itemsToDelete.push(item.id)
        }
      })
    }
  }

  if (itemsToDelete.length === 0) {
    console.log('Aucun item en double')
    return
  }

  console.log(`\n${itemsToDelete.length} items à supprimer`)

  // Find games for these items
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, item_id')
    .in('item_id', itemsToDelete)

  if (gamesError) {
    console.error('Error fetching games:', gamesError)
    return
  }

  const gameIds = games.map(g => g.id)
  console.log(`${gameIds.length} games associées à supprimer`)

  // Delete clicks for these games
  if (gameIds.length > 0) {
    const { error: clicksError } = await supabase
      .from('clicks')
      .delete()
      .in('game_id', gameIds)

    if (clicksError) {
      console.error('Error deleting clicks:', clicksError)
      return
    }
    console.log('✓ Clicks supprimés')
  }

  // Delete games
  if (gameIds.length > 0) {
    const { error: delGamesError } = await supabase
      .from('games')
      .delete()
      .in('id', gameIds)

    if (delGamesError) {
      console.error('Error deleting games:', delGamesError)
      return
    }
    console.log('✓ Games supprimées')
  }

  // Delete duplicate items
  const { error: delItemsError } = await supabase
    .from('items')
    .delete()
    .in('id', itemsToDelete)

  if (delItemsError) {
    console.error('Error deleting items:', delItemsError)
    return
  }
  console.log('✓ Items en double supprimés')

  // Final count
  const { count } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })

  console.log(`\n=== RÉSULTAT ===`)
  console.log(`Total games restantes: ${count}`)
}

fixDuplicateItems()
