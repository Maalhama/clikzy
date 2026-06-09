// Test E2E coffres (drop item/crédits) + équipement (bonus) + classement.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const url = env.NEXT_PUBLIC_SUPABASE_URL, anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, service = env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
const pw = 'Test-Chest-Passw0rd!'
const ids = []
const results = []
const log = (n, p, d) => { results.push(p); console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }

try {
  const { data: created } = await admin.auth.admin.createUser({ email: `chest_${Date.now()}@cleekzy-test.local`, password: pw, email_confirm: true })
  const A = created.user; ids.push(A.id)
  for (let i = 0; i < 10; i++) { const { data: p } = await admin.from('profiles').select('id').eq('id', A.id).single(); if (p) break; await new Promise((r) => setTimeout(r, 250)) }

  const ca = createClient(url, anon)
  await ca.auth.signInWithPassword({ email: A.email, password: pw })

  // 1) octroyer un coffre (service_role) puis l'ouvrir
  const { data: chest } = await admin.from('user_chests').insert({ user_id: A.id, rarity: 'epic', source: 'test' }).select('id').single()
  const op = await ca.rpc('open_chest', { p_chest_id: chest.id })
  const opr = Array.isArray(op.data) ? op.data[0] : op.data
  log('open_chest renvoie un drop (item ou crédits)', !op.error && opr?.ok && (['item','credits','xp'].includes(opr?.reward_kind)), op.error ? op.error.message : `kind=${opr?.reward_kind} ${opr?.item_name || opr?.credits}`)

  // 2) ouvrir 2e fois le même coffre -> not_found (déjà ouvert)
  const op2 = await ca.rpc('open_chest', { p_chest_id: chest.id })
  const op2r = Array.isArray(op2.data) ? op2.data[0] : op2.data
  log('coffre déjà ouvert -> not_found', op2r?.ok === false && op2r?.reason === 'not_found', JSON.stringify(op2r?.reason))

  // 3) IDOR : ouvrir le coffre d'un autre user -> not_found
  const { data: chestB } = await admin.from('user_chests').insert({ user_id: A.id, rarity: 'common', source: 'test2' }).select('id').single()
  // (pas d'autre user ; on teste anon)
  const canon = createClient(url, anon)
  const op3 = await canon.rpc('open_chest', { p_chest_id: chestB.id })
  log('open_chest anon bloqué', !!op3.error || (Array.isArray(op3.data) ? op3.data[0] : op3.data)?.ok === false, op3.error ? (op3.error.code || op3.error.message) : 'reason='+JSON.stringify((Array.isArray(op3.data)?op3.data[0]:op3.data)?.reason))

  // 4) équiper un item connu (mythic +20 XP) et vérifier le bonus
  const { data: inv } = await admin.from('user_inventory').insert({ user_id: A.id, item_id: 'helm_m1', source: 'test' }).select('id').single()
  const eq = await ca.rpc('equip_item', { p_inventory_id: inv.id })
  const eqr = Array.isArray(eq.data) ? eq.data[0] : eq.data
  const { data: pAfter } = await admin.from('profiles').select('equip_bonus_pct').eq('id', A.id).single()
  log('equip_item -> bonus XP = 20%', !eq.error && eqr?.ok && pAfter.equip_bonus_pct === 20, eq.error ? eq.error.message : `equip_bonus=${pAfter.equip_bonus_pct}`)

  // 5) award_xp applique le bonus d'équipement (+20%) : 100 -> 120
  await admin.from('profiles').update({ xp: 0, level: 1 }).eq('id', A.id)
  const aw = await admin.rpc('award_xp', { p_user_id: A.id, p_amount: 100 })
  const awr = Array.isArray(aw.data) ? aw.data[0] : aw.data
  log('award_xp boosté par l\'équipement (100 -> 120)', !aw.error && Number(awr?.new_xp) === 120, `xp=${awr?.new_xp}`)

  // 6) classement : get_leaderboard + get_my_rank
  const lb = await ca.rpc('get_leaderboard', { p_limit: 10 })
  log('get_leaderboard renvoie des lignes', !lb.error && Array.isArray(lb.data) && lb.data.length > 0, lb.error ? lb.error.message : `${lb.data?.length} joueurs`)
  const rk = await ca.rpc('get_my_rank')
  const rkr = Array.isArray(rk.data) ? rk.data[0] : rk.data
  log('get_my_rank renvoie rang + total', !rk.error && rkr?.total_players > 0, rk.error ? rk.error.message : `rang ${rkr?.my_rank}/${rkr?.total_players}`)

  // 7) unequip remet le bonus à 0
  const un = await ca.rpc('unequip_slot', { p_slot: 'casque' })
  const { data: pUn } = await admin.from('profiles').select('equip_bonus_pct').eq('id', A.id).single()
  log('unequip_slot -> bonus à 0', !un.error && pUn.equip_bonus_pct === 0, `equip_bonus=${pUn.equip_bonus_pct}`)
} catch (e) {
  log('FATAL', false, e.message)
} finally {
  for (const id of ids) {
    await admin.from('user_equipment').delete().eq('user_id', id)
    await admin.from('user_inventory').delete().eq('user_id', id)
    await admin.from('user_chests').delete().eq('user_id', id)
    await admin.auth.admin.deleteUser(id)
  }
  const ok = results.length > 0 && results.every(Boolean)
  console.log('\n=== ' + (ok ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(ok ? 0 : 1)
}
