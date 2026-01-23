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

    // Find all free users who haven't been processed today
    const { data: freeUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, credits, last_credits_reset')
      .eq('has_purchased_credits', false)
      .lt('last_credits_reset', todayMidnight.toISOString())

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!freeUsers || freeUsers.length === 0) {
      return NextResponse.json({
        message: 'No users need processing',
        resetCount: 0,
        skippedCount: 0,
      })
    }

    // Separate users: those who need credits vs those who already have enough
    const usersNeedingCredits = freeUsers.filter(u => u.credits < DAILY_FREE_CREDITS)
    const usersWithEnoughCredits = freeUsers.filter(u => u.credits >= DAILY_FREE_CREDITS)

    const now = new Date().toISOString()

    // Reset credits for users with < 10 credits
    if (usersNeedingCredits.length > 0) {
      const { error: resetError } = await supabase
        .from('profiles')
        .update({
          credits: DAILY_FREE_CREDITS,
          last_credits_reset: now,
        })
        .in('id', usersNeedingCredits.map(u => u.id))

      if (resetError) {
        console.error('Error resetting credits:', resetError)
        return NextResponse.json({ error: 'Failed to reset credits' }, { status: 500 })
      }
    }

    // Just update last_credits_reset for users who already have >= 10 credits
    // (they keep their credits earned from mini-games)
    if (usersWithEnoughCredits.length > 0) {
      const { error: markError } = await supabase
        .from('profiles')
        .update({
          last_credits_reset: now,
        })
        .in('id', usersWithEnoughCredits.map(u => u.id))

      if (markError) {
        console.error('Error marking users:', markError)
        // Non-critical, continue
      }
    }

    console.log(`Reset credits for ${usersNeedingCredits.length} users, skipped ${usersWithEnoughCredits.length} users with enough credits`)

    return NextResponse.json({
      message: `Processed ${freeUsers.length} free users`,
      resetCount: usersNeedingCredits.length,
      skippedCount: usersWithEnoughCredits.length,
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
