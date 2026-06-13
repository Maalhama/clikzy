'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PixelSprite } from '@/components/collection/PixelSprite'
import { BASE_HERO } from '@/components/collection/pixelHero'

export type TutorialStep = {
  /** Couleur néon d'accent de l'étape (hex). */
  accent: string
  eyebrow: string
  title: string
  body: string
  /** Petite icône SVG (16-20px) affichée dans la pastille d'accent. */
  icon: ReactNode
}

type TutorialModalProps = {
  open: boolean
  steps: TutorialStep[]
  /** Étape de départ (permet de rouvrir directement sur le CTA). */
  startStep?: number
  /** Fermeture (bouton « Passer » / backdrop). */
  onClose: () => void
  /** Validation de la dernière étape (bouton final par défaut). */
  onFinish: () => void
  /** Libellé du bouton de la dernière étape (ignoré si finalCta fourni). */
  finalLabel: string
  /** Contenu remplaçant le pied de page sur la dernière étape (ex: boutons d'inscription). */
  finalCta?: ReactNode
  ariaLabel: string
  /** Nom affiché sous la mascotte. */
  mascotName?: string
}

/**
 * Moteur de tuto premium et réutilisable, dans la DA Cleekzy : mascotte pixel
 * « Cleek » qui flotte avec un halo néon, bulle de dialogue à ergot, thème de
 * couleur par étape, transitions ressort, points de progression cliquables et
 * étincelles sur la dernière étape. Utilisé pour l'onboarding anon ET connecté.
 */
export function TutorialModal({
  open,
  steps,
  startStep = 0,
  onClose,
  onFinish,
  finalLabel,
  finalCta,
  ariaLabel,
  mascotName = 'Cleek',
}: TutorialModalProps) {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(startStep)

  useEffect(() => setMounted(true), [])
  // Réinitialise sur l'étape de départ à chaque ouverture
  useEffect(() => {
    if (open) setStep(Math.min(Math.max(startStep, 0), steps.length - 1))
  }, [open, startStep, steps.length])

  if (!mounted) return null

  const s = steps[step] ?? steps[0]
  const last = step === steps.length - 1

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="tutorial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 max-sm:min-h-[100lvh]"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

          {/* Carte */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="surface-3 relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10"
          >
            {/* Aura d'accent pulsante */}
            <motion.div
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: `${s.accent}33` }}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
            {/* Étincelles (dernière étape) */}
            <AnimatePresence>
              {last && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                  {[
                    { left: '12%', top: '18%', d: 0 },
                    { left: '84%', top: '24%', d: 0.4 },
                    { left: '22%', top: '70%', d: 0.8 },
                    { left: '76%', top: '64%', d: 1.2 },
                    { left: '50%', top: '12%', d: 0.6 },
                  ].map((p, i) => (
                    <motion.span
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full"
                      style={{ left: p.left, top: p.top, background: s.accent }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0], y: [0, -14, -26] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: p.d, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Passer */}
            <button
              onClick={onClose}
              aria-label="Passer le tutoriel"
              className="absolute right-4 top-4 z-20 text-xs font-medium text-white/40 transition-colors hover:text-white"
            >
              Passer
            </button>

            <div className="relative px-6 pb-6 pt-10 sm:px-8">
              {/* Mascotte + bulle */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
                {/* Mascotte Cleek */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    className="absolute inset-0 -z-10 rounded-full blur-2xl"
                    style={{ background: `${s.accent}40` }}
                    animate={{ scale: [1, 1.14, 1], opacity: [0.45, 0.8, 0.45] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden
                  />
                  <motion.div
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      key={step}
                      initial={{ scale: 0.8, rotate: -7 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 13 }}
                    >
                      <PixelSprite
                        layers={[BASE_HERO]}
                        size={104}
                        className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
                      />
                    </motion.div>
                  </motion.div>
                  {/* Ombre au sol */}
                  <div className="mx-auto -mt-1 h-2 w-14 rounded-full bg-black/45 blur-md" aria-hidden />
                  <div
                    className="mt-1.5 text-center text-[0.6rem] font-bold uppercase tracking-[0.18em]"
                    style={{ color: s.accent }}
                  >
                    {mascotName}
                  </div>
                </div>

                {/* Bulle de dialogue */}
                <div className="relative w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, scale: 0.92, x: 14 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.96, x: -14 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                      className="relative rounded-2xl border bg-white/[0.03] p-5"
                      style={{ borderColor: `${s.accent}40` }}
                    >
                      {/* Ergot (desktop : pointe à gauche / mobile : pointe en haut) */}
                      <span
                        className="absolute -left-1.5 top-9 hidden h-3 w-3 rotate-45 border-b border-l bg-[#141B2D] sm:block"
                        style={{ borderColor: `${s.accent}40` }}
                        aria-hidden
                      />
                      <span
                        className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t bg-[#141B2D] sm:hidden"
                        style={{ borderColor: `${s.accent}40` }}
                        aria-hidden
                      />

                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-md"
                          style={{ color: s.accent, background: `${s.accent}1A` }}
                        >
                          {s.icon}
                        </span>
                        <span
                          className="text-[0.62rem] font-bold uppercase tracking-[0.18em]"
                          style={{ color: s.accent }}
                        >
                          {s.eyebrow}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold leading-tight text-white">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Points de progression */}
              <div className="mt-6 flex items-center justify-center gap-1.5">
                {steps.map((st, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Étape ${i + 1} sur ${steps.length}`}
                    aria-current={i === step}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 24 : 6,
                      background: i === step ? st.accent : 'rgba(255,255,255,0.16)',
                    }}
                  />
                ))}
              </div>

              {/* Pied de page */}
              <div className="mt-5">
                {last && finalCta ? (
                  finalCta
                ) : (
                  <div className="flex items-center gap-3">
                    {step > 0 && (
                      <button
                        onClick={() => setStep(step - 1)}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
                      >
                        Précédent
                      </button>
                    )}
                    <button
                      onClick={() => (last ? onFinish() : setStep(step + 1))}
                      className="btn-arena flex-1 py-3 text-sm"
                    >
                      {last ? finalLabel : 'Suivant'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
