import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createGames() {
  // Get 5 random items
  const { data: items } = await supabase
    .from('items')
    .select('id, name')
    .limit(5)

  if (!items || items.length === 0) {
    console.log('No items found')
    return
  }

  console.log('Creating games for:')

  for (const item of items) {
    const endTime = Date.now() + 30 * 60 * 1000 // 30 min

    const { error } = await supabase.from('games').insert({
      item_id: item.id,
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: endTime,
      initial_duration: 1800000,
      final_phase_duration: 60000,
      total_clicks: 0,
    })

    if (error) {
      console.log('Error for ' + item.name + ':', error.message)
    } else {
      console.log('✅ ' + item.name)
    }
  }

  console.log('\nDone! Check http://localhost:3000/lobby')
}

createGames()
