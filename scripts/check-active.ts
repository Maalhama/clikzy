import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function check() {
  const now = Date.now()
  
  // Récupérer les jeux "actifs" selon la DB
  const { data: activeGames } = await supabase
    .from('games')
    .select('id, status, end_time')
    .in('status', ['active', 'final_phase', 'waiting'])
    .limit(50)
  
  console.log('Jeux avec status actif (DB):', activeGames?.length)
  
  // Vérifier combien ont vraiment un timer > 0
  let reallyActive = 0
  let timerExpired = 0
  
  activeGames?.forEach(g => {
    if (g.end_time > now) {
      reallyActive++
    } else {
      timerExpired++
    }
  })
  
  console.log('Vraiment actifs (timer > 0):', reallyActive)
  console.log('Timer expiré mais status actif:', timerExpired)
}

check()
