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
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-4 md:w-80"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-secondary/80 border border-neon-purple/30 shadow-xl shadow-black/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Installe CLIKZY</h3>
                <p className="text-white/50 text-xs mt-0.5">
                  Accès rapide depuis ton écran d&apos;accueil
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 -mt-1 -mr-1 text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleInstall}
              className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-sm hover:shadow-lg hover:shadow-neon-purple/30 transition-all"
            >
              Installer l&apos;app
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
