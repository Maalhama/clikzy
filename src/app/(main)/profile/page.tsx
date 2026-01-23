import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'
import { getGameHistory, getGameHistoryStats } from '@/actions/gameHistory'
import { getReferralStats } from '@/actions/referral'
import type { Profile, Winner, Item } from '@/types/database'

type WinnerWithItem = Winner & {
  item: Item
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Run all queries in parallel for faster loading
  const [profileResult, winsResult, gamesPlayedResult, gameHistory, historyStats, referralStats] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('winners')
      .select('*, item:items(*)')
      .eq('user_id', user.id)
      .order('won_at', { ascending: false }),
    supabase
      .from('clicks')
      .select('game_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    getGameHistory(20),
    getGameHistoryStats(),
    getReferralStats()
  ])

  const profile = profileResult.data as Profile | null

  if (!profile) {
    redirect('/login')
  }

  const wins = (winsResult.data as WinnerWithItem[] | null) || []
  const gamesPlayed = gamesPlayedResult.count || 0

  // Calculate total value won
  const totalValueWon = wins.reduce((acc, win) => {
    return acc + (win.item_value || win.item?.retail_value || 0)
  }, 0)

  return (
    <ProfileClient
      profile={profile}
      wins={wins}
      gamesPlayed={gamesPlayed}
      totalValueWon={totalValueWon}
      gameHistory={gameHistory}
      historyStats={historyStats}
      referralStats={referralStats || { referralCode: null, referralCount: 0, creditsEarned: 0, referredBy: null }}
    />
  )
}
