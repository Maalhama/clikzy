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

async function setFinalPhase() {
  // Get 2 active games
  const { data: games, error } = await supabase
    .from('games')
    .select('id, item:items(name), end_time, status')
    .in('status', ['active', 'waiting', 'final_phase'])
    .limit(2)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!games || games.length === 0) {
    console.log('No active games found')
    return
  }

  console.log('Found games:', games.map(g => g.item?.name).join(', '))

  // Set end_time to 55 seconds from now (in final phase, with time to observe)
  const now = Date.now()

  for (const game of games) {
    const newEndTime = now + 55000 // 55 seconds

    const { error: updateError } = await supabase
      .from('games')
      .update({
        end_time: newEndTime,
        status: 'final_phase'
      })
      .eq('id', game.id)

    if (updateError) {
      console.error('Update error for', game.item?.name, ':', updateError)
    } else {
      console.log('✅', game.item?.name, '-> Phase finale (50s)')
    }
  }
}

setFinalPhase()
