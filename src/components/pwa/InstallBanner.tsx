'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  // Check if already dismissed in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
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
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-white">Installe CLEEKZY</span>
              <span className="ml-2 hidden text-xs text-white/50 sm:inline">
                Accès rapide depuis ton écran d&apos;accueil
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

      {/* iOS Installation Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl bg-bg-secondary border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                Installer sur iPhone/iPad
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold">
                    1
                  </div>
                  <p className="text-white/80 text-sm">
                    Appuie sur <span className="inline-flex items-center"><ShareIcon className="w-5 h-5 mx-1 text-neon-blue" /></span> en bas de Safari
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold">
                    2
                  </div>
                  <p className="text-white/80 text-sm">
                    Fais défiler et choisis &quot;Sur l&apos;écran d&apos;accueil&quot;
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold">
                    3
                  </div>
                  <p className="text-white/80 text-sm">
                    Appuie sur &quot;Ajouter&quot; en haut à droite
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-6 py-3 rounded-xl bg-white/10 text-white font-bold transition-colors hover:bg-white/20"
              >
                Compris !
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}
