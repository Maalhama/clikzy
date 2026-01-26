'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, Sparkles } from 'lucide-react'
import { SLOTS_SYMBOLS } from '@/types/miniGames'
import { useMiniGameSounds } from '@/hooks/mini-games/useMiniGameSounds'

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

// Single reel component with continuous vertical scroll animation
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
  const [scrollOffset, setScrollOffset] = useState(0)
  const scrollSpeedRef = useRef(0)
  const rafRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const targetOffsetRef = useRef(0)
  const isStoppingRef = useRef(false)

  const SYMBOL_HEIGHT = 80 // Height of each symbol in pixels
  const SPIN_SPEED = 15 // Pixels per frame during spin (15px * 60fps = 900px/s)

  // Continuous scroll animation with RAF
  useEffect(() => {
    if (isSpinning && !isStopped) {
      isStoppingRef.current = false
      scrollSpeedRef.current = SPIN_SPEED + reelIndex * 2 // Slightly different speeds

      const animate = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time
        const deltaTime = time - lastTimeRef.current
        lastTimeRef.current = time

        // Update scroll offset
        setScrollOffset(prev => prev + scrollSpeedRef.current * (deltaTime / 16.67)) // Normalize to 60fps

        if (isSpinning && !isStoppingRef.current) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isSpinning, isStopped, reelIndex])

  // Smooth stopping animation with ease-out
  useEffect(() => {
    if (isStopped && !isStoppingRef.current) {
      isStoppingRef.current = true

      // Calculate target offset to land exactly on finalSymbol
      const currentSymbolIndex = Math.floor(scrollOffset / SYMBOL_HEIGHT) % REEL_ITEMS.length
      const distanceToFinal = ((finalSymbol - currentSymbolIndex + REEL_ITEMS.length) % REEL_ITEMS.length)

      // Add extra spins for dramatic effect (2-3 full rotations)
      const extraSpins = 2 + Math.random()
      const targetDistance = (distanceToFinal + extraSpins * REEL_ITEMS.length) * SYMBOL_HEIGHT
      targetOffsetRef.current = scrollOffset + targetDistance

      const startOffset = scrollOffset
      const startTime = performance.now()
      const duration = 800 + reelIndex * 200 // Staggered stop duration

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      const animateStop = (time: number) => {
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeOutCubic(progress)

        const newOffset = startOffset + (targetOffsetRef.current - startOffset) * easedProgress
        setScrollOffset(newOffset)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animateStop)
        } else {
          // Spring bounce at the end
          const bounceStart = performance.now()
          const bounceDuration = 200

          const animateBounce = (time: number) => {
            const elapsed = time - bounceStart
            const progress = Math.min(elapsed / bounceDuration, 1)

            // Small bounce: overshoot then settle
            const bounce = Math.sin(progress * Math.PI * 2) * (1 - progress) * 5
            setScrollOffset(targetOffsetRef.current + bounce)

            if (progress < 1) {
              rafRef.current = requestAnimationFrame(animateBounce)
            }
          }

          rafRef.current = requestAnimationFrame(animateBounce)
        }
      }

      rafRef.current = requestAnimationFrame(animateStop)

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isStopped, finalSymbol, reelIndex])

  // Calculate which symbols to display based on scroll offset
  const getVisibleSymbols = () => {
    const baseIndex = Math.floor(scrollOffset / SYMBOL_HEIGHT)
    // Show 5 symbols for smooth scrolling (2 above, center, 2 below)
    return [-2, -1, 0, 1, 2].map(offset => {
      const index = (baseIndex + offset + REEL_ITEMS.length * 100) % REEL_ITEMS.length
      return { symbol: REEL_ITEMS[index], offset }
    })
  }

  const visibleSymbols = getVisibleSymbols()
  const scrollPosition = -(scrollOffset % (REEL_ITEMS.length * SYMBOL_HEIGHT))

  return (
    <div
      className="relative w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-[#0B0F1A] to-[#141B2D] rounded-lg overflow-hidden border-2 border-[#2A3A5A] shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
      style={{
        willChange: isSpinning && !isStopped ? 'transform, filter' : 'auto',
      }}
    >
      {/* Reel window highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none z-10" />

      {/* Side highlights */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-[#9B5CFF]/20 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-[#9B5CFF]/20 to-transparent pointer-events-none z-10" />

      {/* Symbols container - continuous scroll */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-start pt-2"
        style={{
          transform: `translateY(${scrollPosition}px)`,
          filter: isSpinning && !isStopped ? 'blur(2px)' : 'blur(0px)',
          transition: isStopped ? 'filter 0.3s ease-out' : 'none',
        }}
      >
        {visibleSymbols.map((item, index) => {
          const isCenterSymbol = item.offset === 0
          const distanceFromCenter = Math.abs(item.offset)

          return (
            <div
              key={`${index}-${item.symbol}`}
              className="flex items-center justify-center"
              style={{
                height: `${SYMBOL_HEIGHT}px`,
                minHeight: `${SYMBOL_HEIGHT}px`,
              }}
            >
              <span
                className={`
                  ${isCenterSymbol ? 'text-4xl sm:text-5xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-2xl sm:text-3xl'}
                  ${distanceFromCenter === 1 ? 'opacity-30 blur-[1px]' : ''}
                  ${distanceFromCenter === 2 ? 'opacity-10 blur-[2px]' : ''}
                  transition-opacity duration-200
                `}
              >
                {item.symbol}
              </span>
            </div>
          )
        })}
      </div>

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
  const [screenShake, setScreenShake] = useState(false)

  const { playTick, playWhoosh, playImpact, playWin, vibrate } = useMiniGameSounds()

  // Effet de tick rapide pendant le spin
  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        playTick(1.2 + Math.random() * 0.3)
      }, 80)
      return () => clearInterval(interval)
    }
  }, [isSpinning, playTick])

  const spin = useCallback(() => {
    if (isSpinning || disabled) return

    setLeverPulled(true)

    // Son whoosh au début
    playWhoosh(0.4)

    setTimeout(() => {
      setIsSpinning(true)
      setHasFinished(false)
      setStoppedReels([false, false, false])
      setShowParticles(false)

      const stopTimes = [1500, 2200, 2900]

      stopTimes.forEach((time, reelIndex) => {
        setTimeout(() => {
          // Son d'impact à l'arrêt de chaque reel
          playImpact(0.4 + reelIndex * 0.1)

          // Screen shake à chaque arrêt
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), 200)

          // Vibration à chaque arrêt
          vibrate(40)

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

              const allMatch = targetSymbols[0] === targetSymbols[1] && targetSymbols[1] === targetSymbols[2]
              const isJackpot = prizeAmount >= 10

              if (prizeAmount > 0) {
                setShowParticles(true)
                playWin()

                // Vibration selon le type de victoire
                if (allMatch || isJackpot) {
                  vibrate([100, 50, 100, 50, 100, 50, 100]) // Triple/Jackpot
                  setScreenShake(true)
                  setTimeout(() => setScreenShake(false), 400)
                } else {
                  vibrate([60, 40, 60]) // Victoire normale
                }
              } else {
                vibrate(30)
              }

              onComplete(prizeAmount)
            }, 500)
          }
        }, time)
      })
    }, 300)
  }, [isSpinning, disabled, prizeAmount, onComplete, targetSymbols, playWhoosh, playImpact, playWin, vibrate])

  const isJackpot = prizeAmount >= 10
  const isWin = prizeAmount > 0

  // Check if all symbols match
  const allMatch = targetSymbols[0] === targetSymbols[1] && targetSymbols[1] === targetSymbols[2]

  return (
    <motion.div
      animate={screenShake ? { x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0] } : {}}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col items-center justify-center p-2 select-none"
    >
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

      {/* Win Particles - Enhanced */}
      <AnimatePresence>
        {showParticles && (
          <>
            {/* Sparkles existants */}
            {[...Array(12)].map((_, i) => (
              <SparkleParticle
                key={`sparkle-${i}`}
                delay={i * 0.1}
                x={(i - 6) * 25}
                color={i % 2 === 0 ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}
              />
            ))}

            {/* Cascade de pièces pour jackpots */}
            {(isJackpot || allMatch) && (
              <>
                {[...Array(20)].map((_, i) => {
                  const xStart = (Math.random() - 0.5) * 300
                  const delay = i * 0.1

                  return (
                    <motion.div
                      key={`coin-${i}`}
                      initial={{ opacity: 0, x: xStart, y: -150, rotate: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        x: xStart + (Math.random() - 0.5) * 100,
                        y: 300,
                        rotate: [0, 180, 360, 540, 720],
                        scale: [0, 1, 1, 0.5],
                      }}
                      transition={{ duration: 2 + Math.random(), delay, ease: 'easeIn' }}
                      className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #FFD700, #FFB800, #FF8C00)',
                          boxShadow: '0 0 16px rgba(255, 184, 0, 0.9), inset 0 0 8px rgba(255, 255, 255, 0.5)',
                          border: '2px solid #FFD700',
                        }}
                      />
                    </motion.div>
                  )
                })}

                {/* Explosion d'étoiles supplémentaires */}
                {[...Array(16)].map((_, i) => {
                  const angle = (i / 16) * Math.PI * 2
                  const distance = 100 + Math.random() * 60

                  return (
                    <motion.div
                      key={`extra-star-${i}`}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0.5],
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                      }}
                      transition={{ duration: 1.5, delay: i * 0.05 + 0.3 }}
                      className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                    >
                      <Sparkles size={20} className="text-[#FFB800]" />
                    </motion.div>
                  )
                })}
              </>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Machine Frame */}
      <div className="relative flex items-stretch gap-2">
        {/* Lever - hidden on mobile */}
        <div className="relative flex-col items-center justify-center hidden sm:flex">
          <div className="relative w-6 h-32">
            {/* Lever track */}
            <div className="absolute inset-x-0 top-3 bottom-3 bg-[#1E2942] rounded-full border-2 border-[#2A3A5A]" />
            {/* Lever arm */}
            <motion.div
              animate={{ y: leverPulled ? 50 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-16 bg-gradient-to-b from-[#9B5CFF] to-[#6B3CAF] rounded-full border-2 border-[#B47CFF] shadow-[0_0_12px_rgba(155,92,255,0.5)]"
            >
              {/* Lever ball */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4FD8] to-[#B82A9C] border-2 border-[#FF7FE8] shadow-[0_0_15px_rgba(255,79,216,0.6)]" />
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Title */}
          <div className="text-center mb-2">
            <motion.div
              animate={isSpinning ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
              className="relative inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] rounded-lg shadow-[0_0_20px_rgba(255,184,0,0.5)]"
            >
              <Zap className="w-4 h-4 text-[#0B0F1A]" fill="currentColor" />
              <span className="text-[#0B0F1A] font-black text-sm tracking-wider">JACKPOT</span>
              <Zap className="w-4 h-4 text-[#0B0F1A]" fill="currentColor" />
            </motion.div>
          </div>

          {/* Reels Container */}
          <div className="relative bg-gradient-to-b from-[#0B0F1A] to-[#141B2D] rounded-xl p-3 sm:p-4 border-2 border-[#1E2942] shadow-[0_0_30px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(155,92,255,0.15)]">
            {/* Outer glow border */}
            <div className="absolute inset-[-2px] rounded-xl border-2 border-[#FFB800]/40 pointer-events-none" />

            {/* Reels */}
            <div className="flex gap-2 sm:gap-3">
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
              className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent pointer-events-none"
            />

            {/* Bottom lights */}
            <div className="flex justify-center gap-2 mt-3">
              {[0, 1, 2, 3, 4].map((i) => {
                const colors = ['#9B5CFF', '#FF4FD8', '#FFB800', '#FF4FD8', '#9B5CFF']
                const color = colors[i]
                return (
                  <motion.div
                    key={i}
                    animate={isSpinning ? {
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.2, 1],
                    } : {
                      opacity: 0.5
                    }}
                    transition={{ duration: 0.2, repeat: isSpinning ? Infinity : 0, delay: i * 0.05 }}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}`,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Spin Button */}
          <div className="mt-3 flex justify-center">
            <motion.button
              onClick={spin}
              disabled={isSpinning || disabled}
              whileHover={!isSpinning && !disabled ? { scale: 1.05 } : {}}
              whileTap={!isSpinning && !disabled ? { scale: 0.95 } : {}}
              className={`
                relative px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider
                transition-all duration-300 overflow-hidden min-h-[44px]
                ${isSpinning || disabled
                  ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4FD8] text-white shadow-[0_0_20px_rgba(155,92,255,0.5)]'
                }
              `}
            >
              {isSpinning ? 'SPIN...' : 'SPIN!'}
            </motion.button>
          </div>
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
                isJackpot || allMatch
                  ? 'bg-[#FFB800]/20 border-[#FFB800]/50'
                  : isWin
                    ? 'bg-[#9B5CFF]/20 border-[#9B5CFF]/30'
                    : 'bg-[#141B2D] border-white/10'
              }`}
            >
              <Trophy className={`w-5 h-5 ${(isJackpot || allMatch) ? 'text-[#FFB800]' : isWin ? 'text-[#9B5CFF]' : 'text-white/40'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[9px] uppercase font-bold tracking-widest">
                  {allMatch ? 'TRIPLE' : isJackpot ? 'JACKPOT' : isWin ? 'Gagné' : 'Perdu'}
                </span>
                <span className={`text-lg font-black ${(isJackpot || allMatch) ? 'text-[#FFB800]' : isWin ? 'text-white' : 'text-white/60'}`}>
                  {isWin ? '+' : ''}{prizeAmount}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
