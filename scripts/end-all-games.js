#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function endAllGames() {
  // Get all non-ended games
  const { data: games, error } = await supabase
    .from('games')
    .select('id, item:items(name), status')
    .neq('status', 'ended')

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!games || games.length === 0) {
    console.log('No active games found')
    return
  }

  console.log(`Found ${games.length} active games to end`)

  for (const game of games) {
    const { error: updateError } = await supabase
      .from('games')
      .update({
        status: 'ended',
        end_time: Date.now() - 60000 // Set end time to 1 minute ago
      })
      .eq('id', game.id)

    if (updateError) {
      console.error('Error ending', game.item?.name, ':', updateError)
    } else {
      console.log('✅ Ended:', game.item?.name)
    }
  }
}

endAllGames()
