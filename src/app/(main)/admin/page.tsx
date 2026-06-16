import { getAdminStats, getAdminUsers, getAdminGames, getAdminItems, getAdminWinners, getBuyItNowOrders, getGaugeWins, getAdminHealth } from '@/actions/admin'
import { AdminDashboard } from './AdminDashboard'

export default async function AdminPage() {
  const [stats, users, games, items, winners, buyItNowOrders, gaugeWins, health] = await Promise.all([
    getAdminStats(),
    getAdminUsers(20),
    getAdminGames(20),
    getAdminItems(20),
    getAdminWinners(20),
    getBuyItNowOrders(50),
    getGaugeWins(50),
    getAdminHealth(),
  ])

  if (!stats) {
    return <div className="p-8 text-white">Accès non autorisé</div>
  }

  return (
    <AdminDashboard
      stats={stats}
      users={users}
      games={games}
      items={items}
      winners={winners}
      buyItNowOrders={buyItNowOrders}
      gaugeWins={gaugeWins}
      health={health}
    />
  )
}
