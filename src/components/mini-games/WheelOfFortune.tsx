'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap } from 'lucide-react'

interface WheelOfFortuneProps {
  onComplete: (creditsWon: number) => void
  targetSegment: number
  disabled?: boolean
}

const SEGMENTS = [
  { value: 0, color: '#1E2942', text: '#94A3B8' },
  { value: 1, color: '#9B5CFF', text: '#FFFFFF' },
  { value: 2, color: '#3CCBFF', text: '#FFFFFF' },
  { value: 3, color: '#FF4FD8', text: '#FFFFFF' },
  { value: 5, color: '#00D9FF', text: '#FFFFFF' },
  { value: 2, color: '#00FF88', text: '#FFFFFF' },
  { value: 1, color: '#FF6B35', text: '#FFFFFF' },
  { value: 10, color: '#FFB800', text: '#0B0F1A', isSpecial: true },
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
        {/* Outer Ring */}
        <div className="absolute inset-[-12px] rounded-full border-[6px] border-[#141B2D] shadow-[0_0_30px_rgba(0,0,0,0.5)]" />

        {/* Light Dots */}
        <div className="absolute inset-[-12px] rounded-full">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white] transition-opacity duration-300 ${isSpinning ? 'animate-pulse' : 'opacity-40'}`}
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 30}deg) translateY(-148px) translateX(-50%)`
              }}
            />
          ))}
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
                    className="transition-all duration-500"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="0.5"
                  />
                </g>
              )
            })}
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
