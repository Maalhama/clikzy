/**
 * Wrapper Canvas standardisé pour tous les mini-jeux 3D
 * Gère la configuration commune : camera, rendu, suspense, éclairage
 */

import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Suspense, ReactNode } from 'react'
import { GameLighting } from './GameLighting'
import { GameEnvironment } from './GameEnvironment'
import { PhysicsWorld } from './PhysicsWorld'

interface GameCanvasProps {
  children: ReactNode

  /**
   * Position de la caméra (défaut: [0, 0, 5])
   */
  cameraPosition?: [number, number, number]

  /**
   * Field of view de la caméra (défaut: 45)
   */
  cameraFov?: number

  /**
   * Activer la physique Rapier (défaut: false)
   */
  enablePhysics?: boolean

  /**
   * Gravité si physique activée (défaut: [0, -9.81, 0])
   */
  gravity?: [number, number, number]

  /**
   * Activer les ombres de contact (défaut: true)
   */
  enableShadows?: boolean

  /**
   * Position des ombres (défaut: [0, -1.5, 0])
   */
  shadowPosition?: [number, number, number]

  /**
   * Opacité des ombres (défaut: 0.4)
   */
  shadowOpacity?: number

  /**
   * Activer OrbitControls (défaut: false)
   */
  enableControls?: boolean

  /**
   * Activer auto-rotation (défaut: false)
   */
  autoRotate?: boolean

  /**
   * Classe CSS pour le conteneur
   */
  className?: string

  /**
   * Couleur primaire pour les lumières neon
   */
  primaryNeonColor?: string

  /**
   * Couleur secondaire pour les lumières neon
   */
  secondaryNeonColor?: string
}

/**
 * Fallback de chargement
 */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#9B5CFF" wireframe />
    </mesh>
  )
}

/**
 * Canvas standardisé pour les mini-jeux 3D Cleekzy
 * Respecte la DA : éclairage neon, ombres subtiles, environment city
 */
export function GameCanvas({
  children,
  cameraPosition = [0, 0, 5],
  cameraFov = 45,
  enablePhysics = false,
  gravity = [0, -9.81, 0],
  enableShadows = true,
  shadowPosition = [0, -1.5, 0],
  shadowOpacity = 0.4,
  enableControls = false,
  autoRotate = false,
  className = '',
  primaryNeonColor,
  secondaryNeonColor,
}: GameCanvasProps) {
  const canvasContent = (
    <>
      <GameLighting
        primaryNeonColor={primaryNeonColor}
        secondaryNeonColor={secondaryNeonColor}
      />

      {children}

      {enableShadows && (
        <ContactShadows
          position={shadowPosition}
          opacity={shadowOpacity}
          scale={10}
          blur={2}
          far={4}
        />
      )}

      <GameEnvironment />

      {enableControls && (
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      )}
    </>
  )

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 2]} // Limit pixel ratio for performance
        shadows
      >
        <Suspense fallback={<LoadingFallback />}>
          {enablePhysics ? (
            <PhysicsWorld gravity={gravity}>
              {canvasContent}
            </PhysicsWorld>
          ) : (
            canvasContent
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
