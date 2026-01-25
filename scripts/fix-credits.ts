import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fix() {
  // Add 100 earned_credits to Mehdijouez
  const { data: current } = await supabase
    .from('profiles')
    .select('username, credits, earned_credits')
    .ilike('username', '%mehdijouez%')
    .single()

  if (!current) {
    console.log('User not found')
    return
  }

  console.log('Current:', current)

  const { data, error } = await supabase
    .from('profiles')
    .update({
      earned_credits: (current.earned_credits || 0) + 100
    })
    .ilike('username', '%mehdijouez%')
    .select('username, credits, earned_credits')

  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Fixed! New values:', data)
  }
}
fix()
