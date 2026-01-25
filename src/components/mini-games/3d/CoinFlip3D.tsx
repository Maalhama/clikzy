/**
 * CoinFlip 3D - Mini-jeu avec physique réaliste Rapier
 * Transformation de la version CSS 3D en vraie simulation physique
 */

'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CylinderCollider } from '@react-three/rapier'
import { Cylinder, Text, Box } from '@react-three/drei'
import * as THREE from 'three'
import { NEON_COLORS, GAME_MATERIALS } from '@/lib/mini-games/materials'
import { GameCanvas } from './core/GameCanvas'
import { use3DPerformance } from '@/hooks/mini-games/use3DPerformance'
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'

const COIN_RADIUS = 1
const COIN_THICKNESS = 0.15
const TABLE_SIZE = 8

interface CoinFlip3DProps {
  onWin?: (credits: number) => void
  result?: 'heads' | 'tails'
  prizeAmount?: number
  isActive?: boolean
}

/**
 * Table de jeu 3D
 */
function GameTable() {
  return (
    <>
      {/* Surface de la table */}
      <RigidBody type="fixed" position={[0, -0.5, 0]} colliders={false}>
        <CylinderCollider args={[0.25, TABLE_SIZE / 2]} />
        <mesh>
          <cylinderGeometry args={[TABLE_SIZE / 2, TABLE_SIZE / 2, 0.5, 32]} />
          <meshStandardMaterial
            {...GAME_MATERIALS.darkPlastic}
            color="#1E2942"
          />
        </mesh>

        {/* Surface de jeu (feutre) */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[TABLE_SIZE / 2 - 0.5, TABLE_SIZE / 2 - 0.5, 0.01, 32]} />
          <meshStandardMaterial
            color="#0B0F1A"
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      </RigidBody>

      {/* Bordure circulaire (mur invisible) */}
      <RigidBody type="fixed" position={[0, 1, 0]} colliders={false}>
        <CylinderCollider args={[2, TABLE_SIZE / 2 + 0.1]} />
      </RigidBody>

      {/* Lumières d'ambiance autour de la table */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        const x = Math.cos(angle) * (TABLE_SIZE / 2 - 1)
        const z = Math.sin(angle) * (TABLE_SIZE / 2 - 1)
        const colors = [
          NEON_COLORS.purple,
          NEON_COLORS.blue,
          NEON_COLORS.pink,
          NEON_COLORS.orange,
          NEON_COLORS.purple,
          NEON_COLORS.blue,
        ]

        return (
          <mesh key={i} position={[x, 0, z]}>
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
 * Pièce 3D avec physique
 */
function Coin3D({
  result,
  isFlipping,
  onLanded
}: {
  result: 'heads' | 'tails'
  isFlipping: boolean
  onLanded?: (actualResult: 'heads' | 'tails') => void
}) {
  const coinRef = useRef<RapierRigidBody>(null)
  const [hasLanded, setHasLanded] = useState(false)
  const [detectedSide, setDetectedSide] = useState<'heads' | 'tails' | null>(null)

  // Lance la pièce
  useEffect(() => {
    if (isFlipping && coinRef.current) {
      // Reset position
      coinRef.current.setTranslation({ x: 0, y: 3, z: 0 }, true)

      // Applique une force de lancer avec rotation
      const throwForce = {
        x: (Math.random() - 0.5) * 2,
        y: 4 + Math.random() * 2,
        z: (Math.random() - 0.5) * 2,
      }

      // Rotation aléatoire très rapide (biaisé vers le résultat souhaité)
      const targetRotation = result === 'heads' ? 0 : Math.PI
      const randomExtra = Math.floor(Math.random() * 3 + 8) * Math.PI * 2 // 8-10 tours
      const spinForce = {
        x: targetRotation + randomExtra + (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 2,
      }

      coinRef.current.setLinvel(throwForce, true)
      coinRef.current.setAngvel(spinForce, true)

      setHasLanded(false)
      setDetectedSide(null)
    }
  }, [isFlipping, result])

  // Détecte quand la pièce est immobile
  useFrame(() => {
    if (coinRef.current && isFlipping && !hasLanded) {
      const vel = coinRef.current.linvel()
      const angVel = coinRef.current.angvel()

      // Vérifie si la pièce est immobile
      const isStill =
        Math.abs(vel.x) < 0.1 &&
        Math.abs(vel.y) < 0.1 &&
        Math.abs(vel.z) < 0.1 &&
        Math.abs(angVel.x) < 0.3 &&
        Math.abs(angVel.y) < 0.3 &&
        Math.abs(angVel.z) < 0.3

      if (isStill) {
        setHasLanded(true)

        // Détecte quelle face est vers le haut
        const rotation = coinRef.current.rotation()
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
        const up = new THREE.Vector3(0, 1, 0)
        const coinUp = new THREE.Vector3(0, 1, 0).applyQuaternion(quat)

        // Si coinUp pointe vers le haut, c'est heads, sinon tails
        const dot = coinUp.dot(up)
        const actualResult = dot > 0 ? 'heads' : 'tails'

        setDetectedSide(actualResult)
        onLanded?.(actualResult)
      }
    }
  })

  return (
    <RigidBody
      ref={coinRef}
      position={[0, 3, 0]}
      colliders={false}
      restitution={0.4}
      friction={0.5}
      gravityScale={1}
      canSleep={false}
    >
      <CylinderCollider args={[COIN_THICKNESS / 2, COIN_RADIUS]} />

      {/* Cylindre de la pièce */}
      <Cylinder args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 32]}>
        <meshStandardMaterial
          color={NEON_COLORS.orange}
          metalness={0.9}
          roughness={0.1}
          emissive={hasLanded ? NEON_COLORS.orange : '#000000'}
          emissiveIntensity={hasLanded ? 0.3 : 0}
        />
      </Cylinder>

      {/* Face HEADS (dessus, Y+) */}
      <mesh position={[0, COIN_THICKNESS / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[COIN_RADIUS - 0.05, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.95}
          roughness={0.05}
          emissive="#FFB800"
          emissiveIntensity={hasLanded && detectedSide === 'heads' ? 0.8 : 0.2}
        />
      </mesh>

      {/* Symbole éclair sur HEADS */}
      <Text
        position={[0, COIN_THICKNESS / 2 + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.6}
        color="#0B0F1A"
        anchorX="center"
        anchorY="middle"
      >
        ⚡
      </Text>

      {/* Face TAILS (dessous, Y-) */}
      <mesh position={[0, -COIN_THICKNESS / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[COIN_RADIUS - 0.05, 32]} />
        <meshStandardMaterial
          color="#C0C0C0"
          metalness={0.9}
          roughness={0.1}
          emissive="#E8E8E8"
          emissiveIntensity={hasLanded && detectedSide === 'tails' ? 0.5 : 0.1}
        />
      </mesh>

      {/* Lettre C sur TAILS */}
      <Text
        position={[0, -COIN_THICKNESS / 2 - 0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        fontSize={0.7}
        color="#4A5568"
        anchorX="center"
        anchorY="middle"
      >
        C
      </Text>

      {/* Lumière de la pièce */}
      {hasLanded && (
        <pointLight
          color={detectedSide === 'heads' ? NEON_COLORS.orange : '#C0C0C0'}
          intensity={3}
          distance={4}
        />
      )}
    </RigidBody>
  )
}

/**
 * Système de particules pour célébration
 */
interface Particle {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  color: string
}

function ParticleSystem({ particles }: { particles: Particle[] }) {
  return (
    <>
      {particles.map((p) => (
        <mesh key={p.id} position={p.position.toArray()}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={p.life} />
        </mesh>
      ))}
    </>
  )
}

/**
 * Scène 3D du CoinFlip
 */
function CoinFlipScene({
  onWin,
  result = 'heads',
  prizeAmount = 10,
  isActive = false,
}: CoinFlip3DProps) {
  const [isFlipping, setIsFlipping] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [landedSide, setLandedSide] = useState<'heads' | 'tails' | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)

  // Audio
  const sounds = useMiniGameAudio('coin')

  const handleFlip = () => {
    if (isFlipping || !isActive) return

    setIsFlipping(true)
    setShowResult(false)
    setLandedSide(null)

    // Son de lancement
    sounds.flip.play()

    // Arrête le flip après 3 secondes
    setTimeout(() => {
      setIsFlipping(false)
      sounds.spin.stop()
    }, 3000)
  }

  const handleCoinLanded = (actualSide: 'heads' | 'tails') => {
    setLandedSide(actualSide)
    setShowResult(true)

    // Son d'atterrissage
    sounds.land.play()

    // Callback avec le résultat
    onWin?.(prizeAmount)

    // Particules si victoire
    if (prizeAmount > 0) {
      spawnCelebrationParticles()
    }
  }

  const spawnCelebrationParticles = () => {
    const newParticles: Particle[] = []
    const count = 20

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const speed = 2 + Math.random() * 2
      newParticles.push({
        id: particleIdRef.current++,
        position: new THREE.Vector3(0, 1, 0),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 3,
          Math.sin(angle) * speed
        ),
        life: 1,
        color: i % 2 === 0 ? NEON_COLORS.orange : NEON_COLORS.green,
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
          velocity: p.velocity.clone().multiplyScalar(0.95).add(new THREE.Vector3(0, -delta * 4, 0)),
          life: p.life - delta * 0.7,
        }))
        .filter((p) => p.life > 0)
    )
  })

  const isWin = prizeAmount > 0

  return (
    <>
      {/* Table de jeu */}
      <GameTable />

      {/* Pièce */}
      <Coin3D
        result={result}
        isFlipping={isFlipping}
        onLanded={handleCoinLanded}
      />

      {/* Résultat (texte 3D) */}
      {showResult && landedSide && (
        <group position={[0, 2.5, -3]}>
          <Text
            fontSize={0.8}
            color={landedSide === 'heads' ? NEON_COLORS.orange : '#C0C0C0'}
            anchorX="center"
            anchorY="middle"
              >
            {landedSide === 'heads' ? '⚡ PILE !' : '🪙 FACE !'}
          </Text>
          <Text
            position={[0, -0.7, 0]}
            fontSize={0.5}
            color={isWin ? NEON_COLORS.orange : '#ffffff'}
            anchorX="center"
            anchorY="middle"
              >
            {isWin ? `+${prizeAmount}` : '0'} crédits
          </Text>
        </group>
      )}

      {/* Bouton LANCER (mesh cliquable) */}
      {!isFlipping && !showResult && (
        <group position={[0, 0.5, 3]} onClick={handleFlip}>
          <mesh>
            <boxGeometry args={[2.5, 0.5, 0.8]} />
            <meshStandardMaterial
              color={NEON_COLORS.orange}
              emissive={NEON_COLORS.orange}
              emissiveIntensity={1}
            />
          </mesh>
          <Text
            position={[0, 0, 0.45]}
            fontSize={0.25}
            color="#0B0F1A"
            anchorX="center"
            anchorY="middle"
              >
            🪙 LANCER
          </Text>
        </group>
      )}

      {/* Particules */}
      <ParticleSystem particles={particles} />

      {/* Lumière d'ambiance pendant le flip */}
      {isFlipping && (
        <>
          <pointLight position={[0, 3, 0]} color={NEON_COLORS.orange} intensity={3} distance={6} />
          <pointLight position={[2, 2, 2]} color={NEON_COLORS.purple} intensity={2} distance={4} />
          <pointLight position={[-2, 2, -2]} color={NEON_COLORS.blue} intensity={2} distance={4} />
        </>
      )}
    </>
  )
}

/**
 * Composant principal CoinFlip 3D
 */
export function CoinFlip3D(props: CoinFlip3DProps) {
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
      cameraPosition={[0, 4, 8]}
      cameraFov={50}
      enablePhysics={true}
      gravity={[0, -15, 0]}
      enableShadows={true}
      shadowPosition={[0, -0.5, 0]}
      shadowOpacity={0.4}
      enableControls={false}
      primaryNeonColor={NEON_COLORS.orange}
      secondaryNeonColor={NEON_COLORS.purple}
      className="w-full h-full"
    >
      <CoinFlipScene {...props} />
    </GameCanvas>
  )
}
