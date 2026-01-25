import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Daily credits reset for all users EXCEPT those who purchased credits
// VIP users GET the reset (they also get +10 bonus they can collect manually)
// Users who purchased credits do NOT get reset - they keep their credits
// Should be called at midnight via cron-job.org

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CRON_SECRET = process.env.CRON_SECRET
const DAILY_FREE_CREDITS = 10

export async function GET(request: NextRequest) {
  // Verify authentication
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get today's midnight in Paris timezone
    const now = new Date()
    const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const [day, month, year] = parisFormatter.format(now).split('/')
    // Create a date at midnight Paris time (expressed in UTC)
    const todayMidnightParis = new Date(`${year}-${month}-${day}T00:00:00+01:00`) // Winter time
    // Adjust for summer time if needed
    const parisOffset = now.toLocaleString('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
    const isSummerTime = parisOffset.includes('+02')
    const todayMidnight = isSummerTime
      ? new Date(`${year}-${month}-${day}T00:00:00+02:00`)
      : todayMidnightParis

    // Find users who:
    // - have NOT purchased credits (has_purchased_credits = false)
    // - VIP users ARE included (they get reset + can collect bonus)
    // - haven't been reset today (last_credits_reset < today midnight)
    const { data: usersToResetData, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, credits, last_credits_reset')
      .eq('has_purchased_credits', false)
      .lt('last_credits_reset', todayMidnight.toISOString())

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    const usersToReset = usersToResetData || []

    if (usersToReset.length === 0) {
      return NextResponse.json({
        message: 'No users need daily credits reset',
        resetCount: 0,
        note: 'Users who purchased credits are NOT reset',
      })
    }

    const resetTimestamp = new Date().toISOString()

    // Reset daily credits to 10 for all users (except those who purchased)
    const { error: resetError } = await supabase
      .from('profiles')
      .update({
        credits: DAILY_FREE_CREDITS,
        last_credits_reset: resetTimestamp,
      })
      .in('id', usersToReset.map(u => u.id))

    if (resetError) {
      console.error('Error resetting users credits:', resetError)
      return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
    }

    console.log(`Reset daily credits: ${usersToReset.length} users → ${DAILY_FREE_CREDITS} credits each`)

    return NextResponse.json({
      message: `Reset daily credits for ${usersToReset.length} users`,
      resetCount: usersToReset.length,
      creditsAmount: DAILY_FREE_CREDITS,
      note: 'VIP users included (they can also collect +10 bonus). Users with purchased credits NOT reset.',
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
