import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Daily credits reset for free users
// Should be called at midnight via cron-job.org

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CRON_SECRET = process.env.CRON_SECRET
const DAILY_FREE_CREDITS = 10
const DAILY_VIP_CREDITS = 20 // 10 base + 10 VIP bonus

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

    // Find all free users who haven't been reset today
    const { data: freeUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, credits, earned_credits, last_credits_reset, is_vip, vip_expires_at')
      .eq('has_purchased_credits', false)
      .lt('last_credits_reset', todayMidnight.toISOString())

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Also find VIP users who need reset (VIP overrides has_purchased_credits for daily reset)
    const { data: vipUsers, error: vipFetchError } = await supabase
      .from('profiles')
      .select('id, username, credits, earned_credits, last_credits_reset, is_vip, vip_expires_at')
      .eq('is_vip', true)
      .gt('vip_expires_at', new Date().toISOString())
      .lt('last_credits_reset', todayMidnight.toISOString())

    if (vipFetchError) {
      console.error('Error fetching VIP profiles:', vipFetchError)
    }

    const allUsers = freeUsers || []
    const activeVipUsers = vipUsers || []

    // Separate VIP and non-VIP users (avoid duplicates)
    const vipUserIds = new Set(activeVipUsers.map(u => u.id))
    const nonVipFreeUsers = allUsers.filter(u => !vipUserIds.has(u.id) && !u.is_vip)
    const vipUsersToReset = activeVipUsers

    if (nonVipFreeUsers.length === 0 && vipUsersToReset.length === 0) {
      return NextResponse.json({
        message: 'No users need daily credits reset',
        resetCount: 0,
      })
    }

    const resetTimestamp = new Date().toISOString()

    // Reset daily credits to 10 for free non-VIP users
    if (nonVipFreeUsers.length > 0) {
      const { error: resetError } = await supabase
        .from('profiles')
        .update({
          credits: DAILY_FREE_CREDITS,
          last_credits_reset: resetTimestamp,
        })
        .in('id', nonVipFreeUsers.map(u => u.id))

      if (resetError) {
        console.error('Error resetting free users credits:', resetError)
      }
    }

    // Reset daily credits to 20 for VIP users (10 base + 10 VIP bonus)
    if (vipUsersToReset.length > 0) {
      const { error: vipResetError } = await supabase
        .from('profiles')
        .update({
          credits: DAILY_VIP_CREDITS,
          last_credits_reset: resetTimestamp,
        })
        .in('id', vipUsersToReset.map(u => u.id))

      if (vipResetError) {
        console.error('Error resetting VIP users credits:', vipResetError)
      }
    }

    const totalReset = nonVipFreeUsers.length + vipUsersToReset.length
    console.log(`Reset daily credits: ${nonVipFreeUsers.length} free users (10 credits), ${vipUsersToReset.length} VIP users (20 credits)`)

    return NextResponse.json({
      message: `Reset daily credits for ${totalReset} users`,
      resetCount: totalReset,
      freeUsersReset: nonVipFreeUsers.length,
      vipUsersReset: vipUsersToReset.length,
      note: 'VIP users get 20 credits (10 base + 10 bonus)',
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
