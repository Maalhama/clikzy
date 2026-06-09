// Test E2E gamification phase 1 : award_xp (service_role only), claim_daily_login
// (streak/idempotent), claim_quest (progression réelle), protection xp/level.
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

const pw = 'Test-Gami-Passw0rd!'
const ids = []
const results = []
const log = (n, p, d) => { results.push(p); console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }

try {
  const { data: created } = await admin.auth.admin.createUser({ email: `gami_${Date.now()}@cleekzy-test.local`, password: pw, email_confirm: true })
  const A = created.user; ids.push(A.id)
  for (let i = 0; i < 10; i++) { const { data: p } = await admin.from('profiles').select('id').eq('id', A.id).single(); if (p) break; await new Promise((r) => setTimeout(r, 250)) }

  const ca = createClient(url, anon)
  await ca.auth.signInWithPassword({ email: A.email, password: pw })

  // 1) award_xp via service_role -> xp+level
  const aw = await admin.rpc('award_xp', { p_user_id: A.id, p_amount: 1000 })
  const row = Array.isArray(aw.data) ? aw.data[0] : aw.data
  log('award_xp service_role : 1000 XP -> level 5', !aw.error && Number(row?.new_xp) === 1000 && row?.new_level === 5, aw.error ? aw.error.message : `xp=${row?.new_xp} level=${row?.new_level}`)

  // 2) award_xp via authenticated -> révoqué
  const aw2 = await ca.rpc('award_xp', { p_user_id: A.id, p_amount: 999999 })
  log('award_xp révoqué pour authenticated', !!aw2.error, aw2.error ? (aw2.error.code || aw2.error.message) : 'AUCUNE erreur (FAILLE)')

  // 3) self-set xp via update direct -> bloqué par trigger
  const up = await ca.from('profiles').update({ xp: 999999, level: 99 }).eq('id', A.id)
  const { data: p3 } = await admin.from('profiles').select('xp, level').eq('id', A.id).single()
  log('self-set xp/level bloqué (trigger)', !!up.error && Number(p3.xp) === 1000, up.error ? up.error.code : `xp=${p3.xp} (FAILLE)`)

  // 4) claim_daily_login : 1ère fois streak=1
  const cl = await ca.rpc('claim_daily_login', { p_user_id: A.id })
  const clr = Array.isArray(cl.data) ? cl.data[0] : cl.data
  log('claim_daily_login J1 (streak=1, +50 crédits)', !cl.error && clr?.streak === 1 && clr?.credits_gained === 50 && clr?.already === false, cl.error ? cl.error.message : JSON.stringify(clr))

  // 5) claim_daily_login 2e fois aujourd'hui -> already
  const cl2 = await ca.rpc('claim_daily_login', { p_user_id: A.id })
  const cl2r = Array.isArray(cl2.data) ? cl2.data[0] : cl2.data
  log('claim_daily_login 2e fois -> already', !cl2.error && cl2r?.already === true, JSON.stringify(cl2r))

  // 6) claim_quest('login') -> ok (login toujours rempli)
  const q1 = await ca.rpc('claim_quest', { p_quest_key: 'login' })
  const q1r = Array.isArray(q1.data) ? q1.data[0] : q1.data
  log('claim_quest login -> ok', !q1.error && q1r?.ok === true, q1.error ? q1.error.message : JSON.stringify(q1r))

  // 7) claim_quest('login') 2e fois -> already_claimed
  const q2 = await ca.rpc('claim_quest', { p_quest_key: 'login' })
  const q2r = Array.isArray(q2.data) ? q2.data[0] : q2.data
  log('claim_quest login 2e -> already_claimed', q2r?.ok === false && q2r?.reason === 'already_claimed', JSON.stringify(q2r))

  // 8) claim_quest('clicks_5') avec 0 clic -> not_completed
  const q3 = await ca.rpc('claim_quest', { p_quest_key: 'clicks_5' })
  const q3r = Array.isArray(q3.data) ? q3.data[0] : q3.data
  log('claim_quest clicks_5 (0 clic) -> not_completed', q3r?.ok === false && q3r?.reason === 'not_completed', JSON.stringify(q3r))
} catch (e) {
  log('FATAL', false, e.message)
} finally {
  for (const id of ids) { await admin.from('user_quest_claims').delete().eq('user_id', id); await admin.auth.admin.deleteUser(id) }
  const ok = results.length > 0 && results.every(Boolean)
  console.log('\n=== ' + (ok ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(ok ? 0 : 1)
}
