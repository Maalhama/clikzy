import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: items } = await supabase
    .from('items')
    .select('id, name')
    .limit(3)

  if (!items || items.length === 0) {
    console.log('No items found')
    return
  }

  console.log('Creating 3 games with 2 minutes each:')

  for (const item of items) {
    const endTime = Date.now() + 2 * 60 * 1000

    const { error } = await supabase.from('games').insert({
      item_id: item.id,
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: endTime,
      initial_duration: 120000,
      final_phase_duration: 60000,
      total_clicks: 0,
    })

    if (error) {
      console.log('Error ' + item.name + ': ' + error.message)
    } else {
      console.log('OK ' + item.name + ' (2 min)')
    }
  }

  console.log('Done!')
}

main()
