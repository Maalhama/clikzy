/**
 * Machine à Sous 3D - Mini-jeu avec rouleaux cylindriques rotatifs
 * Transformation de la version 2D en vraie machine à sous 3D
 */

'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cylinder, Text, Box, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { NEON_COLORS, GAME_MATERIALS } from '@/lib/mini-games/materials'
import { GameCanvas } from './core/GameCanvas'
import { use3DPerformance } from '@/hooks/mini-games/use3DPerformance'
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'
import { SLOTS_SYMBOLS } from '@/types/miniGames'

const REEL_SYMBOLS = SLOTS_SYMBOLS // ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣']
const SYMBOL_HEIGHT = 1.2
const REEL_RADIUS = 0.8
const REEL_HEIGHT = SYMBOL_HEIGHT * REEL_SYMBOLS.length

interface SlotMachine3DProps {
  onWin?: (credits: number) => void
  targetSymbols?: number[]
  prizeAmount?: number
  isActive?: boolean
}

/**
 * Symbole 3D sur un rouleau
 */
function ReelSymbol({
  symbol,
  angle,
  radius,
  isHighlighted = false
}: {
  symbol: string
  angle: number
  radius: number
  isHighlighted?: boolean
}) {
  const x = Math.sin(angle) * radius
  const z = Math.cos(angle) * radius

  return (
    <group position={[x, 0, z]} rotation={[0, -angle, 0]}>
      {/* Fond du symbole */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshStandardMaterial
          color={isHighlighted ? NEON_COLORS.orange : '#1E2942'}
          emissive={isHighlighted ? NEON_COLORS.orange : '#000000'}
          emissiveIntensity={isHighlighted ? 0.5 : 0}
        />
      </mesh>

      {/* Texte emoji */}
      <Text
        position={[0, 0, 0.05]}
        fontSize={0.6}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {symbol}
      </Text>

      {/* Lumière si highlighted */}
      {isHighlighted && (
        <pointLight color={NEON_COLORS.orange} intensity={1} distance={2} />
      )}
    </group>
  )
}

/**
 * Rouleau cylindrique 3D
 */
function Reel3D({
  reelIndex,
  isSpinning,
  isStopped,
  finalSymbol,
  onStopped
}: {
  reelIndex: number
  isSpinning: boolean
  isStopped: boolean
  finalSymbol: number
  onStopped?: () => void
}) {
  const reelRef = useRef<THREE.Group>(null)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [targetRotation, setTargetRotation] = useState(0)
  const [isSpinningLocal, setIsSpinningLocal] = useState(false)

  const anglePerSymbol = (Math.PI * 2) / REEL_SYMBOLS.length

  // Démarre le spin
  useEffect(() => {
    if (isSpinning && !isSpinningLocal) {
      setIsSpinningLocal(true)

      // Calcule la rotation finale pour s'arrêter sur le bon symbole
      const extraRotations = (10 + reelIndex * 2) * Math.PI * 2 // 10+ tours complets
      const targetAngle = finalSymbol * anglePerSymbol
      const finalRotation = currentRotation + extraRotations + targetAngle

      setTargetRotation(finalRotation)
    }
  }, [isSpinning, finalSymbol, currentRotation, anglePerSymbol, reelIndex, isSpinningLocal])

  // Arrête le spin
  useEffect(() => {
    if (isStopped && isSpinningLocal) {
      setIsSpinningLocal(false)
      setCurrentRotation(targetRotation)
      onStopped?.()
    }
  }, [isStopped, isSpinningLocal, targetRotation, onStopped])

  // Animation de rotation
  useFrame((state, delta) => {
    if (reelRef.current && isSpinningLocal && !isStopped) {
      // Rotation progressive avec ralentissement
      const duration = 1.5 + reelIndex * 0.7 // Durée croissante par rouleau
      const elapsed = state.clock.elapsedTime % 100

      // Easing exponentiel pour ralentissement naturel
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      reelRef.current.rotation.y = currentRotation + (targetRotation - currentRotation) * eased
    }
  })

  // Calcule quel symbole est actuellement visible au centre
  const currentSymbolIndex = useMemo(() => {
    if (!reelRef.current) return 0
    const normalizedRotation = ((reelRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    return Math.round(normalizedRotation / anglePerSymbol) % REEL_SYMBOLS.length
  }, [anglePerSymbol])

  return (
    <group ref={reelRef} position={[0, 0, 0]}>
      {/* Cylindre de base */}
      <Cylinder args={[REEL_RADIUS, REEL_RADIUS, SYMBOL_HEIGHT * 3, 32]}>
        <meshStandardMaterial
          color="#0B0F1A"
          metalness={0.8}
          roughness={0.3}
        />
      </Cylinder>

      {/* Symboles autour du cylindre */}
      {REEL_SYMBOLS.map((symbol, i) => {
        const angle = i * anglePerSymbol
        return (
          <ReelSymbol
            key={i}
            symbol={symbol}
            angle={angle}
            radius={REEL_RADIUS + 0.01}
            isHighlighted={isStopped && i === finalSymbol}
          />
        )
      })}
    </group>
  )
}

/**
 * Cadre de la machine à sous
 */
function SlotMachineFrame() {
  return (
    <group>
      {/* Base */}
      <Box args={[8, 0.5, 4]} position={[0, -3, 0]}>
        <meshStandardMaterial {...GAME_MATERIALS.darkPlastic} color="#141B2D" />
      </Box>

      {/* Panneau arrière */}
      <Box args={[8, 6, 0.5]} position={[0, 0, -2]}>
        <meshStandardMaterial {...GAME_MATERIALS.darkPlastic} color="#0B0F1A" />
      </Box>

      {/* Panneau avant supérieur (JACKPOT) */}
      <Box args={[6, 1.5, 0.3]} position={[0, 3, 1.5]}>
        <meshStandardMaterial
          color={NEON_COLORS.orange}
          emissive={NEON_COLORS.orange}
          emissiveIntensity={0.8}
        />
      </Box>

      <Text
        position={[0, 3, 1.7]}
        fontSize={0.5}
        color="#0B0F1A"
        anchorX="center"
        anchorY="middle"
      >
        ⚡ JACKPOT ⚡
      </Text>

      {/* Lumières décoratives */}
      {[-2, -1, 0, 1, 2].map((x, i) => {
        const colors = [NEON_COLORS.purple, NEON_COLORS.pink, NEON_COLORS.orange, NEON_COLORS.pink, NEON_COLORS.purple]
        return (
          <group key={i} position={[x * 1.2, -2.5, 1.5]}>
            <mesh>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial
                color={colors[i]}
                emissive={colors[i]}
                emissiveIntensity={1}
              />
            </mesh>
            <pointLight color={colors[i]} intensity={0.5} distance={2} />
          </group>
        )
      })}
    </group>
  )
}

/**
 * Fenêtre de visualisation (masque les symboles hors vue)
 */
function ViewWindow() {
  return (
    <group position={[0, 0, 1]}>
      {/* Cadre supérieur */}
      <Box args={[6, 0.5, 0.2]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#2A3A5A" metalness={0.5} roughness={0.5} />
      </Box>

      {/* Cadre inférieur */}
      <Box args={[6, 0.5, 0.2]} position={[0, -1.5, 0]}>
        <meshStandardMaterial color="#2A3A5A" metalness={0.5} roughness={0.5} />
      </Box>

      {/* Ligne de gain (centrale) */}
      <Box args={[6.5, 0.02, 0.05]} position={[0, 0, 0.15]}>
        <meshStandardMaterial
          color={NEON_COLORS.orange}
          emissive={NEON_COLORS.orange}
          emissiveIntensity={1}
          transparent
          opacity={0.6}
        />
      </Box>
    </group>
  )
}

/**
 * Levier 3D cliquable
 */
function Lever({ onClick, isPulled }: { onClick: () => void; isPulled: boolean }) {
  const leverRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (leverRef.current) {
      // Retourne à la position normale après avoir été tiré
      const targetRotation = isPulled ? Math.PI / 4 : 0
      leverRef.current.rotation.x = THREE.MathUtils.lerp(
        leverRef.current.rotation.x,
        targetRotation,
        0.1
      )
    }
  })

  return (
    <group ref={leverRef} position={[4, 0, 0]} onClick={onClick}>
      {/* Poignée */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          {...GAME_MATERIALS.neonPink}
          emissiveIntensity={1}
        />
      </mesh>

      {/* Tige */}
      <Cylinder args={[0.1, 0.1, 2, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial
          {...GAME_MATERIALS.metalChrome}
        />
      </Cylinder>

      {/* Base */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
        <meshStandardMaterial color="#2A3A5A" />
      </mesh>

      {/* Lumière */}
      <pointLight color={NEON_COLORS.pink} intensity={1} distance={2} />
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
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={p.life} />
        </mesh>
      ))}
    </>
  )
}

/**
 * Scène 3D de la Machine à Sous
 */
function SlotMachineScene({
  onWin,
  targetSymbols = [0, 0, 0],
  prizeAmount = 0,
  isActive = false,
}: SlotMachine3DProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [stoppedReels, setStoppedReels] = useState([false, false, false])
  const [leverPulled, setLeverPulled] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)

  // Audio
  const sounds = useMiniGameAudio('slots')

  const handleSpin = () => {
    if (isSpinning || !isActive) return

    setLeverPulled(true)
    setIsSpinning(true)
    setStoppedReels([false, false, false])
    setShowResult(false)

    // Son de rotation (loop)
    sounds.spin.play()

    // Arrête les rouleaux séquentiellement
    const stopTimes = [1500, 2200, 2900]

    stopTimes.forEach((time, index) => {
      setTimeout(() => {
        // Son d'arrêt d'un rouleau
        sounds.stop.play()

        setStoppedReels((prev) => {
          const newStopped = [...prev]
          newStopped[index] = true
          return newStopped
        })

        // Dernier rouleau arrêté
        if (index === 2) {
          setTimeout(() => {
            setIsSpinning(false)
            setLeverPulled(false)
            setShowResult(true)

            // Arrêter le son de rotation
            sounds.spin.stop()

            // Son de jackpot si gros gain
            if (prizeAmount >= 10) {
              sounds.jackpot.play()
            }

            // Particules si victoire
            if (prizeAmount > 0) {
              spawnCelebrationParticles()
            }

            onWin?.(prizeAmount)
          }, 500)
        }
      }, time)
    })
  }

  const spawnCelebrationParticles = () => {
    const newParticles: Particle[] = []
    const count = 40

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const speed = 2 + Math.random() * 3
      const colors = [NEON_COLORS.orange, NEON_COLORS.purple, NEON_COLORS.pink]
      newParticles.push({
        id: particleIdRef.current++,
        position: new THREE.Vector3(0, 0, 2),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 4,
          Math.sin(angle) * speed
        ),
        life: 1,
        color: colors[i % colors.length],
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
          velocity: p.velocity.clone().multiplyScalar(0.95).add(new THREE.Vector3(0, -delta * 5, 0)),
          life: p.life - delta * 0.6,
        }))
        .filter((p) => p.life > 0)
    )
  })

  const allMatch = targetSymbols[0] === targetSymbols[1] && targetSymbols[1] === targetSymbols[2]
  const isJackpot = prizeAmount >= 10

  return (
    <>
      {/* Cadre de la machine */}
      <SlotMachineFrame />

      {/* Rouleaux */}
      {[0, 1, 2].map((index) => (
        <group key={index} position={[(index - 1) * 2, 0, 0]}>
          <Reel3D
            reelIndex={index}
            isSpinning={isSpinning}
            isStopped={stoppedReels[index]}
            finalSymbol={targetSymbols[index]}
          />
        </group>
      ))}

      {/* Fenêtre de visualisation */}
      <ViewWindow />

      {/* Levier */}
      <Lever onClick={handleSpin} isPulled={leverPulled} />

      {/* Résultat (texte 3D) */}
      {showResult && (
        <group position={[0, -3.5, 2]}>
          <Text
            fontSize={0.5}
            color={isJackpot || allMatch ? NEON_COLORS.orange : prizeAmount > 0 ? NEON_COLORS.green : '#ffffff'}
            anchorX="center"
            anchorY="middle"
              >
            {allMatch ? 'TRIPLE!' : isJackpot ? 'JACKPOT!' : prizeAmount > 0 ? 'Gagné!' : 'Perdu'}
          </Text>
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.4}
            color={isJackpot || allMatch ? NEON_COLORS.orange : '#ffffff'}
            anchorX="center"
            anchorY="middle"
              >
            {prizeAmount > 0 ? `+${prizeAmount}` : `${prizeAmount}`} crédits
          </Text>
        </group>
      )}

      {/* Particules */}
      <ParticleSystem particles={particles} />

      {/* Lumières d'ambiance qui clignotent pendant le spin */}
      {isSpinning && (
        <>
          <pointLight position={[-3, 2, 2]} color={NEON_COLORS.purple} intensity={2} distance={5} />
          <pointLight position={[3, 2, 2]} color={NEON_COLORS.pink} intensity={2} distance={5} />
          <pointLight position={[0, 3, 3]} color={NEON_COLORS.orange} intensity={3} distance={6} />
        </>
      )}
    </>
  )
}

/**
 * Composant principal SlotMachine 3D
 */
export function SlotMachine3D(props: SlotMachine3DProps) {
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
      cameraPosition={[0, 0, 12]}
      cameraFov={50}
      enablePhysics={false}
      enableShadows={true}
      shadowPosition={[0, -3, 0]}
      shadowOpacity={0.4}
      enableControls={false}
      primaryNeonColor={NEON_COLORS.orange}
      secondaryNeonColor={NEON_COLORS.purple}
      className="w-full h-full"
    >
      <SlotMachineScene {...props} />
    </GameCanvas>
  )
}
