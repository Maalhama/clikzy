/**
 * Hook pour détecter les capacités 3D de l'appareil
 * Permet de fallback vers 2D si nécessaire
 */

import { useState, useEffect } from 'react'

export interface PerformanceCapabilities {
  canUse3D: boolean
  isLowEnd: boolean
  isMobile: boolean
  supportsWebGL2: boolean
  hardwareConcurrency: number
  devicePixelRatio: number
}

/**
 * Détecte les capacités 3D de l'appareil
 * Retourne false pour les devices qui ne supportent pas bien la 3D
 */
export function use3DPerformance(): PerformanceCapabilities {
  // Default to false for SSR - prevents Three.js from being rendered on server
  const [capabilities, setCapabilities] = useState<PerformanceCapabilities>({
    canUse3D: false, // Start with false, will be set to true after client-side check
    isLowEnd: false,
    isMobile: false,
    supportsWebGL2: false, // Will be checked on client
    hardwareConcurrency: 4,
    devicePixelRatio: 1,
  })

  useEffect(() => {
    // Check WebGL2 support
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    const supportsWebGL2 = !!gl

    if (!supportsWebGL2) {
      setCapabilities({
        canUse3D: false,
        isLowEnd: true,
        isMobile: false,
        supportsWebGL2: false,
        hardwareConcurrency: 1,
        devicePixelRatio: window.devicePixelRatio || 1,
      })
      return
    }

    // Detect mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Detect low-end devices
    const hardwareConcurrency = navigator.hardwareConcurrency || 2
    const isLowEnd = hardwareConcurrency <= 2

    // On mobile low-end, disable 3D
    const canUse3D = !(isMobile && isLowEnd)

    // Get device pixel ratio (important for performance)
    const devicePixelRatio = window.devicePixelRatio || 1

    setCapabilities({
      canUse3D,
      isLowEnd,
      isMobile,
      supportsWebGL2,
      hardwareConcurrency,
      devicePixelRatio,
    })
  }, [])

  return capabilities
}

/**
 * Hook simplifié qui retourne juste si on peut utiliser la 3D
 */
export function useCanUse3D(): boolean {
  const { canUse3D } = use3DPerformance()
  return canUse3D
}
