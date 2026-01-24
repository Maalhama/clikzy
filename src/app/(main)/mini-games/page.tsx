import { getMiniGameEligibility } from '@/actions/miniGames'
import MiniGamesClient from './MiniGamesClient'

export const metadata = {
  title: 'Mini-Jeux | Cleekzy',
  description: 'Jouez à nos mini-jeux quotidiens et gagnez des crédits gratuits !',
}

export default async function MiniGamesPage() {
  const eligibilityResult = await getMiniGameEligibility()

  const eligibility = eligibilityResult.success && eligibilityResult.data
    ? eligibilityResult.data
    : {
        wheel: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
        scratch: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
        pachinko: { canPlay: true, lastPlayedAt: null, nextPlayAt: null },
      }

  return <MiniGamesClient initialEligibility={eligibility} />
}
