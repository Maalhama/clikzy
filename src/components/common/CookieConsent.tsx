'use client'

import { useState, useEffect } from 'react'
import { useCookieConsent } from '@/hooks/useCookieConsent'

// Slide-in en CSS pur (plus de framer-motion) : ce composant vit dans le root layout,
// l'importer tirait framer-motion (~40 KB gzip) dans le bundle de BASE de toutes les routes.
export function CookieConsent() {
  const { hasConsented, accept, refuse } = useCookieConsent()
  const [mounted, setMounted] = useState(false) // présent dans le DOM
  const [visible, setVisible] = useState(false) // entré (slide-in)

  useEffect(() => {
    if (hasConsented) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => {
      setMounted(true)
      requestAnimationFrame(() => setVisible(true))
    }, 2000)
    return () => clearTimeout(timer)
  }, [hasConsented])

  function hide(action: () => void) {
    action()
    setVisible(false)
    setTimeout(() => setMounted(false), 300) // après la transition de sortie
  }

  if (!mounted) return null

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className={`fixed bottom-4 left-4 right-4 z-[60] transition-all duration-300 ease-out md:left-auto md:right-4 md:max-w-md ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
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
              <a href="/privacy" className="text-neon-purple hover:underline ml-1">
                En savoir plus
              </a>
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => hide(refuse)} className="btn-arena-ghost flex-1 py-2.5 text-xs">
            Refuser
          </button>
          <button onClick={() => hide(accept)} className="btn-arena flex-1 py-2.5 text-xs">
            Accepter
          </button>
        </div>
      </div>
    </div>
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
