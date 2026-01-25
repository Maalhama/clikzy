/**
 * Wrapper ScratchCard - Détection automatique 3D/2D
 * Utilise ScratchCard3D si supporté, sinon fallback vers version Canvas 2D
 */

'use client'

import { useCanUse3D } from '@/hooks/mini-games/use3DPerformance'
import { ScratchCard3D } from './3d/ScratchCard3D'
import ScratchCard from './ScratchCard'
import { Suspense } from 'react'

interface ScratchCardWrapperProps {
  onComplete: (creditsWon: number) => void
  prizeAmount: number
  disabled?: boolean
}

/**
 * Fallback de chargement
 */
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Chargement de la carte 3D...</p>
      </div>
    </div>
  )
}

/**
 * Wrapper intelligent ScratchCard
 * Détecte les capacités 3D et choisit automatiquement la meilleure version
 */
export default function ScratchCardWrapper({
  onComplete,
  prizeAmount,
  disabled = false,
}: ScratchCardWrapperProps) {
  const canUse3D = useCanUse3D()

  // Convertit le callback pour la version 3D
  const handle3DWin = (credits: number) => {
    onComplete(credits)
  }

  if (canUse3D) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ScratchCard3D
          onWin={handle3DWin}
          prizeAmount={prizeAmount}
          isActive={!disabled}
        />
      </Suspense>
    )
  }

  // Fallback vers version Canvas 2D
  return (
    <ScratchCard
      onComplete={onComplete}
      prizeAmount={prizeAmount}
      disabled={disabled}
    />
  )
}
