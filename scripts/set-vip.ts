import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setVIP(username: string) {
  // Find user by username
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, username, is_vip')
    .ilike('username', `%${username}%`)
    .single()

  if (findError) {
    console.error('Erreur lors de la recherche:', findError.message)
    return
  }

  console.log(`Utilisateur trouvé: ${profile.username} (VIP actuel: ${profile.is_vip})`)

  // Set VIP status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      is_vip: true,
      vip_expires_at: null // VIP permanent
    })
    .eq('id', profile.id)

  if (updateError) {
    console.error('Erreur lors de la mise à jour:', updateError.message)
    return
  }

  console.log(`✅ ${profile.username} est maintenant V.I.P !`)
}

// Argument = username
const username = process.argv[2] || 'Malhamaa'
setVIP(username)
