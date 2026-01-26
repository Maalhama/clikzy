/**
 * Wrapper SlotMachine - Détection automatique 3D/2D
 * Utilise SlotMachine3D si supporté, sinon fallback vers version 2D
 */

'use client'

import dynamic from 'next/dynamic'
import { useCanUse3D } from '@/hooks/mini-games/use3DPerformance'
import SlotMachine from './SlotMachine'
import { Suspense } from 'react'

// Import dynamique pour eviter les erreurs SSR avec Three.js
const SlotMachine3D = dynamic(
  () => import('./3d/SlotMachine3D').then(mod => mod.SlotMachine3D),
  { ssr: false }
)

interface SlotMachineWrapperProps {
  onComplete: (creditsWon: number) => void
  targetSymbols: number[]
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
        <p className="text-white/60 text-sm">Chargement de la machine à sous 3D...</p>
      </div>
    </div>
  )
}

/**
 * Wrapper intelligent SlotMachine
 * Détecte les capacités 3D et choisit automatiquement la meilleure version
 */
export default function SlotMachineWrapper({
  onComplete,
  targetSymbols,
  prizeAmount,
  disabled = false,
}: SlotMachineWrapperProps) {
  const canUse3D = useCanUse3D()

  // Convertit le callback pour la version 3D
  const handle3DWin = (credits: number) => {
    onComplete(credits)
  }

  if (canUse3D) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <SlotMachine3D
          onWin={handle3DWin}
          targetSymbols={targetSymbols}
          prizeAmount={prizeAmount}
          isActive={!disabled}
        />
      </Suspense>
    )
  }

  // Fallback vers version 2D
  return (
    <SlotMachine
      onComplete={onComplete}
      targetSymbols={targetSymbols}
      prizeAmount={prizeAmount}
      disabled={disabled}
    />
  )
}
