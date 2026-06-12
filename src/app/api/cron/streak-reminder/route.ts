import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'

// Rappel « streak en danger » — à planifier sur cron-job.org vers 20h Europe/Paris.
// Cible : joueurs avec une streak >= 3 qui n'ont PAS encore réclamé leur bonus
// du jour (streak_last_day < aujourd'hui Paris). Levier d'aversion à la perte.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

const MIN_STREAK = 3
const MAX_NOTIFICATIONS = 2000 // garde-fou : pas d'envoi massif incontrôlé

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const parisToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())

    // Joueurs dont la streak expire à minuit : dernier claim = hier ou avant,
    // streak significative (>= 3 jours, sinon la perte est indolore).
    const { data: atRisk, error } = await supabase
      .from('profiles')
      .select('id, username, streak_count, streak_last_day')
      .gte('streak_count', MIN_STREAK)
      .lt('streak_last_day', parisToday)
      .limit(MAX_NOTIFICATIONS)

    if (error) {
      console.error('[CRON] streak-reminder fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    const users = atRisk || []
    let sent = 0

    // Envois séquencés par paquets : sendPushToUser ne notifie que les opt-in
    // (no-op silencieux sinon), donc pas de sur-notification.
    const BATCH = 25
    for (let i = 0; i < users.length; i += BATCH) {
      await Promise.allSettled(
        users.slice(i, i + BATCH).map((u) =>
          sendPushToUser(u.id, {
            title: `Ta série de ${u.streak_count} jours expire à minuit !`,
            body: 'Connecte-toi et réclame ta récompense du jour pour la sauver.',
            url: '/lobby',
            tag: 'streak-reminder',
          }).then(() => { sent += 1 })
        )
      )
    }

    return NextResponse.json({
      message: `Streak reminders processed`,
      eligible: users.length,
      pushAttempts: sent,
    })
  } catch (error) {
    console.error('[CRON] streak-reminder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
