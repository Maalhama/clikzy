'use client'

import { useEffect, useState, useCallback, type ReactNode, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PixelSprite } from '@/components/collection/PixelSprite'
import { BASE_HERO } from '@/components/collection/pixelHero'

export type TourStep = {
  /** Valeur de l'attribut data-tour de la cible à encadrer. Absent (ou cible
   *  introuvable/cachée en responsive) -> étape rendue en carte centrée. */
  target?: string
  accent: string
  eyebrow: string
  title: string
  body: string
  icon: ReactNode
}

type Rect = { top: number; left: number; width: number; height: number }

type SpotlightTourProps = {
  open: boolean
  steps: TourStep[]
  onClose: () => void
  onFinish: () => void
  finalLabel: string
  /** Remplace le pied de page sur la dernière étape (ex: boutons d'inscription). */
  finalCta?: ReactNode
  ariaLabel: string
  mascotName?: string
}

const PAD = 10 // marge de l'encadré autour de la cible
const BUBBLE_W = 360
const BUBBLE_H = 280 // hauteur estimée de la bulle (pour le placement + le clamp à l'écran)

/**
 * Visite guidée « spotlight » dans la DA Cleekzy : un encadré néon assombrit
 * toute la page sauf la section ciblée (data-tour), glisse de section en section,
 * et une bulle-mascotte explique chaque zone. Les étapes sans cible (ou dont la
 * cible est masquée en responsive) s'affichent en carte centrée.
 */
export function SpotlightTour({
  open,
  steps,
  onClose,
  onFinish,
  finalLabel,
  finalCta,
  ariaLabel,
  mascotName = 'Cleek',
}: SpotlightTourProps) {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const s = steps[step]
  const last = step === steps.length - 1

  // Mesure la cible courante (null = carte centrée)
  const measure = useCallback(() => {
    const sel = steps[step]?.target
    if (!sel) {
      setRect(null)
      return
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${sel}"]`)
    if (!el) {
      setRect(null)
      return
    }
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) {
      setRect(null)
      return
    }
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
  }, [steps, step])

  // À chaque étape : scrolle la cible au centre, mesure, et suit scroll/resize
  useEffect(() => {
    if (!open) return
    const sel = steps[step]?.target
    const el = sel ? document.querySelector<HTMLElement>(`[data-tour="${sel}"]`) : null
    if (el) {
      // Amène la cible dans le haut (~22% du viewport) pour laisser la place à la bulle en dessous
      const targetY = window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.22
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
    }
    measure()
    const timers = [setTimeout(measure, 220), setTimeout(measure, 480)]
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, step, steps, measure])

  if (!mounted || !open || !s) return null

  const vh = window.innerHeight
  const vw = window.innerWidth

  // Place la bulle dessous la cible si possible, sinon dessus, sinon à côté,
  // sinon centrée — toujours bornée à l'écran (jamais hors-cadre).
  let wrapperStyle: CSSProperties
  if (rect) {
    const spaceBelow = vh - (rect.top + rect.height)
    const spaceAbove = rect.top
    let top: number
    let left = rect.left + rect.width / 2 - BUBBLE_W / 2 // par défaut : centré horizontalement sur la cible
    if (spaceBelow >= BUBBLE_H + 20) {
      top = rect.top + rect.height + 16
    } else if (spaceAbove >= BUBBLE_H + 20) {
      top = rect.top - BUBBLE_H - 16
    } else {
      // pas de place verticale (cible haute) : à côté si possible
      const roomRight = vw - (rect.left + rect.width)
      const roomLeft = rect.left
      if (roomRight >= BUBBLE_W + 28) {
        left = rect.left + rect.width + 16
        top = rect.top + rect.height / 2 - BUBBLE_H / 2
      } else if (roomLeft >= BUBBLE_W + 28) {
        left = rect.left - BUBBLE_W - 16
        top = rect.top + rect.height / 2 - BUBBLE_H / 2
      } else {
        top = vh / 2 - BUBBLE_H / 2
      }
    }
    top = Math.max(14, Math.min(top, vh - BUBBLE_H - 14))
    left = Math.max(14, Math.min(left, vw - BUBBLE_W - 14))
    wrapperStyle = { position: 'fixed', top, left, width: BUBBLE_W, maxWidth: 'calc(100vw - 28px)' }
  } else {
    wrapperStyle = {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: BUBBLE_W,
      maxWidth: 'calc(100vw - 28px)',
    }
  }

  const goNext = () => (last ? onFinish() : setStep(step + 1))

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120]"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          {/* Bloqueur de clics (transparent) : empêche d'interagir avec la page pendant la visite */}
          <div className="absolute inset-0" />

          {/* Voile : encadré-spotlight si cible, sinon assombrissement plein */}
          {rect ? (
            <div
              className="pointer-events-none fixed rounded-2xl"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                boxShadow: `0 0 0 9999px rgba(8,11,18,0.84)`,
                border: `2px solid ${s.accent}`,
                transition:
                  'top .45s cubic-bezier(.4,0,.2,1), left .45s cubic-bezier(.4,0,.2,1), width .45s cubic-bezier(.4,0,.2,1), height .45s cubic-bezier(.4,0,.2,1)',
              }}
            >
              <motion.span
                className="absolute inset-0 rounded-2xl"
                style={{ boxShadow: `0 0 24px 2px ${s.accent}, inset 0 0 16px -4px ${s.accent}` }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          )}

          {/* Bulle / carte (glisse vers la cible via transition CSS sur le wrapper) */}
          <div className="pointer-events-none" style={{ ...wrapperStyle, transition: 'top .4s ease, left .4s ease' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="surface-3 pointer-events-auto relative overflow-hidden rounded-2xl border p-4"
                style={{ borderColor: `${s.accent}55` }}
              >
                {/* Halo d'accent */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                  style={{ background: `${s.accent}26` }}
                  aria-hidden
                />

                <button
                  onClick={onClose}
                  aria-label="Passer la visite"
                  className="absolute right-3 top-3 z-10 text-[0.7rem] font-medium text-white/55 transition-colors hover:text-white"
                >
                  Passer
                </button>

                {/* Mascotte + en-tête */}
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
                      {mascotName}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded"
                        style={{ color: s.accent, background: `${s.accent}1A` }}
                      >
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

                {/* Points de progression */}
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  {steps.map((st, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      aria-label={`Étape ${i + 1} sur ${steps.length}`}
                      aria-current={i === step}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: i === step ? 22 : 6, background: i === step ? st.accent : 'rgba(255,255,255,0.16)' }}
                    />
                  ))}
                </div>

                {/* Pied de page */}
                <div className="mt-4">
                  {last && finalCta ? (
                    finalCta
                  ) : (
                    <div className="flex items-center gap-2.5">
                      {step > 0 && (
                        <button
                          onClick={() => setStep(step - 1)}
                          className="rounded-xl border border-white/10 px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
                        >
                          Précédent
                        </button>
                      )}
                      <button onClick={goNext} className="btn-arena flex-1 py-2.5 text-sm">
                        {last ? finalLabel : 'Suivant'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
