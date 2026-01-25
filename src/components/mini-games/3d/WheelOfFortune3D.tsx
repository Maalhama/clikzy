/**
 * Roue de la Fortune 3D - Mini-jeu avec rotation physique
 * Transformation de la version 2D SVG en expérience 3D immersive
 */

'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Cylinder, Torus, Cone } from '@react-three/drei'
import * as THREE from 'three'
import { NEON_COLORS, GAME_MATERIALS } from '@/lib/mini-games/materials'
import { GameCanvas } from './core/GameCanvas'
import { use3DPerformance } from '@/hooks/mini-games/use3DPerformance'
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'

// Configuration des segments (identique à la version 2D)
const SEGMENTS = [
  { value: 0, color: '#0B0F1A', textColor: '#4A5568', borderColor: '#1E2942' },
  { value: 0, color: '#141B2D', textColor: '#4A5568', borderColor: '#1E2942' },
  { value: 1, color: '#1A1033', textColor: NEON_COLORS.purple, borderColor: NEON_COLORS.purple },
  { value: 1, color: '#0B0F1A', textColor: NEON_COLORS.purple, borderColor: '#1E2942' },
  { value: 2, color: '#1A2A33', textColor: NEON_COLORS.blue, borderColor: NEON_COLORS.blue },
  { value: 3, color: '#2D1A3D', textColor: NEON_COLORS.pink, borderColor: NEON_COLORS.pink },
  { value: 3, color: '#1A1033', textColor: NEON_COLORS.pink, borderColor: '#1E2942' },
  { value: 10, color: NEON_COLORS.orange, textColor: '#0B0F1A', borderColor: '#FFD700', isSpecial: true },
]

const SEGMENT_COUNT = SEGMENTS.length
const SEGMENT_ANGLE = (Math.PI * 2) / SEGMENT_COUNT

interface WheelOfFortune3DProps {
  onWin?: (multiplier: number) => void
  targetSegment?: number
  isActive?: boolean
}

/**
 * Pointeur/Flèche 3D au-dessus de la roue
 */
function Pointer() {
  const pointerRef = useRef<THREE.Group>(null)

  // Animation du pointeur pendant le spin
  useFrame((state) => {
    if (pointerRef.current) {
      // Légère oscillation
      pointerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 8) * 0.1
    }
  })

  return (
    <group ref={pointerRef} position={[0, 0, 3.5]}>
      {/* Flèche conique */}
      <Cone args={[0.3, 0.8, 3]} rotation={[0, 0, Math.PI]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </Cone>

      {/* Base ronde */}
      <Cylinder args={[0.15, 0.15, 0.1, 16]} position={[0, 0.45, 0]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </Cylinder>

      {/* Lumière du pointeur */}
      <pointLight color="#ffffff" intensity={1} distance={2} />
    </group>
  )
}

/**
 * Segment de la roue 3D
 */
function WheelSegment({
  index,
  segment,
  isTarget
}: {
  index: number
  segment: typeof SEGMENTS[0]
  isTarget: boolean
}) {
  const angle = SEGMENT_ANGLE
  const rotationY = index * angle

  // Créé une géométrie de segment (portion de cercle)
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const radius = 2.5
    const depth = 0.5

    // Centre
    shape.moveTo(0, 0)

    // Arc du segment
    shape.absarc(0, 0, radius, -angle / 2, angle / 2, false)
    shape.lineTo(0, 0)

    const extrudeSettings = {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    }

    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [angle])

  // Couleur émissive si c'est un segment avec récompense
  const emissiveIntensity = segment.value > 0 ? 0.3 : 0.1

  return (
    <group rotation={[0, 0, rotationY]}>
      <mesh geometry={geometry} position={[0, 0, -0.25]}>
        <meshStandardMaterial
          color={segment.color}
          emissive={segment.borderColor}
          emissiveIntensity={isTarget ? 0.8 : emissiveIntensity}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Bordure du segment */}
      <mesh geometry={geometry} position={[0, 0, -0.25]} scale={1.02}>
        <meshBasicMaterial
          color={segment.borderColor}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Texte de la valeur */}
      <Text
        position={[0, 1.8, 0.3]}
        fontSize={0.5}
        color={segment.textColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.ttf"
      >
        {segment.value}
      </Text>

      {/* Lumière du segment si valeur > 0 */}
      {segment.value > 0 && (
        <pointLight
          position={[0, 1.5, 0.5]}
          color={segment.borderColor}
          intensity={isTarget ? 2 : segment.isSpecial ? 1.5 : 0.8}
          distance={3}
        />
      )}

      {/* Étoile pour le jackpot */}
      {segment.isSpecial && (
        <mesh position={[0, 1.2, 0.3]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={NEON_COLORS.orange}
            emissive={NEON_COLORS.orange}
            emissiveIntensity={1.5}
          />
          <pointLight color={NEON_COLORS.orange} intensity={2} distance={2} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Cercle central de la roue (bouton spin)
 */
function CenterHub({ onClick, isSpinning }: { onClick: () => void; isSpinning: boolean }) {
  const hubRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (hubRef.current && isSpinning) {
      // Pulse pendant le spin
      const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.05
      hubRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group ref={hubRef} position={[0, 0, 0.5]}>
      {/* Cylindre central */}
      <Cylinder args={[0.8, 0.8, 0.4, 32]} onClick={onClick}>
        <meshStandardMaterial
          {...GAME_MATERIALS.neonPurple}
          emissiveIntensity={isSpinning ? 1.5 : 0.8}
        />
      </Cylinder>

      {/* Texte SPIN */}
      <Text
        position={[0, 0, 0.25]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.ttf"
      >
        {isSpinning ? '...' : 'SPIN'}
      </Text>

      {/* Lumière du hub */}
      <pointLight
        color={NEON_COLORS.purple}
        intensity={isSpinning ? 3 : 1.5}
        distance={4}
      />
    </group>
  )
}

/**
 * Anneau extérieur décoratif avec lumières
 */
function OuterRing({ isSpinning }: { isSpinning: boolean }) {
  const lightsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (lightsRef.current && isSpinning) {
      lightsRef.current.rotation.z = state.clock.elapsedTime * 2
    }
  })

  const lightColors = [NEON_COLORS.purple, NEON_COLORS.pink, NEON_COLORS.blue, NEON_COLORS.orange]
  const lightCount = 12

  return (
    <group>
      {/* Torus extérieur */}
      <Torus args={[3.2, 0.15, 16, 32]}>
        <meshStandardMaterial
          color="#141B2D"
          emissive={NEON_COLORS.purple}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </Torus>

      {/* Lumières décoratives */}
      <group ref={lightsRef}>
        {Array.from({ length: lightCount }).map((_, i) => {
          const angle = (i / lightCount) * Math.PI * 2
          const x = Math.cos(angle) * 3.2
          const y = Math.sin(angle) * 3.2
          const color = lightColors[i % lightColors.length]

          return (
            <group key={i} position={[x, y, 0]}>
              <mesh>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={isSpinning ? 1.5 : 0.8}
                />
              </mesh>
              <pointLight color={color} intensity={0.5} distance={1} />
            </group>
          )
        })}
      </group>
    </group>
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
 * Scène 3D de la Roue de la Fortune
 */
function WheelScene({
  onWin,
  targetSegment = 0,
  isActive = false,
}: WheelOfFortune3DProps) {
  const wheelRef = useRef<THREE.Group>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [targetRotation, setTargetRotation] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)
  const lastTickTime = useRef(0)

  // Audio
  const sounds = useMiniGameAudio('wheel')

  const handleSpin = () => {
    if (isSpinning || !isActive) return

    setIsSpinning(true)

    // Son de début de rotation
    sounds.spinStart.play()

    // Calcul de la rotation finale
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * Math.PI * 2
    const targetAngle = (SEGMENT_COUNT - targetSegment) * SEGMENT_ANGLE - SEGMENT_ANGLE / 2
    const finalRotation = currentRotation + extraRotations + targetAngle

    setTargetRotation(finalRotation)

    // Fin du spin après 5 secondes
    setTimeout(() => {
      setIsSpinning(false)
      setCurrentRotation(finalRotation)

      const wonValue = SEGMENTS[targetSegment].value

      // Son de victoire si gain
      if (wonValue > 0) {
        sounds.win.play()
      }

      onWin?.(wonValue)

      // Particules si victoire
      if (wonValue > 0) {
        spawnCelebrationParticles(SEGMENTS[targetSegment].borderColor)
      }
    }, 5000)
  }

  const spawnCelebrationParticles = (color: string) => {
    const newParticles: Particle[] = []
    const count = 30

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const speed = 2 + Math.random() * 2
      newParticles.push({
        id: particleIdRef.current++,
        position: new THREE.Vector3(0, 0, 0.5),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          Math.random() * 3
        ),
        life: 1,
        color,
      })
    }

    setParticles((prev) => [...prev, ...newParticles])
  }

  // Animation de la roue
  useFrame((state, delta) => {
    if (wheelRef.current && isSpinning) {
      // Easing cubique pour ralentissement progressif
      const progress = Math.min((state.clock.elapsedTime % 5) / 5, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      wheelRef.current.rotation.z = currentRotation + (targetRotation - currentRotation) * eased

      // Son de tick à intervalles réguliers (plus lent vers la fin)
      const tickInterval = 0.1 + progress * 0.3 // Plus lent quand progress augmente
      if (state.clock.elapsedTime - lastTickTime.current > tickInterval) {
        sounds.tick.play()
        lastTickTime.current = state.clock.elapsedTime
      }
    }

    // Animation des particules
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          position: p.position.clone().add(p.velocity.clone().multiplyScalar(delta)),
          velocity: p.velocity.clone().multiplyScalar(0.95),
          life: p.life - delta * 0.8,
        }))
        .filter((p) => p.life > 0)
    )
  })

  return (
    <>
      {/* Pointeur */}
      <Pointer />

      {/* Anneau extérieur */}
      <OuterRing isSpinning={isSpinning} />

      {/* Roue principale */}
      <group ref={wheelRef} rotation={[0, 0, 0]}>
        {/* Segments */}
        {SEGMENTS.map((seg, i) => (
          <WheelSegment
            key={i}
            index={i}
            segment={seg}
            isTarget={i === targetSegment && !isSpinning}
          />
        ))}

        {/* Hub central */}
        <CenterHub onClick={handleSpin} isSpinning={isSpinning} />
      </group>

      {/* Particules de célébration */}
      <ParticleSystem particles={particles} />
    </>
  )
}

/**
 * Composant principal Roue de la Fortune 3D
 * Wrapper avec détection de support 3D
 */
export function WheelOfFortune3D(props: WheelOfFortune3DProps) {
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
      cameraPosition={[0, -8, 6]}
      cameraFov={45}
      enablePhysics={false}
      enableShadows={true}
      shadowPosition={[0, 0, -1]}
      shadowOpacity={0.3}
      enableControls={false}
      primaryNeonColor={NEON_COLORS.purple}
      secondaryNeonColor={NEON_COLORS.blue}
      className="w-full h-full"
    >
      <WheelScene {...props} />
    </GameCanvas>
  )
}
