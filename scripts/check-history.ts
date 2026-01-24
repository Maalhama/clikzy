import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // Get user ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, credits, earned_credits')
    .ilike('username', '%malhamaa%')
    .single()

  if (!profile) {
    console.log('User not found')
    return
  }

  console.log('=== PROFILE ===')
  console.log(profile)

  // Check mini-game plays
  console.log('\n=== MINI-GAME PLAYS (last 20) ===')
  const { data: miniGames } = await supabase
    .from('mini_game_plays')
    .select('game_type, credits_won, is_free_play, played_at')
    .eq('user_id', profile.id)
    .order('played_at', { ascending: false })
    .limit(20)

  console.log(miniGames)

  // Sum of mini-game winnings
  const { data: allMiniGames } = await supabase
    .from('mini_game_plays')
    .select('credits_won')
    .eq('user_id', profile.id)

  const totalWon = allMiniGames?.reduce((sum, g) => sum + g.credits_won, 0) || 0
  console.log('\nTotal credits won from mini-games:', totalWon)

  // Check clicks (credits spent)
  console.log('\n=== CLICKS (last 20) ===')
  const { data: clicks } = await supabase
    .from('clicks')
    .select('game_id, credits_spent, clicked_at')
    .eq('user_id', profile.id)
    .order('clicked_at', { ascending: false })
    .limit(20)

  console.log(clicks)

  // Total clicks spent
  const { data: allClicks } = await supabase
    .from('clicks')
    .select('credits_spent')
    .eq('user_id', profile.id)

  const totalSpent = allClicks?.reduce((sum, c) => sum + c.credits_spent, 0) || 0
  console.log('\nTotal credits spent on clicks:', totalSpent)
}
check()
