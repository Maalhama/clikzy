/**
 * DiceRoll 3D - Mini-jeu avec physique réaliste Rapier
 * Transformation de la version CSS 3D en vraie simulation physique
 */

'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import { NEON_COLORS, GAME_MATERIALS } from '@/lib/mini-games/materials'
import { GameCanvas } from './core/GameCanvas'
import { use3DPerformance } from '@/hooks/mini-games/use3DPerformance'
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'

// Configuration
const DIE_SIZE = 1
const DIE_RADIUS = 0.15
const TABLE_SIZE = 10

// Positions des points sur chaque face (basé sur la géométrie du dé)
interface DotPosition {
  position: [number, number, number]
  normal: [number, number, number]
}

// Calcul des crédits selon la somme (identique à la version 2D)
function getCreditsFromSum(sum: number): number {
  if (sum <= 3) return 2
  if (sum <= 5) return 3
  if (sum <= 7) return 4
  if (sum <= 9) return 6
  if (sum <= 11) return 8
  return 10
}

interface DiceRoll3DProps {
  onWin?: (credits: number) => void
  diceResults?: [number, number]
  isActive?: boolean
}

/**
 * Point (dot) sur une face du dé
 */
function DieDot({ position, color = '#ffffff' }: { position: [number, number, number]; color?: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

/**
 * Dé 3D physique avec points sur les faces
 */
function Die({
  finalValue,
  color,
  isRolling,
  onLanded,
  position = [0, 3, 0],
  delay = 0,
  sounds
}: {
  finalValue: number
  color: string
  isRolling: boolean
  onLanded?: (value: number) => void
  position?: [number, number, number]
  delay?: number
  sounds?: any
}) {
  const dieRef = useRef<RapierRigidBody>(null)
  const [hasLanded, setHasLanded] = useState(false)
  const [detectedValue, setDetectedValue] = useState<number | null>(null)
  const lastVelocity = useRef<THREE.Vector3>(new THREE.Vector3())

  // Lance le dé avec vélocité et rotation aléatoires
  useEffect(() => {
    if (isRolling && dieRef.current) {
      setTimeout(() => {
        if (!dieRef.current) return

        // Reset position
        dieRef.current.setTranslation(
          { x: position[0], y: position[1], z: position[2] },
          true
        )

        // Applique une force de lancer avec rotation
        const throwForce = {
          x: (Math.random() - 0.5) * 3,
          y: -2,
          z: (Math.random() - 0.5) * 2,
        }

        const spinForce = {
          x: (Math.random() - 0.5) * 20,
          y: (Math.random() - 0.5) * 20,
          z: (Math.random() - 0.5) * 20,
        }

        dieRef.current.setLinvel(throwForce, true)
        dieRef.current.setAngvel(spinForce, true)

        setHasLanded(false)
        setDetectedValue(null)
      }, delay)
    }
  }, [isRolling, position, delay])

  // Détecte la face visible une fois le dé immobile
  useFrame(() => {
    if (dieRef.current && isRolling && !hasLanded) {
      const vel = dieRef.current.linvel()
      const angVel = dieRef.current.angvel()
      const currentVel = new THREE.Vector3(vel.x, vel.y, vel.z)

      // Détecte les rebonds (changement brusque de vélocité)
      const deltaVel = currentVel.clone().sub(lastVelocity.current).length()
      if (deltaVel > 3) {
        sounds?.bounce.play()
      }
      lastVelocity.current.copy(currentVel)

      // Vérifie si le dé est immobile
      const isStill =
        Math.abs(vel.x) < 0.1 &&
        Math.abs(vel.y) < 0.1 &&
        Math.abs(vel.z) < 0.1 &&
        Math.abs(angVel.x) < 0.1 &&
        Math.abs(angVel.y) < 0.1 &&
        Math.abs(angVel.z) < 0.1

      if (isStill) {
        setHasLanded(true)

        // Détecte quelle face est vers le haut
        const rotation = dieRef.current.rotation()
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat)

        // Map des faces (approximatif selon l'orientation du dé)
        const faces = [
          { value: 1, normal: new THREE.Vector3(0, 0, 1) },
          { value: 6, normal: new THREE.Vector3(0, 0, -1) },
          { value: 2, normal: new THREE.Vector3(1, 0, 0) },
          { value: 5, normal: new THREE.Vector3(-1, 0, 0) },
          { value: 3, normal: new THREE.Vector3(0, 1, 0) },
          { value: 4, normal: new THREE.Vector3(0, -1, 0) },
        ]

        // Trouve la face la plus proche de "up"
        let closestFace = faces[0]
        let maxDot = -1

        faces.forEach((face) => {
          const faceNormal = face.normal.clone().applyQuaternion(quat)
          const dot = faceNormal.dot(up)
          if (dot > maxDot) {
            maxDot = dot
            closestFace = face
          }
        })

        setDetectedValue(closestFace.value)
        onLanded?.(closestFace.value)
      }
    }
  })

  // Génère les points selon la valeur finale
  const dots = useMemo(() => {
    const halfSize = DIE_SIZE / 2
    const offset = halfSize + 0.01 // Légèrement au-dessus de la surface

    const positions: Record<number, [number, number, number][]> = {
      1: [[0, 0, offset]], // Face avant (Z+)
      6: [
        // Face arrière (Z-)
        [-0.25, 0.25, -offset],
        [0.25, 0.25, -offset],
        [-0.25, 0, -offset],
        [0.25, 0, -offset],
        [-0.25, -0.25, -offset],
        [0.25, -0.25, -offset],
      ],
      2: [
        // Face droite (X+)
        [offset, 0.25, 0.25],
        [offset, -0.25, -0.25],
      ],
      5: [
        // Face gauche (X-)
        [-offset, 0.25, 0.25],
        [-offset, 0.25, -0.25],
        [-offset, 0, 0],
        [-offset, -0.25, 0.25],
        [-offset, -0.25, -0.25],
      ],
      3: [
        // Face haut (Y+)
        [-0.25, offset, 0.25],
        [0, offset, 0],
        [0.25, offset, -0.25],
      ],
      4: [
        // Face bas (Y-)
        [-0.25, -offset, 0.25],
        [0.25, -offset, 0.25],
        [-0.25, -offset, -0.25],
        [0.25, -offset, -0.25],
      ],
    }

    return positions
  }, [])

  return (
    <RigidBody
      ref={dieRef}
      position={position}
      colliders={false}
      restitution={0.3}
      friction={0.6}
      gravityScale={1}
      canSleep={false}
    >
      <CuboidCollider args={[DIE_SIZE / 2, DIE_SIZE / 2, DIE_SIZE / 2]} />

      {/* Cube arrondi */}
      <RoundedBox args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} radius={DIE_RADIUS} smoothness={4}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hasLanded ? 0.5 : 0.2}
          metalness={0.3}
          roughness={0.6}
        />
      </RoundedBox>

      {/* Points sur toutes les faces */}
      {Object.entries(dots).map(([value, positions]) =>
        positions.map((pos, i) => (
          <DieDot
            key={`${value}-${i}`}
            position={pos}
            color={hasLanded && detectedValue === Number(value) ? NEON_COLORS.green : '#ffffff'}
          />
        ))
      )}

      {/* Lumière du dé */}
      {hasLanded && (
        <pointLight color={color} intensity={2} distance={3} />
      )}
    </RigidBody>
  )
}

/**
 * Table de jeu 3D
 */
function GameTable() {
  return (
    <>
      {/* Surface de la table */}
      <RigidBody type="fixed" position={[0, -0.5, 0]} colliders={false}>
        <CuboidCollider args={[TABLE_SIZE / 2, 0.25, TABLE_SIZE / 2]} />
        <mesh>
          <boxGeometry args={[TABLE_SIZE, 0.5, TABLE_SIZE]} />
          <meshStandardMaterial
            {...GAME_MATERIALS.darkPlastic}
            color="#1E2942"
          />
        </mesh>

        {/* Felt texture (surface de jeu) */}
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[TABLE_SIZE - 1, 0.01, TABLE_SIZE - 1]} />
          <meshStandardMaterial
            color="#0B0F1A"
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      </RigidBody>

      {/* Bordures (murs invisibles) */}
      <RigidBody type="fixed" position={[TABLE_SIZE / 2, 1, 0]} colliders={false}>
        <CuboidCollider args={[0.1, 2, TABLE_SIZE / 2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-TABLE_SIZE / 2, 1, 0]} colliders={false}>
        <CuboidCollider args={[0.1, 2, TABLE_SIZE / 2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 1, TABLE_SIZE / 2]} colliders={false}>
        <CuboidCollider args={[TABLE_SIZE / 2, 2, 0.1]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 1, -TABLE_SIZE / 2]} colliders={false}>
        <CuboidCollider args={[TABLE_SIZE / 2, 2, 0.1]} />
      </RigidBody>

      {/* Coins lumineux */}
      {[
        [-TABLE_SIZE / 2 + 0.5, 0, -TABLE_SIZE / 2 + 0.5],
        [TABLE_SIZE / 2 - 0.5, 0, -TABLE_SIZE / 2 + 0.5],
        [-TABLE_SIZE / 2 + 0.5, 0, TABLE_SIZE / 2 - 0.5],
        [TABLE_SIZE / 2 - 0.5, 0, TABLE_SIZE / 2 - 0.5],
      ].map((pos, i) => {
        const colors = [NEON_COLORS.purple, NEON_COLORS.blue, NEON_COLORS.pink, NEON_COLORS.orange]
        return (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={colors[i]}
              emissive={colors[i]}
              emissiveIntensity={0.8}
            />
            <pointLight color={colors[i]} intensity={0.5} distance={2} />
          </mesh>
        )
      })}
    </>
  )
}

/**
 * Scène 3D du DiceRoll
 */
function DiceScene({
  onWin,
  diceResults = [6, 6],
  isActive = false,
}: DiceRoll3DProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [landedValues, setLandedValues] = useState<[number | null, number | null]>([null, null])
  const [showResult, setShowResult] = useState(false)

  // Audio
  const sounds = useMiniGameAudio('dice')

  const handleDie1Landed = (value: number) => {
    setLandedValues((prev) => [value, prev[1]])
  }

  const handleDie2Landed = (value: number) => {
    setLandedValues((prev) => [prev[0], value])
  }

  const handleRoll = () => {
    if (isRolling || !isActive) return

    setIsRolling(true)
    setLandedValues([null, null])
    setShowResult(false)

    // Son de lancement
    sounds.roll.play()

    // Arrête le roll après 3 secondes
    setTimeout(() => {
      setIsRolling(false)
      setShowResult(true)

      // Son d'atterrissage final
      sounds.land.play()

      // Calcule le résultat une fois les deux dés immobiles
      setTimeout(() => {
        const sum = (landedValues[0] || diceResults[0]) + (landedValues[1] || diceResults[1])
        const credits = getCreditsFromSum(sum)
        onWin?.(credits)
      }, 500)
    }, 3000)
  }

  const sum = (landedValues[0] || diceResults[0]) + (landedValues[1] || diceResults[1])
  const credits = getCreditsFromSum(sum)

  return (
    <>
      {/* Table de jeu */}
      <GameTable />

      {/* Dés */}
      <Die
        finalValue={diceResults[0]}
        color={NEON_COLORS.purple}
        isRolling={isRolling}
        onLanded={handleDie1Landed}
        position={[-1, 3, 0]}
        delay={0}
        sounds={sounds}
      />
      <Die
        finalValue={diceResults[1]}
        color={NEON_COLORS.pink}
        isRolling={isRolling}
        onLanded={handleDie2Landed}
        position={[1, 3, 0]}
        delay={200}
        sounds={sounds}
      />

      {/* Résultat (texte 3D) */}
      {showResult && landedValues[0] !== null && landedValues[1] !== null && (
        <group position={[0, 2, -3]}>
          <Text
            fontSize={0.8}
            color={sum === 12 ? NEON_COLORS.orange : NEON_COLORS.green}
            anchorX="center"
            anchorY="middle"
          >
            {landedValues[0]} + {landedValues[1]} = {sum}
          </Text>
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.5}
            color={credits >= 8 ? NEON_COLORS.orange : '#ffffff'}
            anchorX="center"
            anchorY="middle"
          >
            +{credits} crédits
          </Text>
          {sum === 12 && (
            <Text
              position={[0, -1.2, 0]}
              fontSize={0.3}
              color={NEON_COLORS.orange}
              anchorX="center"
              anchorY="middle"
            >
              DOUBLE 6 !
            </Text>
          )}
        </group>
      )}

      {/* Bouton ROLL (mesh cliquable) */}
      {!isRolling && (
        <group position={[0, 0.5, 3]} onClick={handleRoll}>
          <mesh>
            <boxGeometry args={[2, 0.5, 0.8]} />
            <meshStandardMaterial
              {...GAME_MATERIALS.neonPurple}
              emissiveIntensity={1}
            />
          </mesh>
          <Text
            position={[0, 0, 0.45]}
            fontSize={0.25}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            LANCER
          </Text>
        </group>
      )}
    </>
  )
}

/**
 * Composant principal DiceRoll 3D
 */
export function DiceRoll3D(props: DiceRoll3DProps) {
  const { canUse3D } = use3DPerformance()

  if (!canUse3D) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/60">
          Votre appareil ne supporte pas la 3D. Version 2D disponible prochainement.
        </p>
      </div>
    )
  }

  return (
    <GameCanvas
      cameraPosition={[0, 5, 8]}
      cameraFov={50}
      enablePhysics={true}
      gravity={[0, -15, 0]}
      enableShadows={true}
      shadowPosition={[0, -0.5, 0]}
      shadowOpacity={0.4}
      enableControls={false}
      primaryNeonColor={NEON_COLORS.purple}
      secondaryNeonColor={NEON_COLORS.pink}
      className="w-full h-full"
    >
      <DiceScene {...props} />
    </GameCanvas>
  )
}
