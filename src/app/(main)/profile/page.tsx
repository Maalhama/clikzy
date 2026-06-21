import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'
import { getGameHistory, getGameHistoryStats } from '@/actions/gameHistory'
import { getReferralStats } from '@/actions/referral'
import { getShippingAddress } from '@/actions/shipping'
import { getAllBadges, getBadgeStats } from '@/actions/badges'
import type { Profile, Winner, Item } from '@/types/database'

type WinnerWithItem = Winner & {
  item: Item
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Run all queries in parallel for faster loading
  const [profileResult, winsResult, gamesPlayedResult, gameHistory, historyStats, referralStats, badges, badgeStats, shippingAddress] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    // RPC DEFINER : gains COMPLETS du joueur (avec tracking_number, masqué en grant
    // colonne pour les autres). Items récupérés ensuite (table publique) pour l'embed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('get_my_winners'),
    supabase
      .from('clicks')
      .select('game_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    getGameHistory(20),
    getGameHistoryStats(),
    getReferralStats(),
    getAllBadges(),
    getBadgeStats(),
    getShippingAddress()
  ])

  const profile = profileResult.data as Profile | null

  if (!profile) {
    redirect('/login')
  }

  // get_my_winners() renvoie les lignes winners ; on rattache l'item (table publique)
  // pour conserver le fallback retail_value affiché côté profil.
  const winnerRows = (winsResult.data as Winner[] | null) || []
  const itemIds = [...new Set(winnerRows.map((w) => w.item_id))]
  const { data: itemsData } = itemIds.length > 0
    ? await supabase.from('items').select('*').in('id', itemIds)
    : { data: [] as Item[] }
  const itemMap = new Map(((itemsData as Item[] | null) || []).map((it) => [it.id, it]))
  const wins: WinnerWithItem[] = winnerRows.map((w) => ({ ...w, item: itemMap.get(w.item_id) as Item }))
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
      referralStats={referralStats || { referralCode: null, referralCount: 0, creditsEarned: 0, referredBy: null, milestonesClaimed: 0 }}
      badges={badges}
      badgeStats={badgeStats}
      shippingAddress={shippingAddress}
    />
  )
}
