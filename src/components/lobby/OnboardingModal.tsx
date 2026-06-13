'use client'

import { useEffect, useState } from 'react'
import { TutorialModal, type TutorialStep } from '@/components/tutorial/TutorialModal'

const STORAGE_KEY = 'cleekzy-onboarding-done'

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
const IcoCoin = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.2c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7-1.1 1.6-2.5 1.6-2.5.7-2.5 1.7 1.1 1.7 2.5 1.7 2.5-.7 2.5-1.7" />
  </svg>
)
const IcoCube = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.3 7L12 12l8.7-5M12 22V12" />
  </svg>
)
const IcoPackage = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M16.5 9.4 7.5 4.21M3 7l9 5 9-5M3 7v10l9 5 9-5V7M12 22V12" />
  </svg>
)
const IcoCrown = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
)

const STEPS: TutorialStep[] = [
  {
    accent: '#FF4FD8',
    eyebrow: 'Bienvenue',
    title: 'Bienvenue dans l’arène !',
    body: 'Content de te voir ici ! En une minute, je te montre comment rafler des lots et faire grimper ton niveau. Suis le guide.',
    icon: IcoSparkle,
  },
  {
    accent: '#9B5CFF',
    eyebrow: 'La règle d’or',
    title: 'Le dernier clic gagne',
    body: 'Chaque partie a un compte à rebours. Clique pour le relancer et prendre la tête : si personne ne clique après toi avant la fin, le lot est à toi. Plus la fin approche, plus ça chauffe.',
    icon: IcoCursor,
  },
  {
    accent: '#3CCBFF',
    eyebrow: 'Tes crédits',
    title: '10 clics gratuits par jour',
    body: 'Tes crédits se rechargent chaque nuit à minuit. Besoin de plus ? Les mini-jeux, les quêtes du jour, les coffres et le parrainage t’en rapportent. 1 crédit = 1 clic.',
    icon: IcoCoin,
  },
  {
    accent: '#9B5CFF',
    eyebrow: 'Progression',
    title: 'Monte en niveau et équipe-toi',
    body: 'Chaque clic rapporte de l’XP. Monte de niveau, ouvre des coffres, équipe ton personnage avec des cosmétiques et grimpe au classement face aux autres joueurs.',
    icon: IcoCube,
  },
  {
    accent: '#00FF88',
    eyebrow: 'Les lots',
    title: 'De vrais lots, livrés chez toi',
    body: 'Les produits que tu remportes sont 100% réels et expédiés à ton adresse. Retrouve toutes tes victoires et leur suivi dans ton profil.',
    icon: IcoPackage,
  },
  {
    accent: '#FFB800',
    eyebrow: 'Va plus loin',
    title: 'Passe V.I.P quand tu veux',
    body: 'Le statut V.I.P double tes crédits quotidiens, t’offre −10% sur les packs et débloque les lots premium. Rien d’obligatoire : tout se joue gratuitement.',
    icon: IcoCrown,
  },
]

/**
 * Onboarding première visite (joueur connecté), version détaillée : 6 étapes
 * guidées par la mascotte Cleek. Affiché une seule fois (localStorage).
 */
export function OnboardingModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {}
  }, [])

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setOpen(false)
  }

  return (
    <TutorialModal
      open={open}
      steps={STEPS}
      onClose={finish}
      onFinish={finish}
      finalLabel="C’est parti !"
      ariaLabel="Bienvenue sur Cleekzy"
      mascotName="Cleek"
    />
  )
}
