import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function check() {
  // Simuler la logique du serveur
  const now = new Date()
  const parisHour = parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    hour12: false,
  }).format(now), 10)

  const resetTime = new Date(now)
  if (parisHour >= 19) {
    resetTime.setHours(now.getHours() - parisHour + 19, 0, 0, 0)
  } else {
    resetTime.setDate(resetTime.getDate() - 1)
    resetTime.setHours(now.getHours() - parisHour + 19, 0, 0, 0)
  }

  console.log('Reset time (timestamp):', resetTime.getTime())
  
  const { data, error } = await supabase
    .from('games')
    .select('id, status, end_time')
    .eq('status', 'ended')
    .gte('end_time', resetTime.getTime())
  
  if (error) console.log('Error:', error)
  console.log('Jeux ended après reset:', data?.length || 0)
}

check()
