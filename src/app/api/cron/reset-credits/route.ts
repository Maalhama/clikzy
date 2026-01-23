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

    // Find all free users who haven't been reset today
    const { data: freeUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, credits, earned_credits, last_credits_reset')
      .eq('has_purchased_credits', false)
      .lt('last_credits_reset', todayMidnight.toISOString())

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!freeUsers || freeUsers.length === 0) {
      return NextResponse.json({
        message: 'No users need daily credits reset',
        resetCount: 0,
      })
    }

    const now = new Date().toISOString()

    // Reset daily credits to 10 for all free users
    // Note: earned_credits (from mini-games) are NOT touched - they persist forever
    const { error: resetError } = await supabase
      .from('profiles')
      .update({
        credits: DAILY_FREE_CREDITS, // Reset daily credits to 10
        last_credits_reset: now,
      })
      .in('id', freeUsers.map(u => u.id))

    if (resetError) {
      console.error('Error resetting credits:', resetError)
      return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
    }

    console.log(`Reset daily credits for ${freeUsers.length} free users (earned_credits preserved)`)

    return NextResponse.json({
      message: `Reset daily credits for ${freeUsers.length} users`,
      resetCount: freeUsers.length,
      dailyCreditsGiven: DAILY_FREE_CREDITS,
      note: 'earned_credits preserved',
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
