'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

/**
 * Error boundary pour les routes (main) : lobby, game, profile, mini-games.
 * Rendu À L'INTÉRIEUR du layout (main) → le Header et le contexte sont conservés,
 * contrairement à global-error qui remplace toute la page.
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">Une erreur est survenue</h2>
      <p className="mt-2 max-w-md text-white/60">
        Quelque chose s&apos;est mal passé de notre côté. Ta progression est sauvegardée — tu peux réessayer.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-white/10 px-5 py-2.5 font-medium text-white transition hover:bg-white/20"
      >
        Réessayer
      </button>
    </div>
  )
}
