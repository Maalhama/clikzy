'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap } from 'lucide-react'
import { SLOTS_SYMBOLS } from '@/types/miniGames'

interface SlotMachineProps {
  onComplete: (creditsWon: number) => void
  targetSymbols: number[] // Index des symboles finaux pour chaque reel
  prizeAmount: number
  disabled?: boolean
}

const REEL_ITEMS = SLOTS_SYMBOLS

export default function SlotMachine({
  onComplete,
  targetSymbols,
  prizeAmount,
  disabled = false,
}: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const [reelPositions, setReelPositions] = useState([0, 0, 0])
  const [stoppedReels, setStoppedReels] = useState([false, false, false])

  const spin = () => {
    if (isSpinning || disabled) return

    setIsSpinning(true)
    setHasFinished(false)
    setStoppedReels([false, false, false])

    // Each reel stops at a different time
    const stopTimes = [1500, 2000, 2500]

    stopTimes.forEach((time, reelIndex) => {
      setTimeout(() => {
        setReelPositions(prev => {
          const newPositions = [...prev]
          newPositions[reelIndex] = targetSymbols[reelIndex]
          return newPositions
        })
        setStoppedReels(prev => {
          const newStopped = [...prev]
          newStopped[reelIndex] = true
          return newStopped
        })

        // If this is the last reel
        if (reelIndex === 2) {
          setTimeout(() => {
            setIsSpinning(false)
            setHasFinished(true)
            onComplete(prizeAmount)
          }, 500)
        }
      }, time)
    })
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FFB800] opacity-10 blur-[100px] rounded-full" />
      </div>

      {/* Machine Frame */}
      <div className="relative">
        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#FFB800] to-[#FF8C00] rounded-lg shadow-[0_0_20px_rgba(255,184,0,0.4)]">
            <Zap className="w-5 h-5 text-[#0B0F1A]" fill="currentColor" />
            <span className="text-[#0B0F1A] font-black text-lg tracking-wider">JACKPOT</span>
            <Zap className="w-5 h-5 text-[#0B0F1A]" fill="currentColor" />
          </div>
        </div>

        {/* Reels Container */}
        <div className="relative bg-[#0B0F1A] rounded-2xl p-6 border-4 border-[#1E2942] shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(155,92,255,0.1)]">
          {/* Neon border accent */}
          <div className="absolute inset-[-2px] rounded-2xl border-2 border-[#FFB800]/30 pointer-events-none" />

          {/* Reels */}
          <div className="flex gap-3">
            {[0, 1, 2].map((reelIndex) => (
              <div
                key={reelIndex}
                className="relative w-20 h-24 bg-[#141B2D] rounded-xl overflow-hidden border-2 border-[#1E2942]"
              >
                {/* Reel window highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none z-10" />

                {/* Spinning reel */}
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  animate={
                    isSpinning && !stoppedReels[reelIndex]
                      ? { y: [0, -200, 0] }
                      : {}
                  }
                  transition={
                    isSpinning && !stoppedReels[reelIndex]
                      ? { duration: 0.15, repeat: Infinity, ease: 'linear' }
                      : {}
                  }
                >
                  <span className="text-5xl">
                    {REEL_ITEMS[reelPositions[reelIndex]]}
                  </span>
                </motion.div>

                {/* Stop flash effect */}
                <AnimatePresence>
                  {stoppedReels[reelIndex] && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-white/30 z-20"
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Win line indicator */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent opacity-50 pointer-events-none" />

          {/* Bottom lights */}
          <div className="flex justify-center gap-4 mt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={isSpinning ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.5 }}
                transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#9B5CFF', '#FF4FD8', '#3CCBFF', '#FFB800', '#00FF88'][i],
                  boxShadow: `0 0 10px ${['#9B5CFF', '#FF4FD8', '#3CCBFF', '#FFB800', '#00FF88'][i]}`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Spin Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={spin}
            disabled={isSpinning || disabled}
            className={`
              relative px-12 py-4 rounded-xl font-black text-lg uppercase tracking-wider
              transition-all duration-300
              ${isSpinning || disabled
                ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4FD8] text-white hover:shadow-[0_0_30px_rgba(155,92,255,0.5)] hover:scale-105 active:scale-95'
              }
            `}
          >
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                >
                  ⚡
                </motion.span>
                SPINNING...
              </span>
            ) : (
              'SPIN!'
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      <div className="h-16 mt-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#141B2D] border border-white/10 shadow-lg"
            >
              <Trophy className={`w-6 h-6 ${prizeAmount >= 10 ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Gagné</span>
                <span className={`text-xl font-black ${prizeAmount >= 10 ? 'text-[#FFB800]' : 'text-white'}`}>
                  {prizeAmount} CRÉDITS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
