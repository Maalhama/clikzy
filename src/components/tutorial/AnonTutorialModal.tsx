'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TutorialModal, type TutorialStep } from './TutorialModal'

const SEEN_KEY = 'cleekzy-anon-tutorial-seen'

/* Icônes (héritent de currentColor) */
const IcoSparkle = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" />
    <path d="M19 14l.8 2.7L22 17.5l-2.2.8L19 21l-.8-2.7L16 17.5l2.2-.8L19 14z" opacity="0.7" />
  </svg>
)
const IcoCursor = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M5 3l5 16 2.5-6.5L19 10 5 3z" />
  </svg>
)
const IcoGift = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" />
    <path d="M12 8S9.5 3.5 7.5 4.5 6 8 12 8zm0 0s2.5-4.5 4.5-3.5S18 8 12 8z" />
  </svg>
)
const IcoBolt = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const IcoBoltLg = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const IcoCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const ANON_STEPS: TutorialStep[] = [
  {
    accent: '#FF4FD8',
    eyebrow: 'Bienvenue',
    title: 'Salut, moi c’est Cleek !',
    body: 'Bienvenue dans l’arène Cleekzy, où tu remportes de vrais produits — high-tech, mode, cartes à collectionner — pour quelques centimes. Laisse-moi t’expliquer en 30 secondes.',
    icon: IcoSparkle,
  },
  {
    accent: '#9B5CFF',
    eyebrow: 'La règle d’or',
    title: 'Le dernier clic gagne',
    body: 'Chaque partie a un compte à rebours. Un clic le relance à fond et te place en tête. Si personne ne clique après toi avant le zéro… le lot est à toi. Simple, nerveux, addictif.',
    icon: IcoCursor,
  },
  {
    accent: '#3CCBFF',
    eyebrow: '100% gratuit',
    title: 'Joue sans dépenser un centime',
    body: 'Tu reçois des clics gratuits chaque jour, et tu en gagnes plus avec les mini-jeux et les quêtes. Les lots que tu remportes sont bien réels et livrés directement chez toi.',
    icon: IcoGift,
  },
  {
    accent: '#FF4FD8',
    eyebrow: 'À toi de jouer',
    title: 'Prêt à tenter ta chance ?',
    body: 'Crée ton compte gratuit pour cliquer, suivre tes parties en direct et viser ton premier lot. Ça prend 20 secondes, et tu repars avec des crédits offerts.',
    icon: IcoBolt,
  },
]

const SIGNUP_CTA = (
  <div className="space-y-2">
    <Link href="/register" className="btn-arena flex w-full items-center justify-center gap-2 py-3 text-sm">
      {IcoBoltLg}
      Créer mon compte gratuit
    </Link>
    <Link
      href="/login"
      className="block w-full py-2 text-center text-sm text-white/55 transition-colors hover:text-white"
    >
      J’ai déjà un compte
    </Link>
    <div className="flex items-center justify-center gap-1.5 pt-0.5 text-[0.7rem] text-white/35">
      <span className="text-success">{IcoCheck}</span>
      100% gratuit · +10 crédits offerts à l’inscription
    </div>
  </div>
)

/**
 * Tuto d'accueil pour le visiteur NON connecté qui tente de jouer depuis le
 * lobby. Explique le concept étape par étape puis l'invite à créer un compte.
 * S'il a déjà vu le tuto, il se rouvre directement sur l'étape d'inscription
 * (on ne réexplique pas tout à chaque clic).
 */
export function AnonTutorialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [start, setStart] = useState(0)

  useEffect(() => {
    if (!open) return
    try {
      const seen = localStorage.getItem(SEEN_KEY)
      setStart(seen ? ANON_STEPS.length - 1 : 0)
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      setStart(0)
    }
  }, [open])

  return (
    <TutorialModal
      open={open}
      startStep={start}
      steps={ANON_STEPS}
      onClose={onClose}
      onFinish={onClose}
      finalLabel="Créer mon compte"
      finalCta={SIGNUP_CTA}
      ariaLabel="Découvre Cleekzy"
      mascotName="Cleek"
    />
  )
}
