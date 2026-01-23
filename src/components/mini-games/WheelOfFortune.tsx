'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap } from 'lucide-react'

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
  const wheelRef = useRef<HTMLDivElement>(null)

  const spinWheel = () => {
    if (isSpinning || disabled) return

    setIsSpinning(true)
    setHasFinished(false)

    const segmentAngle = 360 / SEGMENTS.length
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360
    const targetAngle = (SEGMENTS.length - targetSegment) * segmentAngle - segmentAngle / 2
    const finalRotation = rotation + extraRotations + targetAngle

    setRotation(finalRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setHasFinished(true)
      onComplete(SEGMENTS[targetSegment].value)
    }, 5000)
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4 sm:p-8 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#9B5CFF] opacity-10 blur-[120px] rounded-full" />
      </div>

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
                  transform: `rotate(${i * 22.5}deg) translateY(-152px) translateX(-50%)`,
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
          className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden border-[8px] border-[#141B2D] shadow-2xl bg-[#0B0F1A]"
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
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-90px)`,
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
      <div className="h-20 mt-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#141B2D] border border-white/10 shadow-lg"
            >
              <Trophy className={`w-6 h-6 ${SEGMENTS[targetSegment].isSpecial ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Gagné</span>
                <span className={`text-xl font-black ${SEGMENTS[targetSegment].isSpecial ? 'text-[#FFB800]' : 'text-white'}`}>
                  {SEGMENTS[targetSegment].value} CRÉDITS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
