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
  // First, end all existing active games
  console.log('Ending all existing active games...')
  await supabase
    .from('games')
    .update({ status: 'ended' })
    .in('status', ['active', 'final_phase', 'waiting'])

  // Get 18 random items
  const { data: items } = await supabase
    .from('items')
    .select('id, name')
    .limit(100) // Get more to shuffle

  if (!items || items.length === 0) {
    console.log('No items found')
    return
  }

  // Shuffle and take 18
  const shuffled = items.sort(() => Math.random() - 0.5).slice(0, 18)

  console.log(`\nCreating ${shuffled.length} games with 2 minutes each:\n`)

  for (const item of shuffled) {
    const endTime = Date.now() + 2 * 60 * 1000 // 2 minutes

    const { error } = await supabase.from('games').insert({
      item_id: item.id,
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: endTime,
      initial_duration: 120000, // 2 min
      final_phase_duration: 60000,
      total_clicks: 0,
    })

    if (error) {
      console.log('❌ ' + item.name + ':', error.message)
    } else {
      console.log('✅ ' + item.name)
    }
  }

  console.log('\nDone! 18 games created with 2 minutes each.')
}

createGames()
