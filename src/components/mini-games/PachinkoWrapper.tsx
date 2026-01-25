/**
 * Wrapper Pachinko - Détection automatique 3D/2D
 * Utilise Pachinko3D si supporté, sinon fallback vers Pachinko 2D Canvas
 */

'use client'

import { useCanUse3D } from '@/hooks/mini-games/use3DPerformance'
import { Pachinko3D } from './3d/Pachinko3D'
import Pachinko from './Pachinko'
import { Suspense } from 'react'

interface PachinkoWrapperProps {
  onComplete: (creditsWon: number) => void
  targetSlot: number
  disabled?: boolean
}

/**
 * Fallback de chargement
 */
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Chargement de l'expérience 3D...</p>
      </div>
    </div>
  )
}

/**
 * Wrapper intelligent Pachinko
 * Détecte les capacités 3D et choisit automatiquement la meilleure version
 */
export default function PachinkoWrapper({
  onComplete,
  targetSlot,
  disabled = false,
}: PachinkoWrapperProps) {
  const canUse3D = useCanUse3D()

  // Convertit le callback pour la version 3D (multiplier → crédits gagnés)
  const handle3DWin = (multiplier: number) => {
    onComplete(multiplier)
  }

  if (canUse3D) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Pachinko3D
          onWin={handle3DWin}
          targetSlot={targetSlot}
          isActive={!disabled}
        />
      </Suspense>
    )
  }

  // Fallback vers version 2D Canvas
  return (
    <Pachinko
      onComplete={onComplete}
      targetSlot={targetSlot}
      disabled={disabled}
    />
  )
}
