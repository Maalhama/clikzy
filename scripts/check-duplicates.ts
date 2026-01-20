import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkDuplicatesAndItems() {
  // Get all games with items
  const { data: games, error } = await supabase
    .from('games')
    .select('id, status, item_id, items(id, name)')
    .order('item_id')

  if (error) {
    console.error('Error:', error)
    return
  }

  // Find duplicates by item_id
  const itemCounts = new Map<string, any[]>()
  games.forEach(game => {
    const itemId = game.item_id
    if (!itemCounts.has(itemId)) {
      itemCounts.set(itemId, [])
    }
    itemCounts.get(itemId)!.push(game)
  })

  console.log('=== DOUBLONS DE GAMES ===')
  let duplicateCount = 0
  const duplicateGameIds: string[] = []

  itemCounts.forEach((gamesList, itemId) => {
    if (gamesList.length > 1) {
      duplicateCount++
      const itemName = (gamesList[0].items as any)?.name || 'Unknown'
      console.log(`\nItem: ${itemName} (id: ${itemId})`)
      // Keep the first one, mark others for deletion
      gamesList.forEach((g, idx) => {
        const mark = idx === 0 ? '✓ GARDER' : '✗ SUPPRIMER'
        console.log(`  ${mark} - Game ${g.id} (status: ${g.status})`)
        if (idx > 0) {
          duplicateGameIds.push(g.id)
        }
      })
    }
  })

  if (duplicateCount === 0) {
    console.log('Aucun doublon trouvé')
  } else {
    console.log(`\n${duplicateCount} items avec doublons`)
    console.log(`${duplicateGameIds.length} games à supprimer`)
  }

  console.log(`\nTotal games: ${games.length}`)

  // List all unique item names
  console.log('\n\n=== LISTE DES ITEMS (noms uniques) ===')
  const uniqueItems = new Map<string, string>()
  games.forEach(game => {
    const item = game.items as any
    if (item && !uniqueItems.has(item.id)) {
      uniqueItems.set(item.id, item.name)
    }
  })

  const sortedNames = Array.from(uniqueItems.values()).sort()
  sortedNames.forEach(name => {
    console.log(`- ${name}`)
  })
  console.log(`\nTotal items uniques: ${uniqueItems.size}`)

  // Delete duplicates if found
  if (duplicateGameIds.length > 0) {
    console.log('\n\n=== SUPPRESSION DES DOUBLONS ===')

    // First delete clicks for these games
    const { error: clicksError } = await supabase
      .from('clicks')
      .delete()
      .in('game_id', duplicateGameIds)

    if (clicksError) {
      console.error('Error deleting clicks:', clicksError)
    } else {
      console.log(`Clicks supprimés pour ${duplicateGameIds.length} games`)
    }

    // Then delete the games
    const { error: gamesError } = await supabase
      .from('games')
      .delete()
      .in('id', duplicateGameIds)

    if (gamesError) {
      console.error('Error deleting games:', gamesError)
    } else {
      console.log(`${duplicateGameIds.length} games doublons supprimés`)
    }
  }
}

checkDuplicatesAndItems()
