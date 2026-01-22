import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fldpvitgaenxzqfmqcmc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Clean old ended games
  await supabase.from('games').delete().eq('status', 'ended')
  
  // Get items
  const { data: items } = await supabase.from('items').select('id, name').limit(3)
  if (!items || items.length === 0) {
    console.log('No items found')
    return
  }
  
  const now = Date.now()
  const games = [
    {
      item_id: items[0].id,
      status: 'active',
      end_time: now + 3 * 60 * 1000,
      total_clicks: 0,
      created_at: new Date().toISOString(),
    },
    {
      item_id: items[1 % items.length].id,
      status: 'active',
      end_time: now + 5 * 60 * 1000,
      total_clicks: 0,
      created_at: new Date().toISOString(),
    },
    {
      item_id: items[2 % items.length].id,
      status: 'active',
      end_time: now + 10 * 60 * 1000,
      total_clicks: 0,
      created_at: new Date().toISOString(),
    }
  ]
  
  const { data, error } = await supabase.from('games').insert(games).select()
  if (error) {
    console.log('Error:', error)
  } else {
    console.log('Created', data.length, 'test games (3, 5, 10 min)')
  }
}

main().catch(console.error)
