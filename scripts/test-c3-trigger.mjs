// Test E2E du durcissement C3 : le trigger protect_profile_sensitive_columns
// doit BLOQUER les écritures authentifiées de colonnes protégées, AUTORISER les
// colonnes non protégées (username), et ne pas casser les RPC DEFINER.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
const email = `c3test_${Date.now()}@cleekzy-test.local`
const password = 'Test-C3-Passw0rd!'

let userId
const results = []
const log = (name, pass, detail) => { results.push({ name, pass }); console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`) }

try {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createErr) throw new Error('createUser: ' + createErr.message)
  userId = created.user.id

  // attendre que le trigger handle_new_user crée le profil
  let profile = null
  for (let i = 0; i < 10 && !profile; i++) {
    const { data } = await admin.from('profiles').select('id, credits, is_admin, username').eq('id', userId).single()
    profile = data
    if (!profile) await new Promise((r) => setTimeout(r, 300))
  }
  if (!profile) throw new Error('profil non créé par handle_new_user')
  const baseCredits = profile.credits

  // client authentifié
  const userClient = createClient(url, anon)
  const { error: signErr } = await userClient.auth.signInWithPassword({ email, password })
  if (signErr) throw new Error('signIn: ' + signErr.message)

  // TEST A — credits (protégé) doit ÉCHOUER
  await userClient.from('profiles').update({ credits: 999999 }).eq('id', userId)
  const { data: a } = await admin.from('profiles').select('credits').eq('id', userId).single()
  log('A. UPDATE credits=999999 bloqué', a.credits === baseCredits, `credits=${a.credits} (attendu ${baseCredits})`)

  // TEST B — is_admin (protégé) doit ÉCHOUER
  await userClient.from('profiles').update({ is_admin: true }).eq('id', userId)
  const { data: b } = await admin.from('profiles').select('is_admin').eq('id', userId).single()
  log('B. UPDATE is_admin=true bloqué', b.is_admin === false, `is_admin=${b.is_admin}`)

  // TEST C — earned_credits + has_purchased (protégés) bloqués
  await userClient.from('profiles').update({ earned_credits: 5000, has_purchased_credits: true }).eq('id', userId)
  const { data: c } = await admin.from('profiles').select('earned_credits, has_purchased_credits').eq('id', userId).single()
  log('C. UPDATE earned_credits/has_purchased bloqué', c.earned_credits === 0 && c.has_purchased_credits === false, `earned=${c.earned_credits} purchased=${c.has_purchased_credits}`)

  // TEST D — username (NON protégé) doit RÉUSSIR
  const newName = 'c3_' + userId.slice(0, 8)
  const { error: dErr } = await userClient.from('profiles').update({ username: newName }).eq('id', userId)
  const { data: d } = await admin.from('profiles').select('username').eq('id', userId).single()
  log('D. UPDATE username (non protégé) autorisé', !dErr && d.username === newName, `username=${d.username}`)

  // TEST E — RPC DEFINER claim_eligible_badges fonctionne (current_user != authenticated)
  const { error: eErr } = await userClient.rpc('claim_eligible_badges')
  log('E. RPC claim_eligible_badges OK (DEFINER non bloqué)', !eErr, eErr ? eErr.message : 'aucune erreur')

  // TEST F — RPC DEFINER deduct_credits fonctionne (écrit credits via DEFINER)
  const { data: fData, error: fErr } = await userClient.rpc('deduct_credits', { p_user_id: userId, p_amount: 1 })
  const { data: f } = await admin.from('profiles').select('credits').eq('id', userId).single()
  log('F. RPC deduct_credits écrit credits via DEFINER', !fErr && f.credits === baseCredits - 1, `credits=${f.credits} rpc=${JSON.stringify(fData)} ${fErr ? fErr.message : ''}`)
} catch (e) {
  log('FATAL', false, e.message)
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId)
  const allPass = results.length > 0 && results.every((r) => r.pass)
  console.log('\n=== ' + (allPass ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(allPass ? 0 : 1)
}
