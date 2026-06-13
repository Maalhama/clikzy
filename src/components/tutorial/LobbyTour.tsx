'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SpotlightTour, type TourStep } from './SpotlightTour'

/* Icônes (héritent de currentColor) */
const IcoSparkle = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" />
  </svg>
)
const IcoCursor = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M5 3l5 16 2.5-6.5L19 10 5 3z" />
  </svg>
)
const IcoBolt = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const IcoFilter = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M3 5h18M6 12h12M10 19h4" />
  </svg>
)
const IcoCrown = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
)
const IcoTrophy = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M7 4h10v3a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 16h6M10 16v4M14 16v4M8 20h8" />
  </svg>
)
const IcoCoin = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.2c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7-1.1 1.6-2.5 1.6-2.5.7-2.5 1.7 1.1 1.7 2.5 1.7 2.5-.7 2.5-1.7" />
  </svg>
)
const IcoGift = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" />
    <path d="M12 8S9.5 3.5 7.5 4.5 6 8 12 8zm0 0s2.5-4.5 4.5-3.5S18 8 12 8z" />
  </svg>
)

const ANON_STEPS: TourStep[] = [
  { accent: '#FF4FD8', eyebrow: 'Bienvenue', title: 'Salut, moi c’est Cleek !', body: 'Je te fais visiter l’arène en 20 secondes. Ici, tu remportes de vrais produits pour quelques centimes.', icon: IcoSparkle },
  { target: 'games', accent: '#9B5CFF', eyebrow: 'Les parties', title: 'Vise un produit', body: 'Chaque carte est un produit réel à gagner. La règle : le DERNIER clic avant le zéro remporte le lot.', icon: IcoCursor },
  { target: 'stats', accent: '#3CCBFF', eyebrow: 'En direct', title: 'L’arène vit en temps réel', body: 'Parties actives, phase finale, et le jackpot communautaire qui grossit à chaque clic.', icon: IcoBolt },
  { target: 'filters', accent: '#9B5CFF', eyebrow: 'Navigation', title: 'Trouve ta partie', body: 'Filtre par phase finale, parties qui démarrent bientôt, lots premium ou tes favoris.', icon: IcoFilter },
  { target: 'vip', accent: '#FFB800', eyebrow: 'Premium', title: 'Le statut V.I.P', body: 'Plus tard, le V.I.P te donne 2× crédits/jour, −10% sur les packs et les lots premium. Rien d’obligatoire.', icon: IcoCrown },
  { target: 'winners', accent: '#00FF88', eyebrow: 'La preuve', title: 'Ils ont gagné pour de vrai', body: 'Les derniers gagnants s’affichent en direct. Demain, ça peut être toi.', icon: IcoTrophy },
  { accent: '#FF4FD8', eyebrow: 'À toi de jouer', title: 'Prêt à tenter ta chance ?', body: 'Crée ton compte gratuit pour cliquer et viser ton premier lot. 20 secondes, et +10 crédits offerts.', icon: IcoBolt },
]

const CONNECTED_STEPS: TourStep[] = [
  { accent: '#FF4FD8', eyebrow: 'Bienvenue', title: 'Bienvenue dans l’arène !', body: 'Suis-moi, je te montre l’essentiel pour rafler des lots et progresser.', icon: IcoSparkle },
  { target: 'games', accent: '#9B5CFF', eyebrow: 'Les parties', title: 'Le dernier clic gagne', body: 'Clique pour relancer le compte à rebours et prendre la tête. Si personne ne clique après toi, le lot est à toi.', icon: IcoCursor },
  { target: 'credits', accent: '#3CCBFF', eyebrow: 'Tes crédits', title: '1 crédit = 1 clic', body: 'Tu as 10 crédits gratuits par jour, rechargés à minuit. Gagne-en plus avec les mini-jeux, les quêtes et les coffres.', icon: IcoCoin },
  { target: 'rewards', accent: '#9B5CFF', eyebrow: 'Gratuit chaque jour', title: 'Récompenses & coffres', body: 'Récupère ta récompense du jour et ouvre tes coffres gratuits pour des crédits et des cosmétiques.', icon: IcoGift },
  { target: 'filters', accent: '#3CCBFF', eyebrow: 'Navigation', title: 'Trouve ta partie', body: 'Filtre par phase finale, bientôt, lots premium ou favoris pour cibler les bonnes occasions.', icon: IcoFilter },
  { target: 'winners', accent: '#00FF88', eyebrow: 'En direct', title: 'Les derniers gagnants', body: 'Vois qui vient de remporter un lot, en temps réel. Tes victoires arriveront ici aussi.', icon: IcoTrophy },
  { accent: '#FFB800', eyebrow: 'C’est parti', title: 'À toi de jouer !', body: 'Tu sais tout. Choisis une partie, clique au bon moment, et tente de remporter ton premier lot.', icon: IcoCrown },
]

const IcoBoltLg = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const SIGNUP_CTA = (
  <div className="space-y-2">
    <Link href="/register" className="btn-arena flex w-full items-center justify-center gap-2 py-2.5 text-sm">
      {IcoBoltLg}
      Créer mon compte gratuit
    </Link>
    <Link href="/login" className="block w-full py-1.5 text-center text-sm text-white/55 transition-colors hover:text-white">
      J’ai déjà un compte
    </Link>
  </div>
)

/**
 * Visite guidée du lobby, lancée AUTOMATIQUEMENT à la 1ère arrivée (anon ou
 * connecté), une seule fois (localStorage). Anon -> 7 étapes + CTA inscription ;
 * connecté -> 7 étapes détaillées. Encadré spotlight section par section.
 */
export function LobbyTour({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  // Connecté : même clé que l'ancien onboarding (compat logique calendrier).
  const key = isLoggedIn ? 'cleekzy-onboarding-done' : 'cleekzy-anon-tour-done'

  useEffect(() => {
    // Délai : laisse le lobby se peindre pour que les cibles soient mesurables.
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(key)) setOpen(true)
      } catch {}
    }, 800)
    return () => clearTimeout(t)
  }, [key])

  const finish = () => {
    try {
      localStorage.setItem(key, '1')
    } catch {}
    setOpen(false)
  }

  return (
    <SpotlightTour
      open={open}
      steps={isLoggedIn ? CONNECTED_STEPS : ANON_STEPS}
      onClose={finish}
      onFinish={finish}
      finalLabel={isLoggedIn ? 'C’est parti !' : 'Créer mon compte'}
      finalCta={isLoggedIn ? undefined : SIGNUP_CTA}
      ariaLabel="Visite guidée de Cleekzy"
      mascotName="Cleek"
    />
  )
}
