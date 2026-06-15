import { NextRequest, NextResponse } from 'next/server'
import { broadcastPush } from '@/lib/push'
import { createClient } from '@supabase/supabase-js'

// Daily credits reset for ALL users (refonte 2026-06) :
//   credits = 10 (gratuit) / 20 (VIP) + equip_daily_clicks (bonus d'équipement).
// Le VIP reçoit son allocation doublée directement via ce reset (plus de bonus
// manuel). Les crédits achetés vivent dans earned_credits (PERMANENTS, jamais
// reset), donc tout le monde est reset sans distinction acheteur/non-acheteur.
// Should be called at midnight via cron-job.org

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CRON_SECRET = process.env.CRON_SECRET
const DAILY_FREE_CREDITS = 10
const VIP_DAILY_CREDITS = 20 // VIP : allocation quotidienne doublée, NON cumulable

export async function GET(request: NextRequest) {
  // Verify authentication
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Notification quotidienne : crédits + 3 coffres gratuits dispo (non-bloquant).
  // DOIT rester après la vérification du secret : sinon un appel anonyme
  // spamme tous les abonnés et la notif ne part jamais lors du vrai cron.
  broadcastPush({
    title: 'Tes récompenses du jour sont là',
    body: '10 clics gratuits + 3 coffres à ouvrir t\'attendent dans l\'arène.',
    url: '/lobby',
    tag: 'daily',
  }).catch((err) => console.error('[CRON] Failed to broadcast daily push:', err))

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Minuit Paris : la RPC SQL paris_midnight() est la source unique de vérité
    // (DST géré par Postgres). Fallback JS uniquement si la RPC échoue.
    let todayMidnight: Date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: midnightData, error: midnightError } = await (supabase.rpc as any)('paris_midnight')
    if (!midnightError && midnightData) {
      todayMidnight = new Date(midnightData as string)
    } else {
      const now = new Date()
      const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const [day, month, year] = parisFormatter.format(now).split('/')
      const parisOffset = now.toLocaleString('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
      const isSummerTime = parisOffset.includes('+02')
      todayMidnight = new Date(`${year}-${month}-${day}T00:00:00${isSummerTime ? '+02:00' : '+01:00'}`)
    }

    // Expiration V.I.P : désactive les abonnements arrivés à échéance
    // (le webhook Stripe gère les annulations, ceci couvre les échecs/oublis).
    const { data: expiredVips } = await supabase
      .from('profiles')
      .update({ is_vip: false })
      .eq('is_vip', true)
      .not('vip_expires_at', 'is', null)
      .lt('vip_expires_at', new Date().toISOString())
      .select('id')
    if (expiredVips && expiredVips.length > 0) {
      console.log(`[CRON] Expired ${expiredVips.length} VIP subscription(s)`)
    }

    // Reset pour TOUS les users non encore reset aujourd'hui. Les crédits achetés
    // vivent désormais dans earned_credits (jamais reset), donc plus de filtre
    // has_purchased_credits. VIP -> 20/jour, sinon 10/jour (non cumulables).
    const { data: usersToResetData, error: fetchError } = await supabase
      .from('profiles')
      .select('id, is_vip, equip_daily_clicks, last_credits_reset')
      // Inclut last_credits_reset NULL (jamais reset) — sinon ces comptes ne sont
      // jamais traités par le cron (NULL < x = NULL en SQL). Aligné sur la RPC
      // reset_daily_credits (last_credits_reset IS NULL OR < paris_midnight()).
      .or(`last_credits_reset.is.null,last_credits_reset.lt.${todayMidnight.toISOString()}`)

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    const usersToReset = usersToResetData || []

    if (usersToReset.length === 0) {
      return NextResponse.json({
        message: 'No users need daily credits reset',
        resetCount: 0,
        note: 'All users reset to 10 (free) / 20 (VIP) + equip_daily_clicks; purchased credits live in earned_credits (never reset)',
      })
    }

    const resetTimestamp = new Date().toISOString()

    // credits = (20 VIP | 10) + equip_daily_clicks (bonus d'équipement, gagné en
    // coffre/pass) — ALIGNÉ sur la RPC reset_daily_credits. Sans ce bonus, le cron
    // (prioritaire à minuit) effaçait le perk chaque nuit. Regroupé par total pour
    // des updates en bulk.
    const groups = new Map<number, string[]>()
    for (const u of usersToReset) {
      const vip = (u as { is_vip: boolean }).is_vip
      const equip = (u as { equip_daily_clicks: number | null }).equip_daily_clicks ?? 0
      const total = (vip ? VIP_DAILY_CREDITS : DAILY_FREE_CREDITS) + equip
      const ids = groups.get(total) ?? []
      ids.push(u.id)
      groups.set(total, ids)
    }

    for (const [total, ids] of groups) {
      const { error: eGroup } = await supabase
        .from('profiles')
        .update({ credits: total, last_credits_reset: resetTimestamp })
        .in('id', ids)
      if (eGroup) {
        console.error('Error resetting credits group:', eGroup)
        return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
      }
    }

    console.log(`Reset daily credits: ${usersToReset.length} users (${groups.size} paliers, bonus equip inclus)`)

    // Jackpot communautaire : croissance quotidienne + distribution le 8 (Europe/Paris)
    let jackpot: unknown = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('grow_jackpot', { p_amount: 30 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dist } = await (supabase.rpc as any)('distribute_jackpot')
      const row = Array.isArray(dist) ? dist[0] : dist
      jackpot = row
      if (row?.distributed) {
        broadcastPush({
          title: 'Jackpot distribué !',
          body: `${row.winner} remporte ${row.won} crédits du jackpot communautaire.`,
          url: '/lobby',
          tag: 'jackpot',
        }).catch(() => {})
      }
    } catch (e) {
      console.error('[CRON] jackpot step failed:', e)
    }

    return NextResponse.json({
      jackpot,
      message: `Reset daily credits for ${usersToReset.length} users`,
      resetCount: usersToReset.length,
      creditsAmount: DAILY_FREE_CREDITS,
      note: 'All users reset to 10 (free) / 20 (VIP) + equip_daily_clicks; purchased credits live in earned_credits (never reset)',
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request)
}
