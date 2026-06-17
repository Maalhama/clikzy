import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getMyClan, getClanLeaderboard } from '@/actions/clans'
import { ClansClient } from '@/components/clans/ClansClient'

export const metadata = {
  title: 'Clans',
  description: 'Crée ton clan ou rejoins-en un : le total d\'XP de ses membres le fait grimper au classement collectif.',
}

export default async function ClansPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  // Clan + classement résolus côté serveur (SSR) -> passés en état initial au client.
  const [myClanRes, boardRes] = await Promise.all([getMyClan(), getClanLeaderboard(50)])
  const initialMyClan = myClanRes.success ? (myClanRes.data ?? null) : null
  const initialBoard = boardRes.success && boardRes.data ? boardRes.data : []
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 reveal reveal-1">
        <span className="kicker mb-2">Communauté</span>
        <h1 className="title-giant text-4xl text-white md:text-5xl">Clans</h1>
        <p className="text-sm text-white/55">Rejoins une équipe, cumulez vos XP et grimpez ensemble au classement.</p>
      </div>
      <ClansClient initialMyClan={initialMyClan} initialBoard={initialBoard} />
    </main>
  )
}
