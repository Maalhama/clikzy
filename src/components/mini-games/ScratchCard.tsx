'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy } from 'lucide-react'
import { useMiniGameSounds } from '@/hooks/mini-games/useMiniGameSounds'

interface ScratchCardProps {
  onComplete: (creditsWon: number) => void
  prizeAmount: number
  disabled?: boolean
}

// Responsive card dimensions
const CARD_WIDTH = 240
const CARD_HEIGHT = 150

interface ScratchParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

export default function ScratchCard({
  onComplete,
  prizeAmount,
  disabled = false,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const dprRef = useRef<number>(1)
  const [scratchParticles, setScratchParticles] = useState<ScratchParticle[]>([])
  const particleIdRef = useRef(0)

  const { playScratch, playWin, vibrate } = useMiniGameSounds()

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Setup high DPI canvas
    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr

    // Set actual canvas size in memory (scaled for retina)
    canvas.width = CARD_WIDTH * dpr
    canvas.height = CARD_HEIGHT * dpr

    // Set display size (CSS)
    canvas.style.width = `${CARD_WIDTH}px`
    canvas.style.height = `${CARD_HEIGHT}px`

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Scale context to match
    ctx.scale(dpr, dpr)

    const width = CARD_WIDTH
    const height = CARD_HEIGHT

    // Dark neon gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1A1033')
    gradient.addColorStop(0.3, '#2D1A4A')
    gradient.addColorStop(0.5, '#3D2066')
    gradient.addColorStop(0.7, '#2D1A4A')
    gradient.addColorStop(1, '#1A1033')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Shimmer effect - diagonal stripes
    ctx.globalAlpha = 0.1
    for (let i = -height; i < width + height; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + height, height)
      ctx.strokeStyle = '#9B5CFF'
      ctx.lineWidth = 8
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Noise texture with neon colors
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const opacity = Math.random() * 0.3
      const colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF']
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
      ctx.globalAlpha = opacity
      ctx.fillRect(x, y, 1, 1)
    }
    ctx.globalAlpha = 1

    // Border glow effect
    ctx.strokeStyle = '#9B5CFF'
    ctx.lineWidth = 3
    ctx.shadowColor = '#9B5CFF'
    ctx.shadowBlur = 15
    ctx.strokeRect(8, 8, width - 16, height - 16)
    ctx.shadowBlur = 0

    // Inner border
    ctx.strokeStyle = '#FF4FD8'
    ctx.lineWidth = 1
    ctx.strokeRect(15, 15, width - 30, height - 30)

    // Text with neon glow
    ctx.font = 'bold 18px "Inter", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Text shadow/glow
    ctx.shadowColor = '#FF4FD8'
    ctx.shadowBlur = 15
    ctx.fillStyle = '#FF4FD8'
    ctx.fillText('GRATTEZ ICI', width / 2, height / 2 - 8)
    ctx.shadowBlur = 0

    // Subtitle
    ctx.font = 'bold 10px "Inter", system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fillText('RÉVÉLEZ VOTRE GAIN', width / 2, height / 2 + 15)

    // Corner decorations
    ctx.strokeStyle = '#3CCBFF'
    ctx.lineWidth = 2
    ctx.shadowColor = '#3CCBFF'
    ctx.shadowBlur = 8

    // Top-left
    ctx.beginPath()
    ctx.moveTo(5, 25)
    ctx.lineTo(5, 5)
    ctx.lineTo(25, 5)
    ctx.stroke()

    // Top-right
    ctx.beginPath()
    ctx.moveTo(width - 25, 5)
    ctx.lineTo(width - 5, 5)
    ctx.lineTo(width - 5, 25)
    ctx.stroke()

    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(5, height - 25)
    ctx.lineTo(5, height - 5)
    ctx.lineTo(25, height - 5)
    ctx.stroke()

    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(width - 25, height - 5)
    ctx.lineTo(width - 5, height - 5)
    ctx.lineTo(width - 5, height - 25)
    ctx.stroke()

    ctx.shadowBlur = 0
  }, [])

  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  const getPercentage = () => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparentPixels = 0

    for (let i = 0; i < pixels.length; i += 80) {
      if (pixels[i + 3] < 128) {
        transparentPixels++
      }
    }

    const totalSampled = pixels.length / 80
    return (transparentPixels / totalSampled) * 100
  }

  // Émettre des particules de grattage
  const emitScratchParticles = useCallback((x: number, y: number) => {
    const colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF']
    const newParticles: ScratchParticle[] = []

    // Créer 3-5 particules
    const count = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 60,
        vy: -20 - Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    setScratchParticles(prev => [...prev, ...newParticles])

    // Nettoyer après animation
    setTimeout(() => {
      setScratchParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 1000)
  }, [])

  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isRevealed) return

    // Son de grattage et vibration légère
    playScratch()
    vibrate(10)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = dprRef.current
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = (e as React.MouseEvent).clientX - rect.left
      y = (e as React.MouseEvent).clientY - rect.top
    }

    // Scale coordinates to match CSS display size (rect is CSS size, we draw in logical coordinates)
    const scaleX = CARD_WIDTH / rect.width
    const scaleY = CARD_HEIGHT / rect.height
    x *= scaleX
    y *= scaleY

    // Émettre des particules de grattage à la position du curseur
    if ('touches' in e) {
      emitScratchParticles(e.touches[0].clientX, e.touches[0].clientY)
    } else {
      emitScratchParticles((e as React.MouseEvent).clientX, (e as React.MouseEvent).clientY)
    }

    // Save current transform and apply DPR scale for this operation
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2) // Slightly larger scratch radius for better feel
    ctx.fill()

    ctx.restore()

    const currentPercentage = getPercentage()

    if (currentPercentage > 55 && !isRevealed) {
      completeReveal()
    }
  }

  const completeReveal = () => {
    setIsRevealed(true)

    // Son de victoire et vibration à la révélation
    if (prizeAmount > 0) {
      playWin()

      if (prizeAmount >= 10) {
        vibrate([100, 50, 100, 50, 100]) // Jackpot
      } else {
        vibrate([70, 40, 70]) // Victoire normale
      }
    } else {
      vibrate(30)
    }

    setTimeout(() => {
      onComplete(prizeAmount)
    }, 800)
  }

  const isWin = isRevealed && prizeAmount > 0
  const isJackpot = isRevealed && prizeAmount >= 10

  return (
    <div className="relative flex flex-col items-center p-2 sm:p-4">

      <div
        className="relative select-none touch-none max-w-full"
        style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
      >
        {/* Prize Layer */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0F1A] via-[#141B2D] to-[#0B0F1A]"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(155, 92, 255, 0.3), transparent 50%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 70%, rgba(255, 79, 216, 0.3), transparent 50%)' }} />
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(155, 92, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(155, 92, 255, 0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isRevealed ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0.3 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Trophy with glow */}
            <motion.div
              className={`p-3 rounded-full mb-2 ${prizeAmount >= 5 ? 'bg-gradient-to-br from-[#FFB800] to-[#FF8C00]' : 'bg-gradient-to-br from-[#9B5CFF] to-[#FF4FD8]'}`}
              animate={isRevealed ? {
                boxShadow: prizeAmount >= 5
                  ? ['0 0 15px rgba(255, 184, 0, 0.5)', '0 0 30px rgba(255, 184, 0, 0.8)', '0 0 15px rgba(255, 184, 0, 0.5)']
                  : ['0 0 15px rgba(155, 92, 255, 0.5)', '0 0 30px rgba(155, 92, 255, 0.8)', '0 0 15px rgba(155, 92, 255, 0.5)']
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Trophy className={`w-6 h-6 ${prizeAmount >= 5 ? 'text-[#0B0F1A]' : 'text-white'}`} />
            </motion.div>

            <span className="text-[9px] uppercase tracking-[0.15em] text-[#9B5CFF] font-bold mb-0.5">Gagné</span>

            <div className="flex items-baseline gap-1.5">
              <motion.span
                className="text-4xl font-black"
                style={{
                  background: prizeAmount >= 5
                    ? 'linear-gradient(to bottom, #FFD700, #FFB800, #FF8C00)'
                    : 'linear-gradient(to bottom, #fff, #9B5CFF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={isRevealed ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isRevealed ? 2 : 0 }}
              >
                +{prizeAmount}
              </motion.span>
            </div>
          </motion.div>

          {/* Shine effect on reveal */}
          <AnimatePresence>
            {isRevealed && (
              <>
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
                {/* Particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 1,
                      scale: 0,
                      x: 150,
                      y: 100
                    }}
                    animate={{
                      opacity: 0,
                      scale: 1,
                      x: 150 + Math.cos(i * 30 * Math.PI / 180) * 120,
                      y: 100 + Math.sin(i * 30 * Math.PI / 180) * 80
                    }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ backgroundColor: i % 3 === 0 ? '#FFB800' : i % 3 === 1 ? '#9B5CFF' : '#FF4FD8' }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Scratch Canvas */}
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          className={`absolute inset-0 rounded-2xl cursor-crosshair transition-opacity duration-700 z-20 shadow-2xl ${isRevealed ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'}`}
          style={{ willChange: 'opacity, transform' }}
          onMouseDown={() => !disabled && setIsScratching(true)}
          onMouseUp={() => setIsScratching(false)}
          onMouseLeave={() => setIsScratching(false)}
          onMouseMove={(e) => isScratching && handleScratch(e)}
          onTouchStart={() => !disabled && setIsScratching(true)}
          onTouchEnd={() => setIsScratching(false)}
          onTouchMove={(e) => isScratching && handleScratch(e)}
        />

        {/* Scratch Particles */}
        <AnimatePresence>
          {scratchParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                opacity: 1,
                x: particle.x,
                y: particle.y,
                scale: 1,
              }}
              animate={{
                opacity: 0,
                x: particle.x + particle.vx,
                y: particle.y + particle.vy,
                scale: 0.3,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="fixed w-1.5 h-1.5 rounded-full pointer-events-none z-50"
              style={{
                backgroundColor: particle.color,
                boxShadow: `0 0 4px ${particle.color}`,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Frame */}
        <div className={`absolute -inset-1 rounded-[20px] pointer-events-none z-30 transition-all duration-500 border-2 ${
          isRevealed
            ? 'border-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.5)]'
            : 'border-[#9B5CFF]/30 shadow-[0_0_15px_rgba(155,92,255,0.2)]'
        }`} />
        {/* Outer glow ring */}
        <div className={`absolute -inset-2 rounded-[24px] pointer-events-none z-25 transition-all duration-500 border ${
          isRevealed
            ? 'border-[#00FF88]/30'
            : 'border-[#FF4FD8]/20'
        }`} />

        {/* Sparkles */}
        {isScratching && !isRevealed && (
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  scale: 0,
                  x: Math.random() * 300,
                  y: Math.random() * 200
                }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  y: '-=20',
                  rotate: 90
                }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="absolute"
              >
                <Sparkles
                  size={12}
                  color={i % 2 === 0 ? '#3CCBFF' : '#FF4FD8'}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      {!isRevealed && !isScratching && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center"
        >
          <motion.p
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] tracking-widest text-white/50 uppercase font-medium"
          >
            Grattez ici
          </motion.p>
        </motion.div>
      )}

      {/* Result after reveal */}
      {isRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-2 px-4 py-2 rounded-lg text-xs ${
            isJackpot
              ? 'bg-[#FFB800]/20 border border-[#FFB800]/50 text-[#FFB800]'
              : isWin
                ? 'bg-[#00FF88]/20 border border-[#00FF88]/50 text-[#00FF88]'
                : 'bg-white/5 border border-white/10 text-white/50'
          }`}
        >
          {isJackpot ? 'JACKPOT !' : isWin ? 'Bien joué !' : 'Perdu'}
        </motion.div>
      )}
    </div>
  )
}
