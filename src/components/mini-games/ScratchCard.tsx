'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy } from 'lucide-react'

interface ScratchCardProps {
  onComplete: (creditsWon: number) => void
  prizeAmount: number
  disabled?: boolean
}

export default function ScratchCard({
  onComplete,
  prizeAmount,
  disabled = false,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#777b7e')
    gradient.addColorStop(0.2, '#baccde')
    gradient.addColorStop(0.4, '#ffffff')
    gradient.addColorStop(0.5, '#9a9da1')
    gradient.addColorStop(0.7, '#ffffff')
    gradient.addColorStop(1, '#777b7e')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Noise texture
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const opacity = Math.random() * 0.15
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillRect(x, y, 1, 1)
    }

    // Text
    ctx.font = 'bold 24px "Inter", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillText('GRATTEZ ICI', width / 2 + 1, height / 2 + 1)

    const textGradient = ctx.createLinearGradient(0, height / 2 - 20, 0, height / 2 + 20)
    textGradient.addColorStop(0, '#4a4a4a')
    textGradient.addColorStop(1, '#2a2a2a')
    ctx.fillStyle = textGradient
    ctx.fillText('GRATTEZ ICI', width / 2, height / 2)

    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(5, 5, width - 10, height - 10)
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

  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isRevealed) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = (e as React.MouseEvent).clientX - rect.left
      y = (e as React.MouseEvent).clientY - rect.top
    }

    // Scale coordinates if canvas is sized differently
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    x *= scaleX
    y *= scaleY

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 25, 0, Math.PI * 2)
    ctx.fill()

    const currentPercentage = getPercentage()

    if (currentPercentage > 55 && !isRevealed) {
      completeReveal()
    }
  }

  const completeReveal = () => {
    setIsRevealed(true)
    setTimeout(() => {
      onComplete(prizeAmount)
    }, 800)
  }

  return (
    <div className="relative flex flex-col items-center p-4">
      <div
        className="relative select-none touch-none"
        style={{ width: '300px', height: '200px' }}
      >
        {/* Prize Layer */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-white/20 bg-[#141B2D]"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, #9B5CFF, transparent)' }} />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isRevealed ? { scale: 1.1, opacity: 1 } : { scale: 0.9, opacity: 0.5 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="p-3 rounded-full bg-white/5 mb-2 border border-white/10">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <span className="text-xs uppercase tracking-widest text-white/40 font-bold">Vous avez gagné</span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-6xl font-black tracking-tighter"
                style={{
                  background: 'linear-gradient(to bottom, #fff, #3CCBFF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 10px rgba(60, 203, 255, 0.5))'
                }}
              >
                {prizeAmount}
              </span>
              <span className="text-xl font-bold text-white/80">CRÉDITS</span>
            </div>
          </motion.div>

          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Scratch Canvas */}
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          className={`absolute inset-0 rounded-2xl cursor-crosshair transition-opacity duration-700 z-20 shadow-2xl ${isRevealed ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'}`}
          onMouseDown={() => !disabled && setIsScratching(true)}
          onMouseUp={() => setIsScratching(false)}
          onMouseLeave={() => setIsScratching(false)}
          onMouseMove={(e) => isScratching && handleScratch(e)}
          onTouchStart={() => !disabled && setIsScratching(true)}
          onTouchEnd={() => setIsScratching(false)}
          onTouchMove={(e) => isScratching && handleScratch(e)}
        />

        {/* Frame */}
        <div className={`absolute -inset-1 rounded-[20px] pointer-events-none z-30 transition-colors duration-500 border-2 ${isRevealed ? 'border-[#00FF88] animate-pulse' : 'border-white/10'
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-xs tracking-widest text-white/30 uppercase font-medium"
        >
          Grattez pour révéler votre récompense
        </motion.div>
      )}
    </div>
  )
}
