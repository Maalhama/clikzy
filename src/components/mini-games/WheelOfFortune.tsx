'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, Sparkles, Info } from 'lucide-react'

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

// Calculate unique values for payout display
const UNIQUE_PAYOUTS = [
  { value: 0, chance: '25%', color: 'text-white/40' },
  { value: 1, chance: '25%', color: 'text-[#9B5CFF]' },
  { value: 2, chance: '12.5%', color: 'text-[#3CCBFF]' },
  { value: 3, chance: '25%', color: 'text-[#FF4FD8]' },
  { value: 10, chance: '12.5%', color: 'text-[#FFB800]', special: true },
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
  const wheelRef = useRef<HTMLDivElement>(null)

  const spinWheel = () => {
    if (isSpinning || disabled) return

    setIsSpinning(true)
    setHasFinished(false)
    setShowWinCelebration(false)

    const segmentAngle = 360 / SEGMENTS.length
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360
    const targetAngle = (SEGMENTS.length - targetSegment) * segmentAngle - segmentAngle / 2
    const finalRotation = rotation + extraRotations + targetAngle

    setRotation(finalRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setHasFinished(true)
      if (SEGMENTS[targetSegment].value > 0) {
        setShowWinCelebration(true)
      }
      onComplete(SEGMENTS[targetSegment].value)
    }, 5000)
  }

  const isWin = hasFinished && SEGMENTS[targetSegment].value > 0
  const isJackpot = hasFinished && SEGMENTS[targetSegment].isSpecial

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={showWinCelebration ? { scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] } : { opacity: 0.1 }}
          transition={{ duration: 1, repeat: showWinCelebration ? 3 : 0 }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${isJackpot ? 'bg-[#FFB800]' : 'bg-[#9B5CFF]'} blur-[120px] rounded-full`}
        />
      </div>

      {/* Win Celebration Particles */}
      <AnimatePresence>
        {showWinCelebration && (
          <>
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5],
                  x: Math.cos((i / 16) * Math.PI * 2) * 180,
                  y: Math.sin((i / 16) * Math.PI * 2) * 180,
                }}
                transition={{ duration: 1.5, delay: i * 0.05 }}
                className="absolute top-1/2 left-1/2 pointer-events-none z-50"
              >
                <Sparkles size={16} className={isJackpot ? 'text-[#FFB800]' : i % 2 === 0 ? 'text-[#9B5CFF]' : 'text-[#00FF88]'} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Payout Table - Mobile optimized */}
      {!isSpinning && !hasFinished && (
        <div className="mb-3 w-full max-w-[280px] sm:max-w-xs">
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {UNIQUE_PAYOUTS.map((payout, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs sm:text-sm ${
                  payout.special
                    ? 'bg-[#FFB800]/20 border border-[#FFB800]/50'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <span className={`font-black ${payout.color}`}>{payout.value}</span>
                <span className="text-white/40 text-[10px]">{payout.chance}</span>
                {payout.special && <Zap size={10} className="text-[#FFB800]" />}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1 text-white/30 text-[10px] mt-2">
            <Info size={10} />
            <span>Appuyez sur SPIN pour lancer</span>
          </div>
        </div>
      )}

      {/* The Pointer */}
      <div className="relative z-20 mb-[-20px]">
        <motion.div
          animate={isSpinning ? {
            rotate: [0, -15, 10, -10, 5, 0],
            transition: { repeat: Infinity, duration: 0.2 }
          } : { rotate: 0 }}
        >
          <div
            className="w-10 h-14 bg-gradient-to-b from-white to-slate-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
          />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white]" />
        </motion.div>
      </div>

      {/* The Wheel Container */}
      <div className="relative">
        {/* Outer Ring with neon glow */}
        <div className="absolute inset-[-12px] rounded-full border-[6px] border-[#141B2D] shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(155,92,255,0.2)]" />
        <div className="absolute inset-[-14px] rounded-full border-[2px] border-[#9B5CFF]/30" />

        {/* Light Dots - Neon colors */}
        <div className="absolute inset-[-12px] rounded-full">
          {[...Array(16)].map((_, i) => {
            const colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF', '#FFB800']
            const color = colors[i % colors.length]
            return (
              <div
                key={i}
                className={`absolute w-2.5 h-2.5 rounded-full transition-all duration-300 ${isSpinning ? 'animate-pulse scale-125' : 'opacity-60'}`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 22.5}deg) translateY(-138px) translateX(-50%)`,
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}, 0 0 20px ${color}40`
                }}
              />
            )
          })}
        </div>

        {/* Main Wheel */}
        <motion.div
          ref={wheelRef}
          className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-[8px] border-[#141B2D] shadow-2xl bg-[#0B0F1A]"
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
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-80px)`,
                }}
              >
                <span
                  className={`text-xl sm:text-2xl font-black ${seg.isSpecial ? 'drop-shadow-[0_0_10px_rgba(255,184,0,0.8)]' : ''}`}
                  style={{
                    color: seg.text,
                    transform: `rotate(${-angle}deg)`
                  }}
                >
                  {seg.value}
                </span>
                {seg.isSpecial && (
                  <Zap
                    className="w-4 h-4 text-[#FFB800] fill-current"
                    style={{ transform: `rotate(${-angle}deg)` }}
                  />
                )}
              </div>
            )
          })}
        </motion.div>

        {/* Center Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <button
            onClick={spinWheel}
            disabled={isSpinning || disabled}
            className={`
              relative w-20 h-20 rounded-full border-4 border-[#141B2D]
              flex items-center justify-center transition-all duration-300 active:scale-90
              ${isSpinning || disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-[0_0_25px_#9B5CFF]'}
              bg-gradient-to-br from-[#9B5CFF] to-[#FF4FD8]
            `}
          >
            {isSpinning && (
              <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
            )}
            <span className="text-white font-black text-sm tracking-widest uppercase">
              {isSpinning ? '...' : 'SPIN'}
            </span>
          </button>
        </div>
      </div>

      {/* Result */}
      <div className="h-20 mt-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl border shadow-lg ${
                isJackpot
                  ? 'bg-gradient-to-r from-[#FFB800]/30 to-[#FF8C00]/20 border-[#FFB800]/60 shadow-[0_0_40px_rgba(255,184,0,0.4)]'
                  : isWin
                    ? 'bg-gradient-to-r from-[#9B5CFF]/20 to-[#00FF88]/20 border-[#9B5CFF]/40 shadow-[0_0_30px_rgba(155,92,255,0.3)]'
                    : 'bg-[#141B2D] border-white/10'
              }`}
            >
              <motion.div
                animate={isJackpot ? { rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] } : isWin ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isJackpot || isWin ? 2 : 0 }}
              >
                <Trophy className={`w-7 h-7 sm:w-8 sm:h-8 ${isJackpot ? 'text-[#FFB800]' : isWin ? 'text-[#9B5CFF]' : 'text-white/40'}`} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
                  {isJackpot ? '🎉 JACKPOT !' : isWin ? 'Gagné !' : 'Perdu'}
                </span>
                <motion.span
                  animate={isJackpot ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3, repeat: isJackpot ? 3 : 0 }}
                  className={`text-xl sm:text-2xl font-black ${isJackpot ? 'text-[#FFB800]' : isWin ? 'text-white' : 'text-white/50'}`}
                >
                  {isWin ? '+' : ''}{SEGMENTS[targetSegment].value} CRÉDITS
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
