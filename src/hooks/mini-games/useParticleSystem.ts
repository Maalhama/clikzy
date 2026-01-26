'use client'

import { useEffect, useRef, useCallback } from 'react'
import { ParticleManager, ParticleConfig } from '@/lib/particles/ParticleSystem'

/**
 * Hook pour gérer un système de particules Canvas
 *
 * @param canvasRef - Référence au canvas HTML
 * @param options - Options de configuration
 * @returns Fonctions de contrôle du système de particules
 */
export function useParticleSystem(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options?: {
    maxPoolSize?: number
    autoUpdate?: boolean
  }
) {
  const managerRef = useRef<ParticleManager | null>(null)
  const animationRef = useRef<number | null>(null)

  // Initialiser le manager
  useEffect(() => {
    managerRef.current = new ParticleManager(options?.maxPoolSize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [options?.maxPoolSize])

  // Boucle d'animation automatique
  useEffect(() => {
    if (!options?.autoUpdate) return

    const animate = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const manager = managerRef.current

      if (ctx && manager) {
        manager.update()
        manager.render(ctx)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasRef, options?.autoUpdate])

  /**
   * Émet des particules
   */
  const emit = useCallback((config: ParticleConfig, count: number = 1) => {
    managerRef.current?.emit(config, count)
  }, [])

  /**
   * Émet une explosion radiale
   */
  const emitExplosion = useCallback((
    x: number,
    y: number,
    count: number,
    options?: Partial<ParticleConfig>
  ) => {
    managerRef.current?.emitExplosion(x, y, count, options)
  }, [])

  /**
   * Émet un trail
   */
  const emitTrail = useCallback((
    x: number,
    y: number,
    options?: Partial<ParticleConfig>
  ) => {
    managerRef.current?.emitTrail(x, y, options)
  }, [])

  /**
   * Update manuel (si autoUpdate = false)
   */
  const update = useCallback(() => {
    managerRef.current?.update()
  }, [])

  /**
   * Render manuel (si autoUpdate = false)
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const manager = managerRef.current

    if (ctx && manager) {
      manager.render(ctx)
    }
  }, [canvasRef])

  /**
   * Nettoie toutes les particules
   */
  const clear = useCallback(() => {
    managerRef.current?.clear()
  }, [])

  /**
   * Nombre de particules actives
   */
  const getCount = useCallback(() => {
    return managerRef.current?.count ?? 0
  }, [])

  return {
    emit,
    emitExplosion,
    emitTrail,
    update,
    render,
    clear,
    getCount,
    manager: managerRef.current,
  }
}

/**
 * Hook pour obtenir des particules CSS (Framer Motion)
 * Retourne un tableau de particules à mapper dans le JSX
 */
export function useParticleSystemCSS() {
  const managerRef = useRef<ParticleManager>(new ParticleManager())
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const startAnimation = useCallback(() => {
    const animate = () => {
      managerRef.current.update()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()
  }, [])

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const emit = useCallback((config: ParticleConfig, count: number = 1) => {
    managerRef.current.emit(config, count)
  }, [])

  const emitExplosion = useCallback((
    x: number,
    y: number,
    count: number,
    options?: Partial<ParticleConfig>
  ) => {
    managerRef.current.emitExplosion(x, y, count, options)
  }, [])

  const getParticles = useCallback(() => {
    return managerRef.current.getActiveParticles()
  }, [])

  const clear = useCallback(() => {
    managerRef.current.clear()
  }, [])

  return {
    emit,
    emitExplosion,
    getParticles,
    clear,
    startAnimation,
    stopAnimation,
  }
}
