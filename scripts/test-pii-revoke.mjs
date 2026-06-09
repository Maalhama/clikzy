// Vérifie : REVOKE add_mini_game_credits (authenticated bloqué, service_role OK),
// unicité free-play (anti-TOCTOU), et restriction PII anon sur profiles.
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

const pw = 'Test-PiiRevoke-Passw0rd!'
const ids = []
const results = []
const log = (n, p, d) => { results.push(p); console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }

try {
  const { data: created } = await admin.auth.admin.createUser({ email: `piirev_${Date.now()}@cleekzy-test.local`, password: pw, email_confirm: true })
  const A = created.user; ids.push(A.id)
  for (let i = 0; i < 10; i++) { const { data: p } = await admin.from('profiles').select('id').eq('id', A.id).single(); if (p) break; await new Promise((r) => setTimeout(r, 250)) }
  // remplir des champs sensibles pour le test PII
  await admin.from('profiles').update({ shipping_address: '1 rue secrète', shipping_phone: '0600000000' }).eq('id', A.id)

  const ca = createClient(url, anon)
  await ca.auth.signInWithPassword({ email: A.email, password: pw })

  // 1) authenticated NE PEUT PLUS appeler add_mini_game_credits (REVOKE)
  const r1 = await ca.rpc('add_mini_game_credits', { p_user_id: A.id, p_amount: 100000 })
  const { data: a1 } = await admin.from('profiles').select('earned_credits').eq('id', A.id).single()
  log('add_mini_game_credits révoqué pour authenticated', !!r1.error && a1.earned_credits === 0, r1.error ? (r1.error.code || r1.error.message) : `earned=${a1.earned_credits} (FAILLE mint)`)

  // 2) service_role PEUT toujours appeler (chemin légitime des Server Actions)
  const r2 = await admin.rpc('add_mini_game_credits', { p_user_id: A.id, p_amount: 7 })
  log('add_mini_game_credits OK via service_role', !r2.error, r2.error ? r2.error.message : `total=${r2.data}`)

  // 3) unicité free-play : 2 inserts free same jour -> 2e en 23505
  const ins1 = await admin.from('mini_game_plays').insert({ user_id: A.id, game_type: 'wheel', credits_won: 0, is_free_play: true })
  const ins2 = await admin.from('mini_game_plays').insert({ user_id: A.id, game_type: 'wheel', credits_won: 0, is_free_play: true })
  log('unicité free-play/jour (2e insert 23505)', !ins1.error && ins2.error?.code === '23505', ins2.error ? ins2.error.code : 'PAS de conflit (FAILLE TOCTOU)')

  // 4) PII : anon NE PEUT PAS lire shipping_address
  const canon = createClient(url, anon)
  const r4 = await canon.from('profiles').select('shipping_address').eq('id', A.id)
  log('anon ne peut pas lire shipping_address', !!r4.error, r4.error ? (r4.error.code || r4.error.message) : `data=${JSON.stringify(r4.data)} (FUITE PII)`)

  // 5) PII : anon PEUT lire username (affichage public)
  const r5 = await canon.from('profiles').select('username, avatar_url, total_wins').eq('id', A.id)
  log('anon peut lire username/avatar/stats publics', !r5.error && Array.isArray(r5.data), r5.error ? r5.error.message : 'OK')
} catch (e) {
  log('FATAL', false, e.message)
} finally {
  for (const id of ids) { await admin.from('mini_game_plays').delete().eq('user_id', id); await admin.auth.admin.deleteUser(id) }
  const ok = results.length > 0 && results.every(Boolean)
  console.log('\n=== ' + (ok ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(ok ? 0 : 1)
}
