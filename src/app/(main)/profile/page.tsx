import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'
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

  // Get profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (!profile) {
    redirect('/login')
  }

  // Get user's wins with items
  const { data: winsData } = await supabase
    .from('winners')
    .select('*, item:items(*)')
    .eq('user_id', user.id)
    .order('won_at', { ascending: false })

  const wins = (winsData as WinnerWithItem[] | null) || []

  // Get total games played (unique games where user clicked)
  const { count: gamesPlayedCount } = await supabase
    .from('clicks')
    .select('game_id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const gamesPlayed = gamesPlayedCount || 0

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
    />
  )
}
