'use client'

import { useEffect } from 'react'

/**
 * Enregistre le service worker globalement (pas seulement quand l'user touche les
 * notifications). Requis pour que l'invite d'installation Android (beforeinstallprompt)
 * se déclenche, et pour que le push fonctionne partout. register() est idempotent.
 */
export function SWRegister() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((e) => console.error('[SW] registration failed:', e))
    }
  }, [])
  return null
}
