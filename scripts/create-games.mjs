import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fldpvitgaenxzqfmqcmc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Clean old ended games
  await supabase.from('games').delete().eq('status', 'ended')

  // Get items
  const { data: items } = await supabase.from('items').select('id, name').limit(5)
  if (!items || items.length === 0) {
    console.log('No items found')
    return
  }

  console.log('Found', items.length, 'items')

  const now = Date.now()
  const games = [
    { item_id: items[0].id, status: 'active', end_time: now + 2 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() },
    { item_id: items[1 % items.length].id, status: 'active', end_time: now + 5 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() },
    { item_id: items[2 % items.length].id, status: 'active', end_time: now + 10 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() },
    { item_id: items[3 % items.length].id, status: 'active', end_time: now + 20 * 60 * 1000, total_clicks: 0, created_at: new Date().toISOString() }
  ]

  const { data, error } = await supabase.from('games').insert(games).select('id, end_time')
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Created', data.length, 'games: 2min, 5min, 10min, 20min')
  }
}

main()
