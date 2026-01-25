'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, Sparkles } from 'lucide-react'
import { SLOTS_SYMBOLS } from '@/types/miniGames'

interface SlotMachineProps {
  onComplete: (creditsWon: number) => void
  targetSymbols: number[]
  prizeAmount: number
  disabled?: boolean
}

const REEL_ITEMS = SLOTS_SYMBOLS

// Particle component for sparkle effects
function SparkleParticle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-20, -60, -100, -140],
        x: [x, x + (Math.random() - 0.5) * 40],
        scale: [0, 1, 0.8, 0],
        rotate: [0, 180, 360],
      }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
      className="absolute top-1/2 left-1/2 pointer-events-none"
    >
      <Sparkles size={12} className={color} />
    </motion.div>
  )
}

// Single reel component with proper spinning animation
function SpinningReel({
  isSpinning,
  isStopped,
  finalSymbol,
  reelIndex
}: {
  isSpinning: boolean
  isStopped: boolean
  finalSymbol: number
  reelIndex: number
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displaySymbols, setDisplaySymbols] = useState<number[]>([0, 1, 2])

  // Spin animation - cycle through symbols
  useEffect(() => {
    if (isSpinning && !isStopped) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % REEL_ITEMS.length)
      }, 80 - reelIndex * 10) // Slightly different speeds for each reel
      return () => clearInterval(interval)
    }
  }, [isSpinning, isStopped, reelIndex])

  // Update display symbols based on current index
  useEffect(() => {
    if (isSpinning && !isStopped) {
      const prev = (currentIndex - 1 + REEL_ITEMS.length) % REEL_ITEMS.length
      const next = (currentIndex + 1) % REEL_ITEMS.length
      setDisplaySymbols([prev, currentIndex, next])
    }
  }, [currentIndex, isSpinning, isStopped])

  // When stopped, show final symbol
  useEffect(() => {
    if (isStopped) {
      const prev = (finalSymbol - 1 + REEL_ITEMS.length) % REEL_ITEMS.length
      const next = (finalSymbol + 1) % REEL_ITEMS.length
      setDisplaySymbols([prev, finalSymbol, next])
    }
  }, [isStopped, finalSymbol])

  return (
    <div className="relative w-24 h-28 bg-gradient-to-b from-[#0B0F1A] to-[#141B2D] rounded-xl overflow-hidden border-2 border-[#2A3A5A] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      {/* Reel window highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none z-10" />

      {/* Side highlights */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-[#9B5CFF]/20 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-[#9B5CFF]/20 to-transparent pointer-events-none z-10" />

      {/* Symbols container */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={isSpinning && !isStopped ? { y: [0, -28, 0] } : {}}
        transition={isSpinning && !isStopped ? { duration: 0.08, repeat: Infinity, ease: 'linear' } : {}}
      >
        {/* Top symbol (blurred) */}
        <span className="text-4xl opacity-30 blur-[1px] -mb-1">
          {REEL_ITEMS[displaySymbols[0]]}
        </span>
        {/* Center symbol (main) */}
        <span className="text-6xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {REEL_ITEMS[displaySymbols[1]]}
        </span>
        {/* Bottom symbol (blurred) */}
        <span className="text-4xl opacity-30 blur-[1px] -mt-1">
          {REEL_ITEMS[displaySymbols[2]]}
        </span>
      </motion.div>

      {/* Stop flash effect - enhanced */}
      <AnimatePresence>
        {isStopped && (
          <>
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-white/40 z-20"
            />
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <div className="w-full h-full border-4 border-[#FFB800] rounded-xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SlotMachine({
  onComplete,
  targetSymbols,
  prizeAmount,
  disabled = false,
}: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const [stoppedReels, setStoppedReels] = useState([false, false, false])
  const [leverPulled, setLeverPulled] = useState(false)
  const [showParticles, setShowParticles] = useState(false)

  const spin = useCallback(() => {
    if (isSpinning || disabled) return

    setLeverPulled(true)
    setTimeout(() => {
      setIsSpinning(true)
      setHasFinished(false)
      setStoppedReels([false, false, false])
      setShowParticles(false)

      const stopTimes = [1500, 2200, 2900]

      stopTimes.forEach((time, reelIndex) => {
        setTimeout(() => {
          setStoppedReels(prev => {
            const newStopped = [...prev]
            newStopped[reelIndex] = true
            return newStopped
          })

          if (reelIndex === 2) {
            setTimeout(() => {
              setIsSpinning(false)
              setHasFinished(true)
              setLeverPulled(false)
              if (prizeAmount > 0) {
                setShowParticles(true)
              }
              onComplete(prizeAmount)
            }, 500)
          }
        }, time)
      })
    }, 300)
  }, [isSpinning, disabled, prizeAmount, onComplete])

  const isJackpot = prizeAmount >= 10
  const isWin = prizeAmount > 0

  // Check if all symbols match
  const allMatch = targetSymbols[0] === targetSymbols[1] && targetSymbols[1] === targetSymbols[2]

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={isSpinning ? { scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] } : { opacity: 0.1 }}
          transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FFB800] blur-[120px] rounded-full"
        />
        {(isJackpot || allMatch) && hasFinished && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2, 2.5], opacity: [0.5, 0.3, 0] }}
            transition={{ duration: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[#FFB800] blur-[60px] rounded-full"
          />
        )}
      </div>

      {/* Win Particles */}
      <AnimatePresence>
        {showParticles && (
          <>
            {[...Array(12)].map((_, i) => (
              <SparkleParticle
                key={i}
                delay={i * 0.1}
                x={(i - 6) * 25}
                color={i % 2 === 0 ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Machine Frame */}
      <div className="relative flex items-stretch gap-4">
        {/* Lever */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative w-8 h-40">
            {/* Lever track */}
            <div className="absolute inset-x-0 top-4 bottom-4 bg-[#1E2942] rounded-full border-2 border-[#2A3A5A]" />
            {/* Lever arm */}
            <motion.div
              animate={{ y: leverPulled ? 60 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-20 bg-gradient-to-b from-[#9B5CFF] to-[#6B3CAF] rounded-full border-2 border-[#B47CFF] shadow-[0_0_15px_rgba(155,92,255,0.5)]"
            >
              {/* Lever ball */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4FD8] to-[#B82A9C] border-2 border-[#FF7FE8] shadow-[0_0_20px_rgba(255,79,216,0.6)]" />
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Title */}
          <div className="text-center mb-4">
            <motion.div
              animate={isSpinning ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
              className="relative inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] rounded-xl shadow-[0_0_30px_rgba(255,184,0,0.5)]"
            >
              {/* Animated sparkles on title */}
              {isSpinning && (
                <>
                  <motion.div
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute -top-2 -left-2"
                  >
                    <Sparkles size={16} className="text-white" />
                  </motion.div>
                  <motion.div
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles size={16} className="text-white" />
                  </motion.div>
                </>
              )}
              <Zap className="w-6 h-6 text-[#0B0F1A]" fill="currentColor" />
              <span className="text-[#0B0F1A] font-black text-xl tracking-wider">JACKPOT</span>
              <Zap className="w-6 h-6 text-[#0B0F1A]" fill="currentColor" />
            </motion.div>
          </div>

          {/* Reels Container */}
          <div className="relative bg-gradient-to-b from-[#0B0F1A] to-[#141B2D] rounded-2xl p-6 border-4 border-[#1E2942] shadow-[0_0_40px_rgba(0,0,0,0.6),inset_0_0_30px_rgba(155,92,255,0.15)]">
            {/* Outer glow border */}
            <div className="absolute inset-[-3px] rounded-2xl border-2 border-[#FFB800]/40 pointer-events-none" />
            <div className="absolute inset-[-6px] rounded-2xl border border-[#9B5CFF]/20 pointer-events-none" />

            {/* Reels */}
            <div className="flex gap-4">
              {[0, 1, 2].map((reelIndex) => (
                <SpinningReel
                  key={reelIndex}
                  isSpinning={isSpinning}
                  isStopped={stoppedReels[reelIndex]}
                  finalSymbol={targetSymbols[reelIndex]}
                  reelIndex={reelIndex}
                />
              ))}
            </div>

            {/* Win line indicator - animated */}
            <motion.div
              animate={isSpinning ? { opacity: [0.3, 0.8, 0.3] } : { opacity: 0.5 }}
              transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
              className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent pointer-events-none"
            />

            {/* Bottom lights - enhanced */}
            <div className="flex justify-center gap-3 mt-5">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const colors = ['#9B5CFF', '#FF4FD8', '#3CCBFF', '#FFB800', '#00FF88', '#FF4FD8', '#9B5CFF']
                const color = colors[i]
                return (
                  <motion.div
                    key={i}
                    animate={isSpinning ? {
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.2, 1],
                      boxShadow: [`0 0 5px ${color}`, `0 0 20px ${color}`, `0 0 5px ${color}`]
                    } : {
                      opacity: 0.5
                    }}
                    transition={{ duration: 0.2, repeat: isSpinning ? Infinity : 0, delay: i * 0.05 }}
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}`,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Spin Button */}
          <div className="mt-6 flex justify-center">
            <motion.button
              onClick={spin}
              disabled={isSpinning || disabled}
              whileHover={!isSpinning && !disabled ? { scale: 1.05 } : {}}
              whileTap={!isSpinning && !disabled ? { scale: 0.95 } : {}}
              className={`
                relative px-14 py-4 rounded-xl font-black text-lg uppercase tracking-wider
                transition-all duration-300 overflow-hidden
                ${isSpinning || disabled
                  ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4FD8] text-white shadow-[0_0_30px_rgba(155,92,255,0.5)]'
                }
              `}
            >
              {/* Button shine effect */}
              {!isSpinning && !disabled && (
                <motion.div
                  animate={{ x: [-200, 200] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
              )}
              {isSpinning ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚡
                  </motion.span>
                  SPINNING...
                </span>
              ) : (
                'SPIN!'
              )}
            </motion.button>
          </div>
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
              className={`flex items-center gap-4 px-8 py-4 rounded-2xl border shadow-lg ${
                isJackpot || allMatch
                  ? 'bg-gradient-to-r from-[#FFB800]/20 to-[#FF8C00]/20 border-[#FFB800]/50 shadow-[0_0_30px_rgba(255,184,0,0.3)]'
                  : isWin
                    ? 'bg-[#141B2D] border-[#9B5CFF]/30'
                    : 'bg-[#141B2D] border-white/10'
              }`}
            >
              <motion.div
                animate={(isJackpot || allMatch) ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: (isJackpot || allMatch) ? Infinity : 0 }}
              >
                <Trophy className={`w-8 h-8 ${(isJackpot || allMatch) ? 'text-[#FFB800]' : isWin ? 'text-[#9B5CFF]' : 'text-white/40'}`} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
                  {allMatch ? '🎰 TRIPLE!' : isJackpot ? '🎉 JACKPOT!' : 'Gagné'}
                </span>
                <span className={`text-2xl font-black ${(isJackpot || allMatch) ? 'text-[#FFB800]' : isWin ? 'text-white' : 'text-white/60'}`}>
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
