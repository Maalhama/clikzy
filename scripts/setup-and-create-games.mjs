import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Check for items
  let { data: items } = await supabase.from('items').select('id, name').limit(5)

  // If no items, create some
  if (!items || items.length === 0) {
    console.log('No items found, creating test items...')

    const testItems = [
      { name: 'iPhone 15 Pro Max', description: 'Le dernier iPhone Apple', retail_value: 1479 },
      { name: 'PlayStation 5', description: 'Console de jeu Sony', retail_value: 549 },
      { name: 'MacBook Pro 14"', description: 'Laptop Apple M3 Pro', retail_value: 2499 },
      { name: 'AirPods Pro 2', description: 'Écouteurs sans fil Apple', retail_value: 279 },
      { name: 'Nintendo Switch OLED', description: 'Console portable Nintendo', retail_value: 349 }
    ]

    const { data: createdItems, error: createError } = await supabase
      .from('items')
      .insert(testItems)
      .select('id, name')

    if (createError) {
      console.log('Error creating items:', createError.message)
      return
    }

    items = createdItems
    console.log('Created', items.length, 'items')
  } else {
    console.log('Found', items.length, 'items')
  }

  // Clean old ended games
  await supabase.from('games').delete().eq('status', 'ended')

  const now = Date.now()
  const games = [
    { item_id: items[0].id, status: 'active', end_time: now + 2 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() },
    { item_id: items[1 % items.length].id, status: 'active', end_time: now + 5 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() },
    { item_id: items[2 % items.length].id, status: 'active', end_time: now + 10 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() },
    { item_id: items[3 % items.length].id, status: 'active', end_time: now + 20 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() }
  ]

  const { data, error } = await supabase.from('games').insert(games).select('id, end_time')
  if (error) {
    console.log('Error creating games:', error.message)
  } else {
    console.log('Created', data.length, 'games:')
    data.forEach((g, i) => {
      const mins = Math.round((g.end_time - now) / 60000)
      console.log(`  - Game ${i + 1}: ${mins} minutes`)
    })
  }
}

main()
