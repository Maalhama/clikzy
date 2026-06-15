'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PixelSprite } from '@/components/collection/PixelSprite'
import { BASE_HERO } from '@/components/collection/pixelHero'
import { usePWAInstall } from '@/hooks/usePWAInstall'

/* Icônes (héritent de currentColor) */
const IcoShare = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M12 3v13M8 7l4-4 4 4M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
  </svg>
)
const IcoAddHome = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
)
const IcoSafari = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-3.5 w-3.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2z" fill="currentColor" stroke="none" />
  </svg>
)
const IcoSparkle = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" />
  </svg>
)

type Step = {
  accent: string
  eyebrow: string
  title: string
  body: ReactNode
  icon: ReactNode
  visual?: ReactNode
}

/* Visuel : fausse rangée « Sur l'écran d'accueil » de la feuille de partage iOS. */
const ShareSheetRow = (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-3 flex items-center justify-between rounded-xl border border-neon-purple/40 bg-neon-purple/10 px-3 py-2.5"
    style={{ boxShadow: '0 0 18px -6px #9B5CFF' }}
  >
    <span className="text-sm font-semibold text-white">Sur l&apos;écran d&apos;accueil</span>
    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/25 text-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
        <path d="M12 6v12M6 12h12" strokeLinecap="round" />
      </svg>
    </span>
  </motion.div>
)

/* Vrai Safari : le bouton Partager est dans la barre du bas. */
const SAFARI_STEPS: Step[] = [
  {
    accent: '#3CCBFF',
    eyebrow: 'Étape 1 sur 3',
    title: 'Appuie sur « Partager »',
    body: (
      <>
        Tout en bas de Safari, le petit carré avec une flèche qui monte (
        <span className="mx-0.5 inline-flex translate-y-0.5 text-neon-blue">{IcoShare}</span>). Touche-le.
      </>
    ),
    icon: IcoShare,
  },
  {
    accent: '#9B5CFF',
    eyebrow: 'Étape 2 sur 3',
    title: '« Sur l’écran d’accueil »',
    body: <>Fais défiler (ou « Voir plus »), puis touche cette ligne :</>,
    icon: IcoAddHome,
    visual: ShareSheetRow,
  },
  {
    accent: '#FFB800',
    eyebrow: 'Dernière étape',
    title: 'Et voilà, on y est !',
    body: <>Touche « Ajouter » en haut à droite. Cleekzy débarque sur ton écran d&apos;accueil — je t&apos;y attends !</>,
    icon: IcoSparkle,
  },
]

/* Navigateur in-app (Insta, TikTok…) ou Chrome iOS : l'install ne marche que dans
   Safari -> on guide d'abord vers Safari (via le menu •••). */
const INAPP_STEPS: Step[] = [
  {
    accent: '#3CCBFF',
    eyebrow: 'Étape 1 sur 3',
    title: 'Ouvre dans Safari',
    body: (
      <>
        Pour installer l&apos;app, touche le menu (
        <span className="mx-0.5 inline-flex font-bold tracking-[0.1em] text-neon-blue">•••</span>) en bas à
        <span className="font-semibold text-white"> droite</span>, puis « Ouvrir dans Safari ».
      </>
    ),
    icon: IcoSafari,
  },
  {
    accent: '#9B5CFF',
    eyebrow: 'Étape 2 sur 3',
    title: 'Dans Safari : « Partager »',
    body: (
      <>
        Une fois dans Safari, touche le bouton Partager (
        <span className="mx-0.5 inline-flex translate-y-0.5 text-neon-purple">{IcoShare}</span>) en bas, puis « Voir plus ».
      </>
    ),
    icon: IcoShare,
  },
  {
    accent: '#FFB800',
    eyebrow: 'Dernière étape',
    title: '« Sur l’écran d’accueil »',
    body: <>Touche cette ligne, puis « Ajouter ». Cleekzy arrive sur ton écran d&apos;accueil !</>,
    icon: IcoAddHome,
    visual: ShareSheetRow,
  },
]

/**
 * Tuto d'installation iOS dans la DA Cleekzy, ADAPTATIF : la mascotte Cleek guide
 * en 3 étapes. En vrai Safari -> bouton Partager (barre du bas, flèche centrée).
 * En navigateur in-app (réseaux) / Chrome iOS -> on guide d'abord vers Safari via
 * le menu ••• (flèche en bas à droite), car l'install standalone n'y marche pas.
 */
export function IOSInstallTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isInAppBrowser } = usePWAInstall()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  if (!mounted) return null

  const STEPS = isInAppBrowser ? INAPP_STEPS : SAFARI_STEPS
  const s = STEPS[step]
  const last = step === STEPS.length - 1
  const goNext = () => (last ? onClose() : setStep(step + 1))

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="ios-tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex flex-col items-center bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Installer Cleekzy sur iPhone"
        >
          {/* Bulle-mascotte, ancrée en haut pour laisser la barre du navigateur visible */}
          <div className="mt-[9vh] w-full max-w-sm px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="surface-3 relative overflow-hidden rounded-2xl border p-4"
                style={{ borderColor: `${s.accent}55` }}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                  style={{ background: `${s.accent}26` }}
                  aria-hidden
                />

                <button
                  onClick={onClose}
                  aria-label="Fermer le guide d'installation"
                  className="absolute right-3 top-3 z-10 text-[0.7rem] font-medium text-white/40 transition-colors hover:text-white"
                >
                  Passer
                </button>

                <div className="relative flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <motion.div
                      className="absolute inset-0 -z-10 rounded-full blur-xl"
                      style={{ background: `${s.accent}45` }}
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      aria-hidden
                    />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                      <PixelSprite layers={[BASE_HERO]} size={58} className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]" />
                    </motion.div>
                    <div className="mt-0.5 text-center text-[0.55rem] font-bold uppercase tracking-[0.15em]" style={{ color: s.accent }}>
                      Cleek
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded" style={{ color: s.accent, background: `${s.accent}1A` }}>
                        {s.icon}
                      </span>
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.16em]" style={{ color: s.accent }}>
                        {s.eyebrow}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold leading-tight text-white">{s.title}</h3>
                  </div>
                </div>

                <p className="relative mt-2.5 text-sm leading-relaxed text-white/60">{s.body}</p>
                {s.visual}

                <div className="mt-4 flex items-center justify-center gap-1.5">
                  {STEPS.map((st, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      aria-label={`Étape ${i + 1} sur ${STEPS.length}`}
                      aria-current={i === step}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: i === step ? 22 : 6, background: i === step ? st.accent : 'rgba(255,255,255,0.16)' }}
                    />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2.5">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="rounded-xl border border-white/10 px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Précédent
                    </button>
                  )}
                  <button onClick={goNext} className="btn-arena flex-1 py-2.5 text-sm">
                    {last ? 'C’est parti !' : 'Suivant'}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Flèche néon vers le point d'action de l'étape 1 : le menu ••• (bas-droite)
              en in-app, le bouton Partager (bas-centre) en Safari. */}
          <AnimatePresence>
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`pointer-events-none absolute flex flex-col items-center gap-2 ${
                  isInAppBrowser ? 'bottom-2 right-3' : 'inset-x-0 bottom-3'
                }`}
              >
                <span
                  className="rounded-full border border-neon-blue/40 bg-neon-blue/10 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-neon-blue"
                  style={{ boxShadow: '0 0 20px -6px #3CCBFF' }}
                >
                  {isInAppBrowser ? 'Le menu ••• est ici' : 'Le bouton Partager est là'}
                </span>
                <motion.svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3CCBFF"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-9 w-9 drop-shadow-[0_0_10px_#3CCBFF]"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path d="M12 4v15M6 13l6 6 6-6" />
                </motion.svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
