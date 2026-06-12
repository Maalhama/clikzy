'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'cleekzy-onboarding-done'

const STEPS = [
  {
    accent: '#FF4FD8',
    title: 'Le dernier clic gagne',
    body: 'Chaque partie a un compte à rebours. Clique pour le relancer et prendre la tête : si personne ne clique après toi avant la fin, le lot est à toi.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M9 3.5V2M5.06 5.06 4 4M3.5 9H2m1 11 5-5m1.5-6.5 9 3.5-4 2-2 4z" />
      </svg>
    ),
  },
  {
    accent: '#3CCBFF',
    title: '10 clics gratuits par jour',
    body: 'Tes crédits se rechargent chaque nuit à minuit. Gagne-en plus avec les mini-jeux, les quêtes du jour, les coffres et le parrainage.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    accent: '#9B5CFF',
    title: 'Progresse et équipe-toi',
    body: 'Chaque clic rapporte de l’XP. Monte de niveau, ouvre des coffres, équipe ton personnage et grimpe au classement. Les lots gagnés sont livrés chez toi.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.3 7L12 12l8.7-5M12 22V12" />
      </svg>
    ),
  },
] as const

/**
 * Onboarding première visite : 3 étapes pour expliquer la règle du jeu.
 * Affiché une seule fois (localStorage), uniquement pour un joueur connecté.
 */
export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {}
  }, [])

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setOpen(false)
  }

  if (!open || typeof window === 'undefined') return null
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Bienvenue sur Cleekzy" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm max-sm:min-h-[100lvh]">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-bg-secondary p-6 text-center"
      >
        {/* Halo d'accent */}
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-500"
          style={{ background: `${s.accent}33` }}
          aria-hidden
        />

        <button onClick={finish} aria-label="Passer l’introduction" className="absolute top-3 right-3 z-10 text-xs text-white/40 hover:text-white">
          Passer
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            <div
              className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{ color: s.accent, borderColor: `${s.accent}4D`, backgroundColor: `${s.accent}1A` }}
            >
              {s.icon}
            </div>
            <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
            <p className="mt-2 min-h-[72px] text-sm leading-relaxed text-white/55">{s.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* Points d'étape */}
        <div className="mb-4 mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                background: i === step ? s.accent : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => (last ? finish() : setStep(step + 1))}
          className="btn-arena w-full py-3 text-sm"
        >
          {last ? 'C’est parti !' : 'Suivant'}
        </button>
      </motion.div>
    </div>,
    document.body
  )
}
