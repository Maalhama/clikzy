import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'
import { sendAddressReminderEmail } from '@/lib/email'

// Relance « renseigne ton adresse » — gagnants dont le lot attend une adresse depuis
// plus de 24h. Push + email, une seule fois (flag winners.address_reminder_sent_at).
// À planifier 1×/jour (cron Vercel + filet cron-job.org). Fail-closed sur CRON_SECRET.

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
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

    // Lots gagnés en attente d'adresse depuis >24h, jamais relancés.
    const { data: pending, error } = await supabase
      .from('winners')
      .select('id, user_id, item_name')
      .in('shipping_status', ['pending', 'address_needed'])
      .lt('won_at', since24h)
      .is('address_reminder_sent_at', null)
      .limit(MAX)

    if (error) {
      console.error('[CRON] shipping-reminder fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 })
    }

    let reminded = 0
    for (const w of pending ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = w as any
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, shipping_address')
        .eq('id', win.user_id)
        .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = prof as any
      // Adresse déjà renseignée -> pas de relance (le lot suivra son cours normal).
      if (p?.shipping_address) continue

      await sendPushToUser(win.user_id, {
        title: 'Réclame ton lot !',
        body: `Renseigne ton adresse pour recevoir ${win.item_name}.`,
        url: '/profile',
        tag: 'address-reminder',
      })
      const { data: userRes } = await supabase.auth.admin.getUserById(win.user_id)
      const to = userRes?.user?.email
      if (to) await sendAddressReminderEmail(to, p?.username || 'Joueur', win.item_name)

      await supabase
        .from('winners')
        .update({ address_reminder_sent_at: new Date().toISOString() })
        .eq('id', win.id)
      reminded += 1
    }

    return NextResponse.json({ message: 'Shipping reminders processed', candidates: (pending ?? []).length, reminded })
  } catch (error) {
    console.error('[CRON] shipping-reminder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
