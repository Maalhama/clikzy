'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cleekzy_sound_enabled'

/**
 * Préférence sonore persistée (localStorage) : laisse le JOUEUR couper ou réactiver
 * les effets sonores du jeu (battement, clic, victoire). Libre choix de l'utilisateur
 * plutôt qu'un `useSounds(true)` figé.
 *
 * SSR-safe : démarre à `true` (cohérent serveur/1er rendu) puis se synchronise depuis
 * localStorage au montage, ce qui évite tout mismatch d'hydratation.
 */
export function useSoundPreference() {
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'false') setSoundEnabled(false)
    } catch {
      // localStorage indisponible (navigation privée) : on garde le défaut.
    }
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore : la préférence ne sera juste pas persistée
      }
      return next
    })
  }, [])

  return { soundEnabled, toggleSound }
}
