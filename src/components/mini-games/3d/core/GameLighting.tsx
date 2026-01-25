/**
 * Éclairage standardisé pour les mini-jeux 3D
 * Respecte la direction artistique Cleekzy avec accents neon
 */

import { NEON_COLORS } from '@/lib/mini-games/materials'

interface GameLightingProps {
  /**
   * Intensité de la lumière ambiante (défaut: 0.4)
   */
  ambientIntensity?: number

  /**
   * Intensité du spotlight principal (défaut: 1.2)
   */
  spotIntensity?: number

  /**
   * Activer les lumières neon d'accent (défaut: true)
   */
  enableNeonLights?: boolean

  /**
   * Couleur primaire des lumières neon (défaut: purple)
   */
  primaryNeonColor?: string

  /**
   * Couleur secondaire des lumières neon (défaut: blue)
   */
  secondaryNeonColor?: string
}

/**
 * Configuration d'éclairage standardisée pour tous les mini-jeux
 * Pattern établi dans Product3DViewer.tsx
 */
export function GameLighting({
  ambientIntensity = 0.4,
  spotIntensity = 1.2,
  enableNeonLights = true,
  primaryNeonColor = NEON_COLORS.purple,
  secondaryNeonColor = NEON_COLORS.blue,
}: GameLightingProps) {
  return (
    <>
      {/* Lumière ambiante de base */}
      <ambientLight intensity={ambientIntensity} />

      {/* Spotlight principal (key light) */}
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={spotIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Lumières neon d'accent (DA Cleekzy) */}
      {enableNeonLights && (
        <>
          {/* Purple neon - Accent principal */}
          <pointLight
            position={[5, 0, 5]}
            intensity={0.8}
            color={primaryNeonColor}
            distance={20}
          />

          {/* Blue neon - Accent secondaire */}
          <pointLight
            position={[-5, 0, -5]}
            intensity={0.6}
            color={secondaryNeonColor}
            distance={20}
          />

          {/* Pink neon - Accent optionnel (sous l'objet) */}
          <pointLight
            position={[0, -3, 3]}
            intensity={0.4}
            color={NEON_COLORS.pink}
            distance={15}
          />
        </>
      )}

      {/* Rim light (rétro-éclairage) */}
      <pointLight
        position={[-10, -10, -10]}
        intensity={0.5}
        color="#ffffff"
      />
    </>
  )
}
