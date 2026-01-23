'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCookieConsent } from '@/hooks/useCookieConsent'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const { hasConsented, accept, refuse } = useCookieConsent()

  useEffect(() => {
    if (!hasConsented) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setShowBanner(false)
    }
  }, [hasConsented])

  function handleAccept() {
    accept()
    setShowBanner(false)
  }

  function handleRefuse() {
    refuse()
    setShowBanner(false)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-[60] md:left-auto md:right-4 md:max-w-md"
        >
          <div className="p-4 rounded-2xl bg-bg-secondary/95 border border-white/10 shadow-xl shadow-black/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                <CookieIcon className="w-5 h-5 text-neon-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Cookies</h3>
                <p className="text-white/60 text-xs mt-1 leading-relaxed">
                  Nous utilisons des cookies pour améliorer ton expérience et analyser le trafic du site.
                  <a
                    href="/privacy"
                    className="text-neon-purple hover:underline ml-1"
                  >
                    En savoir plus
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleRefuse}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-sm hover:shadow-lg hover:shadow-neon-purple/30 transition-all"
              >
                Accepter
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CookieIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="8" r="1" fill="currentColor" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="13" r="1" fill="currentColor" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}
