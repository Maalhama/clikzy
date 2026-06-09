// Test E2E I8 : un utilisateur authentifié ne peut plus insérer de clic avec
// user_id NULL (faux clic de bot). Il ne peut insérer qu'un clic à son propre nom.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

const email = `i8test_${Date.now()}@cleekzy-test.local`
const password = 'Test-I8-Passw0rd!'
let userId
const results = []
const log = (n, p, d) => { results.push(p); console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }

try {
  // un game_id réel pour respecter la FK clicks.game_id
  const { data: game } = await admin.from('games').select('id').limit(1).single()
  if (!game) throw new Error('aucune partie en base pour le test FK')

  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (cErr) throw new Error('createUser: ' + cErr.message)
  userId = created.user.id

  const userClient = createClient(url, anon)
  const { error: sErr } = await userClient.auth.signInWithPassword({ email, password })
  if (sErr) throw new Error('signIn: ' + sErr.message)

  // A — insert clic user_id NULL (faux bot) doit ÉCHOUER
  const { error: aErr } = await userClient.from('clicks').insert({
    game_id: game.id, user_id: null, username: 'FAKEBOT', item_name: 'X', is_bot: true, sequence_number: 999999, credits_spent: 0,
  })
  log('A. insert clic user_id NULL (faux bot) bloqué', !!aErr, aErr ? aErr.code || aErr.message : 'AUCUNE erreur (FAILLE)')

  // B — insert clic au nom d'un AUTRE user doit ÉCHOUER
  const { error: bErr } = await userClient.from('clicks').insert({
    game_id: game.id, user_id: '00000000-0000-0000-0000-000000000000', username: 'spoof', item_name: 'X', is_bot: false, sequence_number: 999998, credits_spent: 1,
  })
  log('B. insert clic au nom d\'autrui bloqué', !!bErr, bErr ? bErr.code || bErr.message : 'AUCUNE erreur (FAILLE)')

  // C — insert son PROPRE clic doit RÉUSSIR
  const { error: cErr2 } = await userClient.from('clicks').insert({
    game_id: game.id, user_id: userId, username: 'moi', item_name: 'X', is_bot: false, sequence_number: 999997, credits_spent: 1,
  })
  log('C. insert son propre clic autorisé', !cErr2, cErr2 ? cErr2.message : 'OK')
} catch (e) {
  log('FATAL', false, e.message)
} finally {
  if (userId) {
    await admin.from('clicks').delete().eq('user_id', userId)
    await admin.auth.admin.deleteUser(userId)
  }
  const ok = results.length > 0 && results.every(Boolean)
  console.log('\n=== ' + (ok ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(ok ? 0 : 1)
}
