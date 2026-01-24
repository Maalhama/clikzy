import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fix() {
  // Restore Malhamaa's credits - they had 50+ before the migration issue
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      credits: 10,  // Daily credits
      earned_credits: 50  // Restore earned credits
    })
    .ilike('username', '%malhamaa%')
    .select('username, credits, earned_credits')

  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Fixed! New values:', data)
  }
}
fix()
