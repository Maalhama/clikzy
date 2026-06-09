// Test C5 : la table stripe_events garantit l'idempotence (PK conflit = 23505)
// et n'est pas accessible aux clients authenticated/anon (RLS sans policy).
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

const evtId = `evt_test_${Date.now()}`
const results = []
const log = (n, p, d) => { results.push(p); console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }

try {
  // A — 1ère réclamation réussit
  const { error: a } = await admin.from('stripe_events').insert({ id: evtId, type: 'checkout.session.completed' })
  log('A. 1ère réclamation de l\'event OK', !a, a ? a.message : 'inséré')

  // B — 2e réclamation du même id => conflit 23505
  const { error: b } = await admin.from('stripe_events').insert({ id: evtId, type: 'checkout.session.completed' })
  log('B. 2e réclamation (doublon) rejetée 23505', b?.code === '23505', b ? b.code : 'AUCUNE erreur (FAILLE double-crédit)')

  // C — RLS : un client anon ne peut pas lire la table
  const anonClient = createClient(url, anon)
  const { data: rows, error: c } = await anonClient.from('stripe_events').select('id').limit(1)
  const blocked = !!c || (Array.isArray(rows) && rows.length === 0)
  log('C. lecture stripe_events bloquée pour anon', blocked, c ? c.code || c.message : `rows=${rows?.length ?? 'null'}`)
} catch (e) {
  log('FATAL', false, e.message)
} finally {
  await admin.from('stripe_events').delete().eq('id', evtId)
  const ok = results.length > 0 && results.every(Boolean)
  console.log('\n=== ' + (ok ? 'TOUS LES TESTS PASSENT' : 'ÉCHEC') + ' ===')
  process.exit(ok ? 0 : 1)
}
