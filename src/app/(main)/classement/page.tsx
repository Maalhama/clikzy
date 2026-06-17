import { getLeaderboard, getMyRank } from '@/actions/leaderboard'
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient'

export const metadata = {
  title: 'Classement des joueurs',
  description: 'Le classement Cleekzy du jour, de la semaine, du mois et de tous les temps. Gagne de l\'XP à chaque clic et grimpe dans l\'arène.',
  alternates: { canonical: '/classement' },
}

export default async function ClassementPage() {
  // Période par défaut (semaine) résolue côté serveur (SSR) -> SEO + plus de skeleton.
  // Le changement de période reste géré côté client.
  const [lbRes, rkRes] = await Promise.all([getLeaderboard('week', 50), getMyRank('week')])
  const initialRows = lbRes.success && lbRes.data ? lbRes.data : []
  const initialMe = rkRes.success && rkRes.data ? rkRes.data : null
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5 reveal reveal-1">
        <span className="kicker mb-2">Compétition</span>
        <h1 className="title-giant text-4xl text-white md:text-5xl">Classement <span className="text-neon-purple neon-text">mondial</span></h1>
        <p className="text-sm text-white/50">Grimpe en jouant, en accomplissant tes quêtes et en gagnant des parties.</p>
      </div>
      <LeaderboardClient initialPeriod="week" initialRows={initialRows} initialMe={initialMe} />
    </main>
  )
}
