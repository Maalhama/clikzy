import { getAdminStats, getAdminUsers, getAdminGames, getAdminItems, getAdminWinners, getBuyItNowOrders, getAdminHealth } from '@/actions/admin'
import { AdminDashboard } from './AdminDashboard'

export default async function AdminPage() {
  const [stats, users, games, items, winners, buyItNowOrders, health] = await Promise.all([
    getAdminStats(),
    getAdminUsers(20),
    getAdminGames(20),
    getAdminItems(20),
    getAdminWinners(20),
    getBuyItNowOrders(50),
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
      health={health}
    />
  )
}
