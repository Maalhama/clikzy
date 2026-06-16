import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GAUGE_ABANDON_DAYS } from '@/lib/constants'

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

    return NextResponse.json({
      message: `Converted ${converted} abandoned gauge(s) to credit`,
      converted,
      totalCredits,
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
