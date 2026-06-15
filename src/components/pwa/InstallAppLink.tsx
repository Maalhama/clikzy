'use client'

import { useState } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallTour } from './IOSInstallTour'

/**
 * Point d'entrée PERMANENT pour installer l'app (footer) : même si l'user a fermé
 * le bandeau, il retrouve toujours « Installer l'app » ici. iOS -> tuto guidé Cleek ;
 * Android -> invite native. Caché si déjà installée (ou contexte non installable).
 */
export function InstallAppLink({ className }: { className?: string }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [showGuide, setShowGuide] = useState(false)

  // Rien à proposer si déjà installée, ou hors iOS sans invite native dispo (desktop).
  if (isInstalled || (!isIOS && !isInstallable)) return null

  async function handle() {
    if (isIOS) setShowGuide(true)
    else await install()
  }

  return (
    <>
      <button onClick={handle} className={className} aria-haspopup="dialog">
        Installer l&apos;app
      </button>
      <IOSInstallTour open={showGuide} onClose={() => setShowGuide(false)} />
    </>
  )
}
