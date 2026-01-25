/**
 * ScratchCard 3D - Mini-jeu avec shader de grattage réaliste
 * Transformation de la version Canvas 2D en vraie carte 3D grattable
 */

'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { Text, Box } from '@react-three/drei'
import * as THREE from 'three'
import { NEON_COLORS } from '@/lib/mini-games/materials'
import { GameCanvas } from './core/GameCanvas'
import { use3DPerformance } from '@/hooks/mini-games/use3DPerformance'
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'

// Shader personnalisé pour le grattage
const ScratchCardShader = {
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D topTexture;
    uniform sampler2D bottomTexture;
    uniform sampler2D maskTexture;
    uniform float revealAmount;

    varying vec2 vUv;

    void main() {
      vec4 topColor = texture2D(topTexture, vUv);
      vec4 bottomColor = texture2D(bottomTexture, vUv);
      float mask = texture2D(maskTexture, vUv).a;

      // Inverser le masque : transparent où on a gratté
      float alpha = topColor.a * (1.0 - mask);

      // Blend entre top et bottom selon le masque
      vec4 finalColor = mix(bottomColor, topColor, alpha);

      // Override complet si revealAmount > 0.55
      if (revealAmount > 0.55) {
        finalColor = bottomColor;
      }

      gl_FragColor = finalColor;
    }
  `,
}

interface ScratchCard3DProps {
  onWin?: (credits: number) => void
  prizeAmount?: number
  isActive?: boolean
}

const CARD_WIDTH = 4
const CARD_HEIGHT = 2.5

/**
 * Crée la texture "GRATTEZ ICI" (couche supérieure)
 */
function createTopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const ctx = canvas.getContext('2d')!

  // Gradient neon background
  const gradient = ctx.createLinearGradient(0, 0, 512, 320)
  gradient.addColorStop(0, '#1A1033')
  gradient.addColorStop(0.3, '#2D1A4A')
  gradient.addColorStop(0.5, '#3D2066')
  gradient.addColorStop(0.7, '#2D1A4A')
  gradient.addColorStop(1, '#1A1033')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 320)

  // Shimmer diagonal stripes
  ctx.globalAlpha = 0.1
  for (let i = -320; i < 512 + 320; i += 20) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 320, 320)
    ctx.strokeStyle = '#9B5CFF'
    ctx.lineWidth = 8
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Noise texture
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 320
    const opacity = Math.random() * 0.3
    const colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF']
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.globalAlpha = opacity
    ctx.fillRect(x, y, 2, 2)
  }
  ctx.globalAlpha = 1

  // Border glow
  ctx.strokeStyle = '#9B5CFF'
  ctx.lineWidth = 6
  ctx.shadowColor = '#9B5CFF'
  ctx.shadowBlur = 30
  ctx.strokeRect(16, 16, 512 - 32, 320 - 32)
  ctx.shadowBlur = 0

  // Inner border
  ctx.strokeStyle = '#FF4FD8'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, 512 - 60, 320 - 60)

  // Text with glow
  ctx.font = 'bold 48px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#FF4FD8'
  ctx.shadowBlur = 30
  ctx.fillStyle = '#FF4FD8'
  ctx.fillText('GRATTEZ ICI', 256, 140)
  ctx.shadowBlur = 0

  // Subtitle
  ctx.font = 'bold 20px Inter, Arial, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillText('RÉVÉLEZ VOTRE GAIN', 256, 190)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Crée la texture du prix (couche inférieure)
 */
function createBottomTexture(prizeAmount: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const gradient = ctx.createRadialGradient(256, 160, 0, 256, 160, 400)
  gradient.addColorStop(0, '#0B0F1A')
  gradient.addColorStop(0.5, '#141B2D')
  gradient.addColorStop(1, '#0B0F1A')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 320)

  // Radial glow effects
  ctx.globalAlpha = 0.3
  const glow1 = ctx.createRadialGradient(150, 100, 0, 150, 100, 200)
  glow1.addColorStop(0, 'rgba(155, 92, 255, 0.5)')
  glow1.addColorStop(1, 'transparent')
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, 512, 320)

  const glow2 = ctx.createRadialGradient(362, 220, 0, 362, 220, 200)
  glow2.addColorStop(0, 'rgba(255, 79, 216, 0.5)')
  glow2.addColorStop(1, 'transparent')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, 512, 320)
  ctx.globalAlpha = 1

  // Grid pattern
  ctx.strokeStyle = 'rgba(155, 92, 255, 0.1)'
  ctx.lineWidth = 1
  for (let x = 0; x < 512; x += 20) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 320)
    ctx.stroke()
  }
  for (let y = 0; y < 320; y += 20) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  }

  // Trophy icon (simple)
  const isJackpot = prizeAmount >= 5
  ctx.fillStyle = isJackpot ? '#FFB800' : '#9B5CFF'
  ctx.shadowColor = isJackpot ? '#FFB800' : '#9B5CFF'
  ctx.shadowBlur = 40
  ctx.beginPath()
  ctx.arc(256, 100, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // "GAGNÉ" text
  ctx.font = 'bold 24px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#9B5CFF'
  ctx.fillText('GAGNÉ', 256, 160)

  // Prize amount
  ctx.font = 'bold 80px Inter, Arial, sans-serif'
  const prizeGradient = ctx.createLinearGradient(256, 180, 256, 260)
  if (isJackpot) {
    prizeGradient.addColorStop(0, '#FFD700')
    prizeGradient.addColorStop(0.5, '#FFB800')
    prizeGradient.addColorStop(1, '#FF8C00')
  } else {
    prizeGradient.addColorStop(0, '#ffffff')
    prizeGradient.addColorStop(1, '#9B5CFF')
  }
  ctx.fillStyle = prizeGradient
  ctx.shadowColor = isJackpot ? '#FFB800' : '#9B5CFF'
  ctx.shadowBlur = 30
  ctx.fillText(`+${prizeAmount}`, 256, 230)
  ctx.shadowBlur = 0

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Crée la texture de masque (pour le grattage)
 */
function createMaskTexture(): {
  texture: THREE.CanvasTexture
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const ctx = canvas.getContext('2d')!

  // Initialiser à transparent (non gratté)
  ctx.clearRect(0, 0, 512, 320)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return { texture, canvas, ctx }
}

/**
 * Carte 3D avec shader de grattage
 */
function ScratchCard3D_Internal({
  onWin,
  prizeAmount = 10,
  isActive = false,
}: ScratchCard3DProps) {
  const cardRef = useRef<THREE.Mesh>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [scratchedAmount, setScratchedAmount] = useState(0)

  const { camera, raycaster, gl } = useThree()

  // Audio
  const sounds = useMiniGameAudio('scratch')

  // Créer les textures
  const topTexture = useMemo(() => createTopTexture(), [])
  const bottomTexture = useMemo(() => createBottomTexture(prizeAmount), [prizeAmount])
  const maskData = useMemo(() => createMaskTexture(), [])

  // Uniforms pour le shader
  const uniforms = useMemo(
    () => ({
      topTexture: { value: topTexture },
      bottomTexture: { value: bottomTexture },
      maskTexture: { value: maskData.texture },
      revealAmount: { value: 0 },
    }),
    [topTexture, bottomTexture, maskData.texture]
  )

  // Calculer le pourcentage gratté
  const getPercentage = () => {
    const imageData = maskData.ctx.getImageData(0, 0, 512, 320)
    const pixels = imageData.data
    let scratchedPixels = 0

    for (let i = 0; i < pixels.length; i += 320) {
      // Échantillonnage
      if (pixels[i + 3] > 128) {
        // Alpha > 128 = gratté
        scratchedPixels++
      }
    }

    const totalSampled = pixels.length / 320
    return (scratchedPixels / totalSampled) * 100
  }

  // Gratter à une position UV
  const scratchAtUV = (u: number, v: number) => {
    if (!isActive || isRevealed) return

    const x = u * 512
    const y = (1 - v) * 320 // Inverser Y pour correspondre au canvas

    // Dessiner un cercle blanc (gratté) sur le masque
    maskData.ctx.fillStyle = 'white'
    maskData.ctx.globalAlpha = 1
    maskData.ctx.beginPath()
    maskData.ctx.arc(x, y, 30, 0, Math.PI * 2)
    maskData.ctx.fill()

    maskData.texture.needsUpdate = true

    // Vérifier le pourcentage
    const percentage = getPercentage()
    setScratchedAmount(percentage)

    if (percentage > 55 && !isRevealed) {
      completeReveal()
    }
  }

  const completeReveal = () => {
    setIsRevealed(true)
    uniforms.revealAmount.value = 1
    // Arrêter le son de grattage et jouer le son de révélation
    sounds.scratch.stop()
    sounds.reveal.play()
    setTimeout(() => {
      onWin?.(prizeAmount)
    }, 800)
  }

  // Gérer les interactions
  useEffect(() => {
    const canvas = gl.domElement

    const handlePointerDown = () => {
      if (!isActive || isRevealed) return
      setIsScratching(true)
      // Son de grattage (loop)
      sounds.scratch.play()
    }

    const handlePointerUp = () => {
      setIsScratching(false)
      // Arrêter le son de grattage
      sounds.scratch.stop()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isScratching || !cardRef.current) return

      // Calculer la position du curseur en coordonnées normalisées
      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycasting
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      const intersects = raycaster.intersectObject(cardRef.current)

      if (intersects.length > 0) {
        const uv = intersects[0].uv
        if (uv) {
          scratchAtUV(uv.x, uv.y)
        }
      }
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerleave', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerUp)
    }
  }, [isScratching, isActive, isRevealed, camera, raycaster, gl.domElement])

  // Animation de révélation
  useFrame(() => {
    if (isRevealed && uniforms.revealAmount.value < 1) {
      uniforms.revealAmount.value += 0.05
    }
  })

  return (
    <>
      {/* Carte principale */}
      <mesh ref={cardRef} position={[0, 0, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={ScratchCardShader.vertexShader}
          fragmentShader={ScratchCardShader.fragmentShader}
          transparent
        />
      </mesh>

      {/* Bordure de la carte */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[CARD_WIDTH + 0.1, CARD_HEIGHT + 0.1]} />
        <meshStandardMaterial
          color={isRevealed ? NEON_COLORS.green : NEON_COLORS.purple}
          emissive={isRevealed ? NEON_COLORS.green : NEON_COLORS.purple}
          emissiveIntensity={isRevealed ? 0.5 : 0.2}
        />
      </mesh>

      {/* Texte hint en bas */}
      {!isRevealed && !isScratching && (
        <Text
          position={[0, -CARD_HEIGHT / 2 - 0.5, 0]}
          fontSize={0.2}
          color="rgba(255, 255, 255, 0.5)"
          anchorX="center"
          anchorY="middle"
        >
          Grattez ici
        </Text>
      )}

      {/* Texte résultat après révélation */}
      {isRevealed && (
        <Text
          position={[0, -CARD_HEIGHT / 2 - 0.5, 0]}
          fontSize={0.2}
          color={prizeAmount >= 10 ? NEON_COLORS.orange : prizeAmount > 0 ? NEON_COLORS.green : '#ffffff'}
          anchorX="center"
          anchorY="middle"
        >
          {prizeAmount >= 10 ? 'JACKPOT !' : prizeAmount > 0 ? 'Bien joué !' : 'Perdu'}
        </Text>
      )}

      {/* Particules lors du grattage */}
      {isScratching && !isRevealed && (
        <>
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2
            const radius = 2
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * radius + (Math.random() - 0.5),
                  Math.sin(angle) * radius + (Math.random() - 0.5),
                  0.5,
                ]}
              >
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial
                  color={i % 2 === 0 ? NEON_COLORS.blue : NEON_COLORS.pink}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            )
          })}
        </>
      )}

      {/* Lumière ambiante */}
      <pointLight position={[0, 0, 3]} intensity={isRevealed ? 2 : 1} color={NEON_COLORS.purple} />
    </>
  )
}

/**
 * Composant principal ScratchCard 3D
 */
export function ScratchCard3D(props: ScratchCard3DProps) {
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
      cameraPosition={[0, 0, 5]}
      cameraFov={50}
      enablePhysics={false}
      enableShadows={false}
      enableControls={false}
      primaryNeonColor={NEON_COLORS.purple}
      secondaryNeonColor={NEON_COLORS.pink}
      className="w-full h-full"
    >
      <ScratchCard3D_Internal {...props} />
    </GameCanvas>
  )
}
