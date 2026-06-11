import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient'

export const metadata = { title: 'Classement · Cleekzy' }

export default function ClassementPage() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5 reveal reveal-1">
        <span className="kicker mb-2">Compétition</span>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Classement mondial</h1>
        <p className="text-sm text-white/50">Grimpe en jouant, en accomplissant tes quêtes et en gagnant des parties.</p>
      </div>
      <LeaderboardClient />
    </main>
  )
}
