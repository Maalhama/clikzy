import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Daily credits reset for free users
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

    // Get today's midnight in UTC
    const todayMidnight = new Date()
    todayMidnight.setUTCHours(0, 0, 0, 0)

    // Find free users whose credits haven't been reset today
    const { data: usersToReset, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, credits, last_credits_reset')
      .eq('has_purchased_credits', false)
      .lt('last_credits_reset', todayMidnight.toISOString())

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!usersToReset || usersToReset.length === 0) {
      return NextResponse.json({
        message: 'No users need credits reset',
        resetCount: 0,
      })
    }

    // Reset credits for all eligible users
    const userIds = usersToReset.map(u => u.id)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: DAILY_FREE_CREDITS,
        last_credits_reset: new Date().toISOString(),
      })
      .in('id', userIds)

    if (updateError) {
      console.error('Error resetting credits:', updateError)
      return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
    }

    console.log(`Reset credits for ${usersToReset.length} free users`)

    return NextResponse.json({
      message: `Reset credits for ${usersToReset.length} users`,
      resetCount: usersToReset.length,
      creditsGiven: DAILY_FREE_CREDITS,
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
