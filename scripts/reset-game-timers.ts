import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetGameTimers() {
  // Get all games
  const { data: games, error } = await supabase
    .from('games')
    .select('id, status')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching games:', error)
    return
  }

  console.log(`Found ${games.length} games`)

  const now = Date.now()
  
  // Distribute games across different time ranges
  for (let i = 0; i < games.length; i++) {
    const game = games[i]
    
    // Create varied end times:
    // - First 5 games: 1-5 minutes (urgent)
    // - Next 10 games: 5-30 minutes
    // - Next 20 games: 30min - 2 hours
    // - Rest: 2-24 hours
    
    let endTime: number
    
    if (i < 5) {
      // Urgent: 1-5 minutes
      endTime = Math.floor(now + (1 + Math.random() * 4) * 60 * 1000)
    } else if (i < 15) {
      // Soon: 5-30 minutes
      endTime = Math.floor(now + (5 + Math.random() * 25) * 60 * 1000)
    } else if (i < 35) {
      // Medium: 30min - 2 hours
      endTime = Math.floor(now + (30 + Math.random() * 90) * 60 * 1000)
    } else {
      // Long: 2-24 hours
      endTime = Math.floor(now + (2 + Math.random() * 22) * 60 * 60 * 1000)
    }

    const { error: updateError } = await supabase
      .from('games')
      .update({ 
        end_time: endTime,
        status: 'active'
      })
      .eq('id', game.id)

    if (updateError) {
      console.error(`Error updating game ${game.id}:`, updateError)
    }
  }

  console.log('✅ All game timers reset!')
  console.log('- 5 games: 1-5 min (urgent)')
  console.log('- 10 games: 5-30 min')
  console.log('- 20 games: 30min-2h')
  console.log('- Rest: 2-24h')
}

resetGameTimers()
