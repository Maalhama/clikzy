'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, Sparkles } from 'lucide-react'
import { useMiniGameSounds } from '@/hooks/mini-games/useMiniGameSounds'

interface WheelOfFortuneProps {
  onComplete: (creditsWon: number) => void
  targetSegment: number
  disabled?: boolean
}

// Couleurs DA : alternance dark/neon avec dégradés (moyenne: 2.25 crédits)
const SEGMENTS = [
  { value: 0, color: '#0B0F1A', text: '#4A5568', borderColor: '#1E2942' },
  { value: 0, color: '#141B2D', text: '#4A5568', borderColor: '#1E2942' },
  { value: 1, color: '#1A1033', text: '#9B5CFF', borderColor: '#9B5CFF' },
  { value: 1, color: '#0B0F1A', text: '#9B5CFF', borderColor: '#1E2942' },
  { value: 2, color: '#1A2A33', text: '#3CCBFF', borderColor: '#3CCBFF' },
  { value: 3, color: '#2D1A3D', text: '#FF4FD8', borderColor: '#FF4FD8' },
  { value: 3, color: '#1A1033', text: '#FF4FD8', borderColor: '#1E2942' },
  { value: 10, color: '#FFB800', text: '#0B0F1A', borderColor: '#FFD700', isSpecial: true },
]


export default function WheelOfFortune({
  onComplete,
  targetSegment,
  disabled = false,
}: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [hasFinished, setHasFinished] = useState(false)
  const [showWinCelebration, setShowWinCelebration] = useState(false)
  const [pointerTickCount, setPointerTickCount] = useState(0)
  const wheelRef = useRef<HTMLDivElement>(null)
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentSegmentRef = useRef<number>(0)
  const spinStartTimeRef = useRef<number>(0)

  const { playTick, playWhoosh, playImpact, playWin, vibrate } = useMiniGameSounds()

  // Effet de tick audio/visuel amélioré pendant la rotation
  useEffect(() => {
    if (isSpinning) {
      // Whoosh au début
      playWhoosh(0.5)
      spinStartTimeRef.current = Date.now()

      let lastSegment = currentSegmentRef.current
      let animationFrameId: number

      const checkTick = () => {
        const elapsed = Date.now() - spinStartTimeRef.current
        const progress = Math.min(elapsed / 5000, 1) // 5s total

        // Calculer le segment actuel basé sur la rotation
        const currentRotation = rotation % 360
        const segmentAngle = 360 / SEGMENTS.length
        const currentSeg = Math.floor((360 - currentRotation) / segmentAngle) % SEGMENTS.length

        if (currentSeg !== lastSegment) {
          // Son tick à chaque changement de segment
          // Pitch augmente progressivement pour créer de la tension
          const pitch = 0.6 + progress * 0.8 // De 0.6 à 1.4
          playTick(pitch)

          // Incrémenter le compteur pour forcer l'animation du pointer
          setPointerTickCount(prev => prev + 1)

          lastSegment = currentSeg
          currentSegmentRef.current = currentSeg
        }

        if (isSpinning) {
          animationFrameId = requestAnimationFrame(checkTick)
        }
      }

      animationFrameId = requestAnimationFrame(checkTick)

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }
  }, [isSpinning, playTick, playWhoosh, rotation])

  const spinWheel = () => {
    if (isSpinning || disabled) return

    setIsSpinning(true)
    setHasFinished(false)
    setShowWinCelebration(false)
    setPointerTickCount(0)

    const segmentAngle = 360 / SEGMENTS.length
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360
    const targetAngle = (SEGMENTS.length - targetSegment) * segmentAngle - segmentAngle / 2
    const finalRotation = rotation + extraRotations + targetAngle

    setRotation(finalRotation)

    // Impact de ralentissement à 4.5s
    setTimeout(() => {
      playImpact(0.3)
    }, 4500)

    setTimeout(() => {
      setIsSpinning(false)
      setHasFinished(true)

      const wonCredits = SEGMENTS[targetSegment].value

      if (wonCredits > 0) {
        setShowWinCelebration(true)
        playWin()

        // Vibration selon le gain
        if (SEGMENTS[targetSegment].isSpecial) {
          vibrate([100, 50, 100, 50, 100]) // Jackpot
        } else {
          vibrate([50, 30, 50]) // Victoire normale
        }
      } else {
        vibrate(30) // Petite vibration de fin
      }

      onComplete(wonCredits)
    }, 5000)
  }

  const isWin = hasFinished && SEGMENTS[targetSegment].value > 0
  const isJackpot = hasFinished && SEGMENTS[targetSegment].isSpecial

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={showWinCelebration ? { scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] } : { opacity: 0.1 }}
          transition={{ duration: 1, repeat: showWinCelebration ? 3 : 0 }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${isJackpot ? 'bg-[#FFB800]' : 'bg-[#9B5CFF]'} blur-[120px] rounded-full`}
        />
      </div>

      {/* Win Celebration Particles - Enhanced */}
      <AnimatePresence>
        {showWinCelebration && (
          <>
            {/* Explosion radiale principale - étoiles */}
            {[...Array(24)].map((_, i) => {
              const angle = (i / 24) * Math.PI * 2
              const distance = 160 + Math.random() * 60
              const colors = isJackpot
                ? ['#FFB800', '#FFD700', '#FF8C00']
                : ['#9B5CFF', '#FF4FD8', '#3CCBFF', '#00FF88']
              const color = colors[i % colors.length]

              return (
                <motion.div
                  key={`star-${i}`}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.2, 1, 0.4],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    rotate: 360,
                  }}
                  transition={{ duration: 1.8, delay: i * 0.03, ease: 'easeOut' }}
                  className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                >
                  <Sparkles size={18} className={`text-[${color}]`} style={{ color }} />
                </motion.div>
              )
            })}

            {/* Cercles secondaires */}
            {[...Array(16)].map((_, i) => {
              const angle = (i / 16) * Math.PI * 2 + 0.2
              const distance = 100 + Math.random() * 40
              const colors = isJackpot
                ? ['#FFB800', '#FFA500']
                : ['#9B5CFF', '#FF4FD8']
              const color = colors[i % colors.length]

              return (
                <motion.div
                  key={`circle-${i}`}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                  }}
                  transition={{ duration: 1.2, delay: i * 0.04 + 0.2 }}
                  className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                  style={{
                    width: 8 + Math.random() * 6,
                    height: 8 + Math.random() * 6,
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: `0 0 12px ${color}`,
                  }}
                />
              )
            })}

            {/* Confetti tombant */}
            {[...Array(20)].map((_, i) => {
              const xStart = (Math.random() - 0.5) * 400
              const colors = isJackpot
                ? ['#FFB800', '#FFD700', '#FF8C00']
                : ['#9B5CFF', '#FF4FD8', '#3CCBFF']
              const color = colors[i % colors.length]

              return (
                <motion.div
                  key={`confetti-${i}`}
                  initial={{ opacity: 0, x: xStart, y: -100, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: xStart + (Math.random() - 0.5) * 100,
                    y: 300,
                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  }}
                  transition={{ duration: 2 + Math.random(), delay: i * 0.05 + 0.5, ease: 'easeIn' }}
                  className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                  style={{
                    width: 6,
                    height: 12,
                    backgroundColor: color,
                  }}
                />
              )
            })}
          </>
        )}
      </AnimatePresence>


      {/* The Pointer */}
      <div className="relative z-20 mb-[-16px]">
        <motion.div
          key={pointerTickCount}
          initial={{ rotate: 0, y: 0 }}
          animate={{
            rotate: [0, 8, -3, 0],
            y: [0, 2, 0, 0],
          }}
          transition={{
            duration: 0.15,
            ease: "easeOut"
          }}
        >
          <motion.div
            key={`inner-${pointerTickCount}`}
            initial={{ filter: 'brightness(1)', scale: 1 }}
            animate={{
              filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.15 }}
            className="w-8 h-12 bg-gradient-to-b from-white to-slate-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]"
            style={{
              clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
            }}
          />
          <motion.div
            key={`dot-${pointerTickCount}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.15 }}
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full"
            style={{
              boxShadow: '0 0 8px white',
            }}
          />
        </motion.div>
      </div>

      {/* The Wheel Container */}
      <div className="relative">
        {/* Outer Ring with neon glow */}
        <div className="absolute inset-[-10px] rounded-full border-[4px] border-[#141B2D] shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(155,92,255,0.2)]" />
        <div className="absolute inset-[-12px] rounded-full border-[2px] border-[#9B5CFF]/30" />

        {/* Light Dots - Neon colors with chase effect */}
        <div className="absolute inset-[-10px] rounded-full">
          {[...Array(12)].map((_, i) => {
            const colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF', '#FFB800']
            const color = colors[i % colors.length]
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 30}deg) translateY(-110px) translateX(-50%)`,
                  backgroundColor: color,
                }}
                animate={isSpinning ? {
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                  boxShadow: [
                    `0 0 4px ${color}, 0 0 8px ${color}40`,
                    `0 0 12px ${color}, 0 0 24px ${color}80`,
                    `0 0 4px ${color}, 0 0 8px ${color}40`
                  ]
                } : {
                  opacity: 0.6,
                  scale: 1,
                  boxShadow: `0 0 8px ${color}, 0 0 16px ${color}40`
                }}
                transition={isSpinning ? {
                  duration: 0.15,
                  repeat: Infinity,
                  delay: i * 0.05, // Chase effect: chaque lumière avec délai
                  ease: 'easeInOut'
                } : {
                  duration: 0.3
                }}
              />
            )
          })}
        </div>

        {/* Main Wheel */}
        <motion.div
          ref={wheelRef}
          className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-full overflow-hidden border-[6px] border-[#141B2D] shadow-2xl bg-[#0B0F1A]"
          style={{ willChange: 'transform' }}
          animate={{ rotate: rotation }}
          transition={{
            duration: 5,
            ease: [0.32, 0, 0.15, 1],
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              {/* Glow filters for neon effect */}
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              {/* Radial gradient for depth */}
              <radialGradient id="wheelDepth" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
              </radialGradient>
            </defs>
            {SEGMENTS.map((seg, i) => {
              const angle = 360 / SEGMENTS.length
              const startAngle = i * angle
              const endAngle = (i + 1) * angle

              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180)
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180)
              const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180)
              const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180)

              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`

              return (
                <g key={i}>
                  <path
                    d={pathData}
                    fill={seg.color}
                    stroke={seg.borderColor}
                    strokeWidth="0.8"
                    filter={seg.isSpecial ? 'url(#goldGlow)' : undefined}
                  />
                </g>
              )
            })}
            {/* Overlay for depth effect */}
            <circle cx="50" cy="50" r="50" fill="url(#wheelDepth)" />
            {/* Inner ring accent */}
            <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(155,92,255,0.3)" strokeWidth="0.5" />
          </svg>

          {/* Segment Values */}
          {SEGMENTS.map((seg, i) => {
            const angle = (360 / SEGMENTS.length) * i + (360 / SEGMENTS.length / 2)
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 flex flex-col items-center pointer-events-none"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-65px)`,
                }}
              >
                <span
                  className={`text-lg sm:text-xl font-black ${seg.isSpecial ? 'drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]' : ''}`}
                  style={{
                    color: seg.text,
                    transform: `rotate(${-angle}deg)`
                  }}
                >
                  {seg.value}
                </span>
                {seg.isSpecial && (
                  <Zap
                    className="w-3 h-3 text-[#FFB800] fill-current"
                    style={{ transform: `rotate(${-angle}deg)` }}
                  />
                )}
              </div>
            )
          })}
        </motion.div>

        {/* Center Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <motion.button
            onClick={spinWheel}
            disabled={isSpinning || disabled}
            whileHover={!isSpinning && !disabled ? { scale: 1.05 } : {}}
            whileTap={!isSpinning && !disabled ? { scale: 0.9 } : {}}
            className={`
              relative w-16 h-16 rounded-full border-3 border-[#141B2D]
              flex items-center justify-center transition-all duration-300
              ${isSpinning || disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-[0_0_20px_#9B5CFF]'}
              bg-gradient-to-br from-[#9B5CFF] to-[#FF4FD8]
            `}
          >
            {isSpinning && (
              <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
            )}
            <span className="text-white font-black text-xs tracking-widest uppercase">
              {isSpinning ? '...' : 'SPIN'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Result */}
      <div className="h-16 mt-3 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                isJackpot
                  ? 'bg-[#FFB800]/20 border-[#FFB800]/50'
                  : isWin
                    ? 'bg-[#9B5CFF]/20 border-[#9B5CFF]/40'
                    : 'bg-[#141B2D] border-white/10'
              }`}
            >
              <Trophy className={`w-5 h-5 ${isJackpot ? 'text-[#FFB800]' : isWin ? 'text-[#9B5CFF]' : 'text-white/40'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[9px] uppercase font-bold tracking-widest">
                  {isJackpot ? 'JACKPOT' : isWin ? 'Gagné' : 'Perdu'}
                </span>
                <span className={`text-lg font-black ${isJackpot ? 'text-[#FFB800]' : isWin ? 'text-white' : 'text-white/50'}`}>
                  {isWin ? '+' : ''}{SEGMENTS[targetSegment].value}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
