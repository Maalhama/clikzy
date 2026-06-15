'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallTour } from './IOSInstallTour'

export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  // Dismiss persistant via clé VERSIONNÉE : bumper la version (-v2, -v3…) ré-affiche
  // le bandeau pour tous ceux qui l'avaient fermé (reset du « ne plus afficher »).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('pwa-install-dismissed-v2')
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10)
        // Show again after 7 days
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
          setIsDismissed(true)
        }
      }
    }
  }, [])

  function handleDismiss() {
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true)
    } else {
      const success = await install()
      if (success) {
        handleDismiss()
      }
    }
  }

  // Don't show if installed, dismissed, or not installable (unless iOS)
  if (isInstalled || isDismissed || (!isInstallable && !isIOS)) {
    return null
  }

  return (
    <>
      {/* Bandeau fermable DANS le flux, juste sous le header : il ne recouvre
          plus les notifications en bas à droite. */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="relative z-30 overflow-hidden border-b border-neon-purple/25 bg-gradient-to-r from-neon-purple/15 via-bg-secondary/90 to-neon-pink/15 backdrop-blur-sm"
        >
          <div className="mx-auto flex min-h-[2.875rem] max-w-7xl items-center gap-3 px-4 md:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-white">L&apos;app Cleekzy</span>
              <span className="ml-2 hidden text-xs text-white/50 sm:inline">
                Sur ton écran d&apos;accueil, en un cleek
              </span>
            </div>
            <button
              onClick={handleInstall}
              className="btn-arena shrink-0 px-3.5 py-1.5 text-[0.65rem]"
            >
              Installer
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Fermer l'invitation d'installation"
              className="shrink-0 p-1 text-white/40 transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Tuto d'installation iOS guidé par la mascotte Cleek (DA Cleekzy) */}
      <IOSInstallTour open={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  )
}
