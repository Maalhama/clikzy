/**
 * Wrapper CoinFlip - Détection automatique 3D/2D
 * Utilise CoinFlip3D si supporté, sinon fallback vers version CSS 3D
 */

'use client'

import dynamic from 'next/dynamic'
import { useCanUse3D } from '@/hooks/mini-games/use3DPerformance'
import CoinFlip from './CoinFlip'
import { Suspense } from 'react'

// Import dynamique pour eviter les erreurs SSR avec Three.js
const CoinFlip3D = dynamic(
  () => import('./3d/CoinFlip3D').then(mod => mod.CoinFlip3D),
  { ssr: false }
)

interface CoinFlipWrapperProps {
  onComplete: (creditsWon: number) => void
  result: 'heads' | 'tails'
  prizeAmount: number
  disabled?: boolean
}

/**
 * Fallback de chargement
 */
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900/20 to-purple-900/20 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Chargement de la pièce 3D...</p>
      </div>
    </div>
  )
}

/**
 * Wrapper intelligent CoinFlip
 * Détecte les capacités 3D et choisit automatiquement la meilleure version
 */
export default function CoinFlipWrapper({
  onComplete,
  result,
  prizeAmount,
  disabled = false,
}: CoinFlipWrapperProps) {
  const canUse3D = useCanUse3D()

  // Convertit le callback pour la version 3D
  const handle3DWin = (credits: number) => {
    onComplete(credits)
  }

  if (canUse3D) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CoinFlip3D
          onWin={handle3DWin}
          result={result}
          prizeAmount={prizeAmount}
          isActive={!disabled}
        />
      </Suspense>
    )
  }

  // Fallback vers version CSS 3D
  return (
    <CoinFlip
      onComplete={onComplete}
      result={result}
      prizeAmount={prizeAmount}
      disabled={disabled}
    />
  )
}
