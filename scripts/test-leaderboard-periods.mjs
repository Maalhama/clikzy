// Test : trigger xp_events + classement par période (week) + all-time.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const pw = 'Test-Lb-Passw0rd!'
const ids = []; const results = []; const log = (n, p, d) => { results.push(p); console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }
try {
  const { data: c } = await admin.auth.admin.createUser({ email: `lb_${Date.now()}@cleekzy-test.local`, password: pw, email_confirm: true })
  const A = c.user; ids.push(A.id)
  for (let i = 0; i < 10; i++) { const { data: p } = await admin.from('profiles').select('id').eq('id', A.id).single(); if (p) break; await new Promise((r) => setTimeout(r, 250)) }

  // award_xp -> doit déclencher le trigger xp_events
  await admin.rpc('award_xp', { p_user_id: A.id, p_amount: 5000 })
  const { count } = await admin.from('xp_events').select('*', { count: 'exact', head: true }).eq('user_id', A.id)
  log('trigger journalise xp_events', (count ?? 0) >= 1, `${count} event(s)`)

  await anon.auth.signInWithPassword({ email: A.email, password: pw })

  const lbW = await anon.rpc('get_leaderboard', { p_period: 'week', p_limit: 50 })
  const inWeek = Array.isArray(lbW.data) && lbW.data.some((r) => r.user_id === A.id && Number(r.xp) >= 5000)
  log('get_leaderboard(week) inclut le gain', !lbW.error && inWeek, lbW.error ? lbW.error.message : `${lbW.data?.length} lignes`)

  const lbAll = await anon.rpc('get_leaderboard', { p_period: 'all', p_limit: 50 })
  log('get_leaderboard(all) fonctionne', !lbAll.error && Array.isArray(lbAll.data) && lbAll.data.length > 0, lbAll.error ? lbAll.error.message : `${lbAll.data?.length} lignes`)

  const rkW = await anon.rpc('get_my_rank', { p_period: 'week' })
  const rkr = Array.isArray(rkW.data) ? rkW.data[0] : rkW.data
  log('get_my_rank(week) renvoie rang+total', !rkW.error && Number(rkr?.total_players) >= 1, rkW.error ? rkW.error.message : `rang ${rkr?.my_rank}/${rkr?.total_players}`)
} catch (e) { log('FATAL', false, e.message) } finally {
  for (const id of ids) { await admin.from('xp_events').delete().eq('user_id', id); await admin.auth.admin.deleteUser(id) }
  const ok = results.length > 0 && results.every(Boolean)
  console.log('\n=== ' + (ok ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(ok ? 0 : 1)
}
