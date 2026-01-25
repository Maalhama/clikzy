/**
 * Wrapper DiceRoll - Détection automatique 3D/2D
 * Utilise DiceRoll3D si supporté, sinon fallback vers version CSS 3D
 */

'use client'

import { useCanUse3D } from '@/hooks/mini-games/use3DPerformance'
import { DiceRoll3D } from './3d/DiceRoll3D'
import DiceRoll from './DiceRoll'
import { Suspense } from 'react'

interface DiceRollWrapperProps {
  onComplete: (creditsWon: number) => void
  diceResults: [number, number]
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
        <p className="text-white/60 text-sm">Chargement des dés 3D...</p>
      </div>
    </div>
  )
}

/**
 * Wrapper intelligent DiceRoll
 * Détecte les capacités 3D et choisit automatiquement la meilleure version
 */
export default function DiceRollWrapper({
  onComplete,
  diceResults,
  prizeAmount,
  disabled = false,
}: DiceRollWrapperProps) {
  const canUse3D = useCanUse3D()

  // Convertit le callback pour la version 3D
  const handle3DWin = (credits: number) => {
    onComplete(credits)
  }

  if (canUse3D) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DiceRoll3D
          onWin={handle3DWin}
          diceResults={diceResults}
          isActive={!disabled}
        />
      </Suspense>
    )
  }

  // Fallback vers version CSS 3D
  return (
    <DiceRoll
      onComplete={onComplete}
      diceResults={diceResults}
      prizeAmount={prizeAmount}
      disabled={disabled}
    />
  )
}
