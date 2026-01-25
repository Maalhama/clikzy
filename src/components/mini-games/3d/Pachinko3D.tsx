/**
 * Pachinko 3D - Mini-jeu avec physique réaliste Rapier
 * Transformation de la version 2D Canvas en expérience 3D complète
 */

'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, BallCollider, CylinderCollider } from '@react-three/rapier'
import { Text, Sphere, Cylinder, Box } from '@react-three/drei'
import * as THREE from 'three'
import { NEON_COLORS, GAME_MATERIALS } from '@/lib/mini-games/materials'
import { GameCanvas } from './core/GameCanvas'
import { use3DPerformance } from '@/hooks/mini-games/use3DPerformance'
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'

// Configuration du plateau
const BOARD_CONFIG = {
  width: 8,
  height: 12,
  pegRows: 7,
  pegsPerRow: 9,
  pegRadius: 0.15,
  pegHeight: 0.3,
  slotCount: 9,
  slotWidth: 0.8,
  slotDepth: 1.2,
  ballRadius: 0.2,
}

// Valeurs des slots (identique à la version 2D)
const SLOT_VALUES = [0, 0, 1, 3, 10, 3, 1, 0, 0]

interface Pachinko3DProps {
  onWin?: (multiplier: number) => void
  targetSlot?: number
  isActive?: boolean
}

/**
 * Particule de collision
 */
interface Particle {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  color: string
}

/**
 * Composant Particules (effet sur collision avec pegs)
 */
function ParticleSystem({ particles }: { particles: Particle[] }) {
  return (
    <>
      {particles.map((particle) => (
        <Sphere key={particle.id} args={[0.05, 8, 8]} position={particle.position.toArray()}>
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={particle.life}
          />
        </Sphere>
      ))}
    </>
  )
}

/**
 * Composant Bille 3D avec physique
 */
function Ball({
  onLanded,
  targetSlot = 4,
  isActive = false,
  onParticleSpawn,
  sounds
}: {
  onLanded: (slot: number) => void
  targetSlot?: number
  isActive?: boolean
  onParticleSpawn?: (position: THREE.Vector3, color: string) => void
  sounds?: any
}) {
  const ballRef = useRef<RapierRigidBody>(null)
  const [hasLanded, setHasLanded] = useState(false)
  const [trailPositions, setTrailPositions] = useState<THREE.Vector3[]>([])
  const lastVelocity = useRef<THREE.Vector3>(new THREE.Vector3())

  // Position de départ avec biais vers le slot cible
  const startPosition = useMemo(() => {
    const centerX = 0
    const bias = (targetSlot - 4) * 0.3 // Biais horizontal vers le slot cible
    return [centerX + bias, 6, 0] as [number, number, number]
  }, [targetSlot])

  useEffect(() => {
    if (isActive && ballRef.current) {
      // Reset la position et vélocité
      ballRef.current.setTranslation({ x: startPosition[0], y: startPosition[1], z: startPosition[2] }, true)
      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      setHasLanded(false)
      setTrailPositions([])
      lastVelocity.current.set(0, 0, 0)

      // Son de lancement
      sounds?.ballDrop.play()
    }
  }, [isActive, startPosition, sounds])

  // Suivi de la bille pour la traînée visuelle et détection de collisions
  useFrame(() => {
    if (ballRef.current && isActive && !hasLanded) {
      const pos = ballRef.current.translation()
      const vel = ballRef.current.linvel()
      const currentVel = new THREE.Vector3(vel.x, vel.y, vel.z)

      // Ajoute la position à la traînée
      setTrailPositions((prev) => {
        const newTrail = [...prev, new THREE.Vector3(pos.x, pos.y, pos.z)]
        return newTrail.slice(-20) // Garde les 20 dernières positions
      })

      // Détecte les collisions fortes (changement brusque de vélocité)
      const deltaVel = currentVel.clone().sub(lastVelocity.current).length()
      if (deltaVel > 2 && onParticleSpawn) {
        onParticleSpawn(new THREE.Vector3(pos.x, pos.y, pos.z), NEON_COLORS.blue)
        // Son de collision avec un peg
        sounds?.pegHit.play()
      }
      lastVelocity.current.copy(currentVel)

      // Détecte si la bille est tombée dans un slot
      if (pos.y < -4 && !hasLanded) {
        setHasLanded(true)

        // Calcule dans quel slot la bille est tombée
        const slotIndex = Math.floor((pos.x + BOARD_CONFIG.width / 2) / BOARD_CONFIG.slotWidth)
        const clampedSlot = Math.max(0, Math.min(BOARD_CONFIG.slotCount - 1, slotIndex))

        onLanded(clampedSlot)
      }
    }
  })

  return (
    <>
      {/* Bille physique */}
      <RigidBody
        ref={ballRef}
        position={startPosition}
        colliders={false}
        restitution={0.65} // Bounce (identique à la version 2D)
        friction={0.3}
        linearDamping={0.05} // Friction air (simule le 0.995 de la 2D)
        gravityScale={1}
      >
        <BallCollider args={[BOARD_CONFIG.ballRadius]} />
        <Sphere args={[BOARD_CONFIG.ballRadius, 32, 32]}>
          <meshStandardMaterial
            {...GAME_MATERIALS.neonPurple}
            emissiveIntensity={1.2}
          />
        </Sphere>

        {/* Lumière suivant la bille */}
        <pointLight
          color={NEON_COLORS.purple}
          intensity={2}
          distance={3}
        />
      </RigidBody>

      {/* Traînée lumineuse */}
      {trailPositions.length > 1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trailPositions.length}
              array={new Float32Array(trailPositions.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
              args={[new Float32Array(trailPositions.flatMap((p) => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={NEON_COLORS.purple} opacity={0.3} transparent />
        </line>
      )}
    </>
  )
}

/**
 * Peg (chevilles) cylindrique avec collision
 */
function Peg({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CylinderCollider args={[BOARD_CONFIG.pegHeight / 2, BOARD_CONFIG.pegRadius]} />
      <Cylinder args={[BOARD_CONFIG.pegRadius, BOARD_CONFIG.pegRadius, BOARD_CONFIG.pegHeight, 16]}>
        <meshStandardMaterial
          {...GAME_MATERIALS.glass}
          color={NEON_COLORS.blue}
          emissive={NEON_COLORS.blue}
          emissiveIntensity={0.5}
        />
      </Cylinder>
    </RigidBody>
  )
}

/**
 * Génère les positions des pegs en pyramide
 */
function usePegPositions() {
  return useMemo(() => {
    const positions: [number, number, number][] = []
    const startY = 4

    for (let row = 0; row < BOARD_CONFIG.pegRows; row++) {
      const pegsInRow = BOARD_CONFIG.pegsPerRow
      const rowWidth = (pegsInRow - 1) * 0.8
      const startX = -rowWidth / 2
      const y = startY - row * 1.5

      for (let col = 0; col < pegsInRow; col++) {
        // Pyramide : décale une colonne sur deux
        const offset = row % 2 === 0 ? 0 : 0.4
        const x = startX + col * 0.8 + offset
        positions.push([x, y, 0])
      }
    }

    return positions
  }, [])
}

/**
 * Slot de réception avec lumière neon
 */
function Slot({
  index,
  value,
  isTarget
}: {
  index: number
  value: number
  isTarget: boolean
}) {
  const slotX = -BOARD_CONFIG.width / 2 + index * BOARD_CONFIG.slotWidth + BOARD_CONFIG.slotWidth / 2
  const slotY = -5

  const slotColor = value === 10
    ? NEON_COLORS.pink
    : value >= 3
    ? NEON_COLORS.purple
    : value >= 1
    ? NEON_COLORS.blue
    : '#333333'

  return (
    <group position={[slotX, slotY, 0]}>
      {/* Fond du slot */}
      <Box args={[BOARD_CONFIG.slotWidth - 0.1, 0.5, BOARD_CONFIG.slotDepth]}>
        <meshStandardMaterial
          color={slotColor}
          emissive={slotColor}
          emissiveIntensity={isTarget ? 1 : 0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </Box>

      {/* Bordures du slot */}
      <Box args={[0.05, 0.6, BOARD_CONFIG.slotDepth]} position={[-BOARD_CONFIG.slotWidth / 2, 0.3, 0]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
      </Box>
      <Box args={[0.05, 0.6, BOARD_CONFIG.slotDepth]} position={[BOARD_CONFIG.slotWidth / 2, 0.3, 0]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
      </Box>

      {/* Texte valeur */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        x{value}
      </Text>

      {/* Lumière du slot */}
      {value > 0 && (
        <pointLight
          color={slotColor}
          intensity={isTarget ? 3 : 1}
          distance={2}
          position={[0, 1, 0]}
        />
      )}
    </group>
  )
}

/**
 * Plateau de jeu (fond)
 */
function Board() {
  return (
    <RigidBody type="fixed" position={[0, 0, -0.5]}>
      <Box args={[BOARD_CONFIG.width, BOARD_CONFIG.height, 0.2]}>
        <meshStandardMaterial
          color="#0B0F1A"
          metalness={0.3}
          roughness={0.7}
        />
      </Box>
    </RigidBody>
  )
}

/**
 * Scène 3D du Pachinko
 */
function PachinkoScene({
  onWin,
  targetSlot = 4,
  isActive = false,
}: Pachinko3DProps) {
  const pegPositions = usePegPositions()
  const [landedSlot, setLandedSlot] = useState<number | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)

  // Audio
  const sounds = useMiniGameAudio('pachinko')

  const handleBallLanded = (slot: number) => {
    setLandedSlot(slot)
    const multiplier = SLOT_VALUES[slot]

    // Son de victoire si gain
    if (multiplier > 0) {
      sounds.slotWin.play()
    }

    onWin?.(multiplier)
  }

  const handleParticleSpawn = (position: THREE.Vector3, color: string) => {
    const newParticles: Particle[] = []
    const particleCount = 5

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ),
        life: 1,
        color,
      })
    }

    setParticles((prev) => [...prev, ...newParticles])
  }

  // Animation des particules
  useFrame((state, delta) => {
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          position: p.position.clone().add(p.velocity.clone().multiplyScalar(delta)),
          velocity: p.velocity.clone().multiplyScalar(0.95), // Décélération
          life: p.life - delta * 2, // Disparition progressive
        }))
        .filter((p) => p.life > 0) // Supprime les particules mortes
    )
  })

  return (
    <>
      {/* Plateau de fond */}
      <Board />

      {/* Pegs */}
      {pegPositions.map((pos, i) => (
        <Peg key={i} position={pos} />
      ))}

      {/* Slots de réception */}
      {SLOT_VALUES.map((value, i) => (
        <Slot
          key={i}
          index={i}
          value={value}
          isTarget={i === targetSlot}
        />
      ))}

      {/* Bille */}
      {isActive && (
        <Ball
          onLanded={handleBallLanded}
          targetSlot={targetSlot}
          isActive={isActive}
          onParticleSpawn={handleParticleSpawn}
          sounds={sounds}
        />
      )}

      {/* Système de particules */}
      <ParticleSystem particles={particles} />
    </>
  )
}

/**
 * Composant principal Pachinko 3D
 * Wrapper avec détection de support 3D et fallback
 */
export function Pachinko3D(props: Pachinko3DProps) {
  const { canUse3D } = use3DPerformance()

  // Fallback vers version 2D si device ne supporte pas WebGL2
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
      cameraPosition={[0, 0, 12]}
      cameraFov={50}
      enablePhysics={true}
      gravity={[0, -9.81, 0]}
      enableShadows={true}
      shadowPosition={[0, -6, 0]}
      shadowOpacity={0.5}
      enableControls={false}
      primaryNeonColor={NEON_COLORS.purple}
      secondaryNeonColor={NEON_COLORS.blue}
      className="w-full h-full"
    >
      <PachinkoScene {...props} />
    </GameCanvas>
  )
}
