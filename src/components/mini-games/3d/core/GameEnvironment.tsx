/**
 * Environnement standardisé pour les mini-jeux 3D
 * Ajoute les réflexions et l'atmosphère
 */

import { Environment } from '@react-three/drei'

interface GameEnvironmentProps {
  /**
   * Preset d'environnement (défaut: "city" comme dans Product3DViewer)
   */
  preset?: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'

  /**
   * Intensité des réflexions d'environnement (défaut: 1)
   */
  environmentIntensity?: number

  /**
   * Activer le fog (brouillard) pour la profondeur
   */
  enableFog?: boolean
}

/**
 * Configuration d'environnement pour réflexions et ambiance
 */
export function GameEnvironment({
  preset = 'city',
  environmentIntensity = 1,
  enableFog = false,
}: GameEnvironmentProps) {
  return (
    <>
      {/* Environment map pour les réflexions */}
      <Environment
        preset={preset}
        environmentIntensity={environmentIntensity}
      />

      {/* Fog optionnel pour la profondeur */}
      {enableFog && (
        <fog attach="fog" args={['#0B0F1A', 10, 50]} />
      )}
    </>
  )
}
