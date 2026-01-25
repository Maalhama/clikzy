/**
 * Wrapper de configuration Rapier pour la physique 3D
 * Utilisé par les jeux nécessitant des simulations physiques (Pachinko, Dés, Pièce)
 */

import { Physics } from '@react-three/rapier'
import { ReactNode } from 'react'

interface PhysicsWorldProps {
  children: ReactNode

  /**
   * Gravité (défaut: -9.81 pour gravité réaliste)
   */
  gravity?: [number, number, number]

  /**
   * Debug mode pour voir les colliders (dev only)
   */
  debug?: boolean

  /**
   * Timestep fixe pour la physique (défaut: 1/60)
   */
  timeStep?: number

  /**
   * Nombre de sous-étapes pour la précision (défaut: 1)
   */
  substeps?: number
}

/**
 * Configuration Rapier standardisée pour les mini-jeux
 */
export function PhysicsWorld({
  children,
  gravity = [0, -9.81, 0],
  debug = false,
  timeStep = 1 / 60,
  substeps = 1,
}: PhysicsWorldProps) {
  return (
    <Physics
      gravity={gravity}
      debug={debug}
      timeStep={timeStep}
      paused={false}
      interpolate={true}
      updatePriority={1}
      // Performance optimizations
      colliders="hull" // Auto-generate colliders from mesh
    >
      {children}
    </Physics>
  )
}
