import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'
import { sendWinbackEmail } from '@/lib/email'

// Réactivation des joueurs inactifs : offre dégressive selon l'inactivité + push/email.
// Cible : last_active_at > 7j ET (jamais relancé OU relancé il y a > 14j). À planifier
// 1×/jour. Fail-closed sur CRON_SECRET. Email gaté sur l'opt-out marketing.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

const MAX = 500

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()
    const sevenAgo = new Date(now - 7 * 86_400_000).toISOString()
    const fourteenAgo = new Date(now - 14 * 86_400_000).toISOString()

    const { data: inactifs, error } = await supabase
      .from('profiles')
      .select('id, username, last_active_at, marketing_opt_out')
      .lt('last_active_at', sevenAgo)
      .or(`win_back_sent_at.is.null,win_back_sent_at.lt.${fourteenAgo}`)
      .limit(MAX)

    if (error) {
      console.error('[CRON] win-back fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    let reactivated = 0
    for (const p of inactifs ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = p as any
      const days = Math.floor((now - new Date(u.last_active_at).getTime()) / 86_400_000)
      // Offre dégressive : plus l'inactivité est récente, plus le bonus est généreux.
      const bonus = days < 14 ? 100 : days < 30 ? 50 : 30

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('grant_winback', { p_user_id: u.id, p_credits: bonus })

      await sendPushToUser(u.id, {
        title: `${bonus} crédits pour ton retour !`,
        body: 'On t\'a offert des crédits, reviens tenter de remporter un lot.',
        url: '/lobby',
        tag: 'winback',
      })

      if (!u.marketing_opt_out) {
        const { data: userRes } = await supabase.auth.admin.getUserById(u.id)
        const to = userRes?.user?.email
        if (to) await sendWinbackEmail(to, u.username || 'Joueur', bonus, u.id)
      }
      reactivated += 1
    }

    return NextResponse.json({ message: 'Win-back processed', candidates: (inactifs ?? []).length, reactivated })
  } catch (error) {
    console.error('[CRON] win-back error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
