import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getMiniGameEligibility } from '@/actions/miniGames'
import MiniGamesClient from './MiniGamesClient'

export const metadata = {
  title: 'Mini-Jeux quotidiens',
  description: 'Roue de la fortune, cartes à gratter, pachinko : une partie gratuite par jour et par jeu, des crédits à gagner. Résultats provably-fair vérifiables.',
  alternates: { canonical: '/mini-games' },
}

export default async function MiniGamesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const eligibilityResult = await getMiniGameEligibility()

  const eligibility = eligibilityResult.success && eligibilityResult.data
    ? eligibilityResult.data
    : {
        wheel: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
        scratch: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
        pachinko: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
        slots: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
        coinflip: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
        dice: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
      }

  return <MiniGamesClient initialEligibility={eligibility} />
}
