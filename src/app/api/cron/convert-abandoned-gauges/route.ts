import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GAUGE_ABANDON_DAYS } from '@/lib/constants'
import { sendPushToUser } from '@/lib/push'
import { sendGaugeConvertedEmail } from '@/lib/email'

// Avoir crédit sur abandon de jauge (feature en exploration — voir
// cleekzy-gauge-pivot). « Rien n'est jamais perdu » : une jauge sans clic depuis
// GAUGE_ABANDON_DAYS jours voit sa progression convertie en avoir crédit permanent
// (earned_credits), réutilisable sur n'importe quel item.
//
// Idempotent (la RPC ne traite que progress>0 + inactif, puis remet à 0) → un
// double passage est sans effet. À planifier 1×/jour sur cron-job.org.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Borne basse pour relire les conversions de CE run (gauge_credit_refunds.refunded_at).
    const startedAt = new Date(Date.now() - 5000).toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('convert_abandoned_gauges', {
      p_days: GAUGE_ABANDON_DAYS,
    })
    if (error) {
      console.error('[CRON] convert_abandoned_gauges failed:', error)
      return NextResponse.json({ error: 'Failed to convert abandoned gauges' }, { status: 500 })
    }
    const row = Array.isArray(data) ? data[0] : data
    const converted = row?.out_converted ?? 0
    const totalCredits = row?.out_total_credits ?? 0
    console.log(`[CRON] Abandoned gauges converted: ${converted} (${totalCredits} crédits rendus)`)

    // Prévenir chaque joueur que sa progression a été transformée en crédits (« rien n'est
    // perdu ») — push + email best-effort, ne bloque pas la réponse du cron.
    let notified = 0
    if (converted > 0) {
      try {
        const { data: refunds } = await supabase
          .from('gauge_credit_refunds')
          .select('user_id, credits, item:items(name)')
          .gte('refunded_at', startedAt)
        for (const r of refunds ?? []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rr = r as any
          const uid: string = rr.user_id
          const credits: number = rr.credits ?? 0
          const itemName: string = rr.item?.name ?? 'un lot'
          await sendPushToUser(uid, {
            title: `${credits} crédits récupérés`,
            body: `Ta progression sur ${itemName} a été transformée en ${credits} crédits, prêts à utiliser.`,
            url: '/lobby',
            tag: 'gauge-converted',
          })
          const { data: userRes } = await supabase.auth.admin.getUserById(uid)
          const to = userRes?.user?.email
          if (to) {
            const { data: prof } = await supabase.from('profiles').select('username').eq('id', uid).single()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await sendGaugeConvertedEmail(to, (prof as any)?.username || 'Joueur', itemName, credits)
          }
          notified += 1
        }
      } catch (e) {
        console.error('[CRON] gauge conversion notify error:', e)
      }
    }

    return NextResponse.json({
      message: `Converted ${converted} abandoned gauge(s) to credit`,
      converted,
      totalCredits,
      notified,
      thresholdDays: GAUGE_ABANDON_DAYS,
    })
  } catch (error) {
    console.error('[CRON] convert-abandoned-gauges error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request)
}
