// Test E2E du durcissement post-audit : gardes auth.uid() (anti-IDOR) sur les RPC
// DEFINER, anon révoqué, RLS badges, et claim_eligible_badges (fix TEXT) fonctionnel.
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

const mk = (n) => `secrpc_${n}_${Date.now()}@cleekzy-test.local`
const pw = 'Test-SecRpc-Passw0rd!'
const ids = []
const results = []
const log = (n, p, d) => { results.push(p); console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }

async function mkUser(tag) {
  const { data, error } = await admin.auth.admin.createUser({ email: mk(tag), password: pw, email_confirm: true })
  if (error) throw new Error('createUser ' + tag + ': ' + error.message)
  ids.push(data.user.id)
  // attendre le profil
  for (let i = 0; i < 10; i++) {
    const { data: p } = await admin.from('profiles').select('id').eq('id', data.user.id).single()
    if (p) break
    await new Promise((r) => setTimeout(r, 250))
  }
  return data.user
}

try {
  const A = await mkUser('A')
  const B = await mkUser('B')
  const { data: bBefore } = await admin.from('profiles').select('earned_credits, credits').eq('id', B.id).single()

  const ca = createClient(url, anon)
  const { error: signErr } = await ca.auth.signInWithPassword({ email: A.email, password: pw })
  if (signErr) throw new Error('signIn A: ' + signErr.message)

  // A — IDOR add_mini_game_credits sur B doit échouer (forbidden)
  const r1 = await ca.rpc('add_mini_game_credits', { p_user_id: B.id, p_amount: 100000 })
  const { data: b1 } = await admin.from('profiles').select('earned_credits').eq('id', B.id).single()
  log('IDOR add_mini_game_credits(B) bloqué', !!r1.error && b1.earned_credits === bBefore.earned_credits, r1.error ? r1.error.message : `earned B=${b1.earned_credits} (FAILLE)`)

  // A — IDOR deduct_credits sur B
  const r2 = await ca.rpc('deduct_credits', { p_user_id: B.id, p_amount: 5 })
  log('IDOR deduct_credits(B) bloqué', !!r2.error, r2.error ? r2.error.message : 'AUCUNE erreur (FAILLE)')

  // A — IDOR reset_daily_credits sur B
  const r3 = await ca.rpc('reset_daily_credits', { p_user_id: B.id })
  log('IDOR reset_daily_credits(B) bloqué', !!r3.error, r3.error ? r3.error.message : 'AUCUNE erreur (FAILLE)')

  // A — IDOR collect_vip_bonus sur B
  const r4 = await ca.rpc('collect_vip_bonus', { p_user_id: B.id, p_amount: 999 })
  log('IDOR collect_vip_bonus(B) bloqué', !!r4.error, r4.error ? r4.error.message : 'AUCUNE erreur (FAILLE)')

  // A — self reset_daily_credits doit RÉUSSIR
  const r5 = await ca.rpc('reset_daily_credits', { p_user_id: A.id })
  log('self reset_daily_credits(A) autorisé', !r5.error, r5.error ? r5.error.message : 'OK')

  // anon (non connecté) ne peut PAS appeler reset_daily_credits (REVOKE)
  const canon = createClient(url, anon)
  const r6 = await canon.rpc('reset_daily_credits', { p_user_id: A.id })
  log('anon reset_daily_credits révoqué', !!r6.error, r6.error ? (r6.error.code || r6.error.message) : 'AUCUNE erreur (FAILLE)')

  // A — insert direct dans user_badges bloqué par RLS (aucune policy INSERT)
  const { data: someBadge } = await admin.from('badges').select('id').limit(1).single()
  const r7 = await ca.from('user_badges').insert({ user_id: A.id, badge_id: someBadge.id })
  log('insert direct user_badges bloqué (RLS)', !!r7.error, r7.error ? (r7.error.code || r7.error.message) : 'AUCUNE erreur (FAILLE)')

  // claim_eligible_badges (fix TEXT) : on rend A éligible puis on réclame
  await admin.from('profiles').update({ total_clicks: 100000, total_wins: 1000, referral_count: 1000 }).eq('id', A.id)
  const r8 = await ca.rpc('claim_eligible_badges')
  const awarded = Array.isArray(r8.data) ? r8.data : []
  log('claim_eligible_badges OK + attribue (fix TEXT)', !r8.error && awarded.length > 0, r8.error ? r8.error.message : `${awarded.length} badge(s), ex: ${awarded[0]?.badge_id}`)

  // earned_credits de A a augmenté via la RPC (récompense badges)
  const { data: aAfter } = await admin.from('profiles').select('earned_credits').eq('id', A.id).single()
  log('earned_credits de A crédité par les badges', aAfter.earned_credits > 0, `earned A=${aAfter.earned_credits}`)
} catch (e) {
  log('FATAL', false, e.message)
} finally {
  for (const id of ids) {
    await admin.from('user_badges').delete().eq('user_id', id)
    await admin.from('mini_game_plays').delete().eq('user_id', id)
    await admin.auth.admin.deleteUser(id)
  }
  const ok = results.length > 0 && results.every(Boolean)
  console.log('\n=== ' + (ok ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(ok ? 0 : 1)
}
