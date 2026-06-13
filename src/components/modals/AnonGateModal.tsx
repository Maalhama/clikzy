'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface AnonGateModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal « tu n'as pas encore de compte » — affiché quand un visiteur anonyme
 * tente de jouer. Invite à l'inscription gratuite (pas d'achat de crédits
 * proposé : sans compte ça n'a pas de sens).
 */
export function AnonGateModal({ isOpen, onClose }: AnonGateModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Crée ton compte pour jouer"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="surface-3 relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 p-6 text-center"
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icône éclair */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink shadow-[0_0_26px_-4px_rgba(155,92,255,0.75)]">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h2 className="font-display text-xl font-bold text-white">Crée ton compte pour jouer</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
              Tu n&apos;as pas encore de compte. Inscris-toi gratuitement pour cliquer, viser les lots réels
              et récupérer <span className="font-semibold text-neon-purple">10 crédits offerts</span>.
            </p>

            <Link href="/register" className="btn-arena mt-5 block w-full py-3 text-sm">
              Créer mon compte gratuit
            </Link>
            <Link href="/login" className="mt-2 block w-full py-2 text-sm text-white/55 transition-colors hover:text-white">
              J&apos;ai déjà un compte
            </Link>

            <div className="mt-4 flex items-center justify-center gap-2 text-[0.7rem] text-white/35">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Jeu 100% gratuit · Aucun paiement requis
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
