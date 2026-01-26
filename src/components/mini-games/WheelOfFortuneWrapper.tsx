/**
 * Wrapper Roue de la Fortune - Détection automatique 3D/2D
 * Utilise WheelOfFortune3D si supporté, sinon fallback vers version 2D
 */

'use client'

import dynamic from 'next/dynamic'
import { useCanUse3D } from '@/hooks/mini-games/use3DPerformance'
import WheelOfFortune from './WheelOfFortune'
import { Suspense } from 'react'

// Import dynamique pour eviter les erreurs SSR avec Three.js
const WheelOfFortune3D = dynamic(
  () => import('./3d/WheelOfFortune3D').then(mod => mod.WheelOfFortune3D),
  { ssr: false }
)

interface WheelOfFortuneWrapperProps {
  onComplete: (creditsWon: number) => void
  targetSegment: number
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
        <p className="text-white/60 text-sm">Chargement de la roue 3D...</p>
      </div>
    </div>
  )
}

/**
 * Wrapper intelligent Roue de la Fortune
 * Détecte les capacités 3D et choisit automatiquement la meilleure version
 */
export default function WheelOfFortuneWrapper({
  onComplete,
  targetSegment,
  disabled = false,
}: WheelOfFortuneWrapperProps) {
  const canUse3D = useCanUse3D()

  // Convertit le callback pour la version 3D
  const handle3DWin = (multiplier: number) => {
    onComplete(multiplier)
  }

  if (canUse3D) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <WheelOfFortune3D
          onWin={handle3DWin}
          targetSegment={targetSegment}
          isActive={!disabled}
        />
      </Suspense>
    )
  }

  // Fallback vers version 2D
  return (
    <WheelOfFortune
      onComplete={onComplete}
      targetSegment={targetSegment}
      disabled={disabled}
    />
  )
}
