'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'

interface PachinkoProps {
  onComplete: (creditsWon: number) => void
  targetSlot: number
  disabled?: boolean
}

const SLOTS = [0, 1, 2, 5, 10, 5, 2, 1, 0]
const BOARD_WIDTH = 320
const BOARD_HEIGHT = 400
const BALL_RADIUS = 8
const PEG_RADIUS = 6
const GRAVITY = 0.15 // Ralenti pour une descente plus douce
const BOUNCE = 0.65
const FRICTION = 0.995
const MAX_VELOCITY = 4 // Limite la vitesse max

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
}

interface Peg {
  x: number
  y: number
  hit: boolean
}

export default function Pachinko({
  onComplete,
  targetSlot,
  disabled = false,
}: PachinkoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const [isDropping, setIsDropping] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const pegsRef = useRef<Peg[]>([])
  const ballRef = useRef<Ball | null>(null)
  const dprRef = useRef<number>(1)

  // Generate pegs in pyramid pattern
  const generatePegs = useCallback(() => {
    const pegs: Peg[] = []
    const rows = 8
    const startY = 60
    const rowHeight = 40

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3
      const rowWidth = pegsInRow * 35
      const startX = (BOARD_WIDTH - rowWidth) / 2 + 17.5

      for (let i = 0; i < pegsInRow; i++) {
        pegs.push({
          x: startX + i * 35,
          y: startY + row * rowHeight,
          hit: false,
        })
      }
    }

    return pegs
  }, [])

  // Calculate target X position based on target slot
  const getTargetX = useCallback(() => {
    const slotWidth = BOARD_WIDTH / SLOTS.length
    return slotWidth * targetSlot + slotWidth / 2
  }, [targetSlot])

  // Setup high DPI canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr

    // Set actual canvas size in memory (scaled for retina)
    canvas.width = BOARD_WIDTH * dpr
    canvas.height = BOARD_HEIGHT * dpr

    // Set display size (CSS)
    canvas.style.width = `${BOARD_WIDTH}px`
    canvas.style.height = `${BOARD_HEIGHT}px`

    // Scale context to match
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [])

  // Initialize
  useEffect(() => {
    setupCanvas()
    pegsRef.current = generatePegs()
    drawBoard()
  }, [generatePegs, setupCanvas])

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = dprRef.current

    // Reset transform and reapply scale for high DPI
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT)
    bgGradient.addColorStop(0, '#0B0F1A')
    bgGradient.addColorStop(0.5, '#0D1220')
    bgGradient.addColorStop(1, '#0B0F1A')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(155, 92, 255, 0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i < BOARD_WIDTH; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, BOARD_HEIGHT)
      ctx.stroke()
    }
    for (let i = 0; i < BOARD_HEIGHT; i += 20) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(BOARD_WIDTH, i)
      ctx.stroke()
    }

    // Draw pegs with better visuals
    pegsRef.current.forEach((peg, index) => {
      // Outer glow
      ctx.beginPath()
      ctx.arc(peg.x, peg.y, PEG_RADIUS + 3, 0, Math.PI * 2)
      if (peg.hit) {
        ctx.fillStyle = 'rgba(255, 79, 216, 0.3)'
      } else {
        ctx.fillStyle = 'rgba(155, 92, 255, 0.2)'
      }
      ctx.fill()

      // Main peg with gradient
      const pegGradient = ctx.createRadialGradient(
        peg.x - 2, peg.y - 2, 0,
        peg.x, peg.y, PEG_RADIUS
      )
      if (peg.hit) {
        pegGradient.addColorStop(0, '#FF8BED')
        pegGradient.addColorStop(0.5, '#FF4FD8')
        pegGradient.addColorStop(1, '#D434B1')
      } else {
        // Alternate colors based on row
        const row = Math.floor(index / 10)
        if (row % 2 === 0) {
          pegGradient.addColorStop(0, '#B88BFF')
          pegGradient.addColorStop(0.5, '#9B5CFF')
          pegGradient.addColorStop(1, '#6E36FF')
        } else {
          pegGradient.addColorStop(0, '#6EDBFF')
          pegGradient.addColorStop(0.5, '#3CCBFF')
          pegGradient.addColorStop(1, '#1DA1D1')
        }
      }

      ctx.beginPath()
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = pegGradient
      ctx.shadowColor = peg.hit ? '#FF4FD8' : '#9B5CFF'
      ctx.shadowBlur = peg.hit ? 20 : 10
      ctx.fill()
      ctx.shadowBlur = 0

      // Highlight
      ctx.beginPath()
      ctx.arc(peg.x - 2, peg.y - 2, 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.fill()
    })

    // Draw slots at bottom with better design
    const slotWidth = BOARD_WIDTH / SLOTS.length
    const slotY = BOARD_HEIGHT - 50
    const slotHeight = 50

    // Slots background
    ctx.fillStyle = '#0A0E17'
    ctx.fillRect(0, slotY - 5, BOARD_WIDTH, slotHeight + 5)

    SLOTS.forEach((value, i) => {
      const x = i * slotWidth + 2
      const width = slotWidth - 4

      // Slot gradient based on value
      const slotGradient = ctx.createLinearGradient(x, slotY, x, slotY + slotHeight)
      if (value === 10) {
        slotGradient.addColorStop(0, '#FFD700')
        slotGradient.addColorStop(0.5, '#FFB800')
        slotGradient.addColorStop(1, '#FF8C00')
      } else if (value === 5) {
        slotGradient.addColorStop(0, '#2D1A3D')
        slotGradient.addColorStop(1, '#1A0F24')
      } else if (value === 0) {
        slotGradient.addColorStop(0, '#1E2942')
        slotGradient.addColorStop(1, '#141B2D')
      } else {
        slotGradient.addColorStop(0, '#141B2D')
        slotGradient.addColorStop(1, '#0B0F1A')
      }

      // Draw slot
      ctx.fillStyle = slotGradient
      ctx.beginPath()
      ctx.roundRect(x, slotY, width, slotHeight, [4, 4, 0, 0])
      ctx.fill()

      // Slot border glow
      ctx.strokeStyle = value === 10 ? '#FFB800' : value === 5 ? '#FF4FD8' : value === 0 ? '#3E4A5E' : '#3CCBFF'
      ctx.lineWidth = value === 10 ? 2 : 1
      ctx.shadowColor = value === 10 ? '#FFB800' : value === 5 ? '#FF4FD8' : '#3CCBFF'
      ctx.shadowBlur = value === 10 ? 10 : value === 5 ? 5 : 3
      ctx.stroke()
      ctx.shadowBlur = 0

      // Value text with glow
      ctx.fillStyle = value === 10 ? '#0B0F1A' : value === 0 ? '#4A5568' : '#FFFFFF'
      ctx.font = value === 10 ? 'bold 20px Inter' : value === 5 ? 'bold 16px Inter' : '14px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (value === 10) {
        ctx.shadowColor = '#FFB800'
        ctx.shadowBlur = 5
      }
      ctx.fillText(value.toString(), x + width / 2, slotY + slotHeight / 2)
      ctx.shadowBlur = 0

      // Dividers between slots
      if (i > 0) {
        ctx.beginPath()
        ctx.moveTo(i * slotWidth, slotY)
        ctx.lineTo(i * slotWidth, slotY + slotHeight)
        ctx.strokeStyle = '#9B5CFF'
        ctx.lineWidth = 2
        ctx.shadowColor = '#9B5CFF'
        ctx.shadowBlur = 5
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })

    // Draw ball if exists
    if (ballRef.current) {
      const ball = ballRef.current

      // Ball trail/glow
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS + 6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(60, 203, 255, 0.25)'
      ctx.fill()

      // Main ball with gradient
      const gradient = ctx.createRadialGradient(
        ball.x - 2, ball.y - 2, 0,
        ball.x, ball.y, BALL_RADIUS
      )
      gradient.addColorStop(0, '#FFFFFF')
      gradient.addColorStop(0.3, '#8BE5FF')
      gradient.addColorStop(0.6, '#3CCBFF')
      gradient.addColorStop(1, '#0066FF')

      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.shadowColor = '#3CCBFF'
      ctx.shadowBlur = 20
      ctx.fill()
      ctx.shadowBlur = 0

      // Ball highlight
      ctx.beginPath()
      ctx.arc(ball.x - 2, ball.y - 2, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fill()
    }
  }, [])

  const dropBall = () => {
    if (isDropping || disabled) return

    setIsDropping(true)
    setHasFinished(false)
    setResult(null)

    // Reset peg hits
    pegsRef.current.forEach(peg => peg.hit = false)

    // Calculate initial X with slight bias toward target
    const targetX = getTargetX()
    const randomOffset = (Math.random() - 0.5) * 40
    const startX = BOARD_WIDTH / 2 + (targetX - BOARD_WIDTH / 2) * 0.3 + randomOffset

    ballRef.current = {
      x: startX,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
    }

    animate()
  }

  const animate = useCallback(() => {
    const ball = ballRef.current
    if (!ball) return

    // Apply gravity
    ball.vy += GRAVITY
    ball.vx *= FRICTION

    // Cap velocity for smoother animation
    ball.vy = Math.min(ball.vy, MAX_VELOCITY)
    ball.vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, ball.vx))

    // Move ball
    ball.x += ball.vx
    ball.y += ball.vy

    // Wall collisions
    if (ball.x - BALL_RADIUS < 0) {
      ball.x = BALL_RADIUS
      ball.vx = -ball.vx * BOUNCE
    }
    if (ball.x + BALL_RADIUS > BOARD_WIDTH) {
      ball.x = BOARD_WIDTH - BALL_RADIUS
      ball.vx = -ball.vx * BOUNCE
    }

    // Peg collisions
    pegsRef.current.forEach((peg) => {
      const dx = ball.x - peg.x
      const dy = ball.y - peg.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = BALL_RADIUS + PEG_RADIUS

      if (dist < minDist) {
        peg.hit = true

        // Calculate collision response
        const nx = dx / dist
        const ny = dy / dist

        // Move ball outside peg
        ball.x = peg.x + nx * minDist
        ball.y = peg.y + ny * minDist

        // Reflect velocity
        const dot = ball.vx * nx + ball.vy * ny
        ball.vx = (ball.vx - 2 * dot * nx) * BOUNCE
        ball.vy = (ball.vy - 2 * dot * ny) * BOUNCE

        // Add slight randomness for variety
        ball.vx += (Math.random() - 0.5) * 1.5
      }
    })

    // Check if ball reached bottom
    const slotY = BOARD_HEIGHT - 40
    if (ball.y + BALL_RADIUS >= slotY) {
      // Determine which slot
      const slotWidth = BOARD_WIDTH / SLOTS.length
      let slotIndex = Math.floor(ball.x / slotWidth)
      slotIndex = Math.max(0, Math.min(SLOTS.length - 1, slotIndex))

      // Bias toward target slot if close
      const targetX = getTargetX()
      if (Math.abs(ball.x - targetX) < slotWidth * 1.5) {
        slotIndex = targetSlot
      }

      const credits = SLOTS[slotIndex]
      setResult(credits)
      setIsDropping(false)
      setHasFinished(true)
      ballRef.current = null

      setTimeout(() => {
        onComplete(credits)
      }, 500)

      drawBoard()
      return
    }

    drawBoard()
    animationRef.current = requestAnimationFrame(animate)
  }, [drawBoard, getTargetX, onComplete, targetSlot])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="relative flex flex-col items-center p-4">
      {/* Glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#9B5CFF] opacity-10 blur-[100px] rounded-full" />
      </div>

      {/* Game board */}
      <div className="relative">
        {/* Frame */}
        <div className="absolute -inset-2 rounded-xl border-2 border-[#9B5CFF]/30 bg-gradient-to-b from-[#9B5CFF]/10 to-transparent" />

        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          className="rounded-lg border border-[#1E2942]"
        />

        {/* Drop button */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          <button
            onClick={dropBall}
            disabled={isDropping || disabled}
            className={`
              px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider
              transition-all duration-300
              ${isDropping || disabled
                ? 'bg-[#1E2942] text-[#8B9BB4] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4FD8] text-white hover:shadow-[0_0_20px_rgba(155,92,255,0.5)] active:scale-95'
              }
            `}
          >
            {isDropping ? 'En cours...' : 'Lancer'}
          </button>
        </div>
      </div>

      {/* Result */}
      <div className="h-20 mt-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && result !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#141B2D] border border-white/10 shadow-lg"
            >
              <Trophy className={`w-6 h-6 ${result === 10 ? 'text-[#FFB800]' : result > 0 ? 'text-[#9B5CFF]' : 'text-[#8B9BB4]'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
                  {result > 0 ? 'Gagné' : 'Perdu'}
                </span>
                <span className={`text-xl font-black ${result === 10 ? 'text-[#FFB800]' : result > 0 ? 'text-white' : 'text-[#8B9BB4]'}`}>
                  {result} CRÉDITS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
