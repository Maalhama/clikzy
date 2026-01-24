import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, credits, earned_credits, has_purchased_credits, last_credits_reset')
    .ilike('username', '%malhamaa%')
    .single()

  if (error) console.log('Error:', error.message)
  else console.log(JSON.stringify(data, null, 2))
}
check()
