'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles, Zap } from 'lucide-react'
import { useMiniGameSounds } from '@/hooks/mini-games/useMiniGameSounds'

interface CoinFlipProps {
  onComplete: (creditsWon: number) => void
  result: 'heads' | 'tails'
  prizeAmount: number
  disabled?: boolean
}

export default function CoinFlip({
  onComplete,
  result,
  prizeAmount,
  disabled = false,
}: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showWinCelebration, setShowWinCelebration] = useState(false)

  const { playTick, playWhoosh, playImpact, playWin, vibrate } = useMiniGameSounds()

  // Tick à chaque rotation visible pendant le flip
  useEffect(() => {
    if (isFlipping) {
      const tickInterval = setInterval(() => {
        playTick(1.5 + Math.random() * 0.3)
      }, 111) // ~9 ticks pendant 2s (180° rotation = 111ms)

      return () => clearInterval(tickInterval)
    }
  }, [isFlipping, playTick])

  const flipCoin = () => {
    if (isFlipping || disabled) return

    setIsFlipping(true)
    setHasFinished(false)
    setShowResult(false)
    setShowWinCelebration(false)

    // Whoosh au début du flip
    playWhoosh(0.6)
    vibrate(50)

    // Flip animation duration
    setTimeout(() => {
      setShowResult(true)

      // Impact au sol
      playImpact(0.5)
      vibrate(60)

      setTimeout(() => {
        setIsFlipping(false)
        setHasFinished(true)

        if (prizeAmount > 0) {
          setShowWinCelebration(true)
          playWin()
          vibrate([100, 50, 100])
        } else {
          vibrate(30)
        }

        onComplete(prizeAmount)
      }, 500)
    }, 2000)
  }

  const isWin = prizeAmount > 0

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={showWinCelebration ? { scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] } : { opacity: 0.15 }}
          transition={{ duration: 1, repeat: showWinCelebration ? 3 : 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FFB800] blur-[100px] rounded-full"
        />
      </div>

      {/* Win Celebration Particles */}
      <AnimatePresence>
        {showWinCelebration && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5],
                  x: Math.cos((i / 20) * Math.PI * 2) * 150,
                  y: Math.sin((i / 20) * Math.PI * 2) * 150,
                }}
                transition={{ duration: 1.5, delay: i * 0.03 }}
                className="absolute top-1/2 left-1/2 pointer-events-none"
              >
                <Sparkles size={16} className={i % 2 === 0 ? 'text-[#FFB800]' : 'text-[#00FF88]'} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Coin Container */}
      <div className="relative mb-4" style={{ perspective: '800px' }}>
        {/* Shadow */}
        <motion.div
          animate={isFlipping ? { scale: [1, 0.5, 1], opacity: [0.3, 0.1, 0.3] } : {}}
          transition={{ duration: 2 }}
          className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-24 h-6 bg-black/30 rounded-full blur-md"
        />

        {/* The Coin - Compact */}
        <motion.div
          className="relative w-28 h-28 sm:w-32 sm:h-32 cursor-pointer"
          onClick={flipCoin}
          animate={
            isFlipping
              ? {
                  rotateX: [0, 1800],
                  y: [0, -80, 0],
                }
              : {}
          }
          transition={{
            duration: 2,
            ease: [0.45, 0, 0.55, 1],
          }}
          style={{ transformStyle: 'preserve-3d' }}
          whileHover={!isFlipping && !disabled && !hasFinished ? { scale: 1.05 } : {}}
          whileTap={!isFlipping && !disabled && !hasFinished ? { scale: 0.95 } : {}}
        >
          {/* Front (Heads) */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: showResult && result === 'tails' ? 'rotateX(180deg)' : 'rotateX(0deg)',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD700] via-[#FFB800] to-[#FF8C00] shadow-[0_0_30px_rgba(255,184,0,0.5),inset_0_-6px_12px_rgba(0,0,0,0.3),inset_0_6px_12px_rgba(255,255,255,0.3)]">
              <div className="absolute inset-3 rounded-full border-2 border-[#B8860B]/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-12 h-12 sm:w-14 sm:h-14 text-[#0B0F1A] drop-shadow-[0_0_8px_rgba(255,184,0,0.6)]" fill="currentColor" />
              </div>
              <div className="absolute top-3 left-4 w-6 h-8 bg-white/20 rounded-full rotate-[-30deg] blur-sm" />
            </div>
          </div>

          {/* Back (Tails) */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: showResult && result === 'heads' ? 'rotateX(-180deg)' : 'rotateX(180deg)',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#C0C0C0] via-[#E8E8E8] to-[#A8A8A8] shadow-[0_0_30px_rgba(192,192,192,0.3),inset_0_-6px_12px_rgba(0,0,0,0.3),inset_0_6px_12px_rgba(255,255,255,0.4)]">
              <div className="absolute inset-3 rounded-full border-2 border-[#808080]/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl sm:text-5xl font-black text-[#4A5568]/70">C</span>
              </div>
              <div className="absolute top-3 left-4 w-6 h-8 bg-white/30 rounded-full rotate-[-30deg] blur-sm" />
            </div>
          </div>
        </motion.div>
      </div>


      {/* Instructions or Result */}
      <div className="text-center mb-3">
        {isFlipping && (
          <motion.p
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-[#FFB800] text-base sm:text-lg font-bold"
          >
            🪙 La pièce tourne...
          </motion.p>
        )}
        {hasFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className={`text-2xl sm:text-3xl font-black flex items-center justify-center gap-2 ${result === 'heads' ? 'text-[#FFB800]' : 'text-[#C0C0C0]'}`}>
              {result === 'heads' ? <><Zap className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" /> PILE !</> : '🪙 FACE !'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Play Button - Compact */}
      {!isFlipping && !hasFinished && (
        <motion.button
          onClick={flipCoin}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          className={`
            px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-sm sm:text-base uppercase tracking-wider
            transition-all duration-300
            ${disabled
              ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FFB800] to-[#FF8C00] text-[#0B0F1A] shadow-[0_0_20px_rgba(255,184,0,0.3)]'
            }
          `}
        >
          🪙 Lancer
        </motion.button>
      )}

      {/* Result Card - Compact */}
      <div className="h-16 mt-3 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 sm:px-6 py-2.5 rounded-xl border ${
                isWin
                  ? 'bg-[#FFB800]/20 border-[#FFB800]/50'
                  : 'bg-[#141B2D] border-white/10'
              }`}
            >
              <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${isWin ? 'text-[#FFB800]' : 'text-white/40'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest">
                  {isWin ? 'Gagné' : 'Perdu'}
                </span>
                <span className={`text-lg sm:text-xl font-black ${isWin ? 'text-[#FFB800]' : 'text-white/60'}`}>
                  {isWin ? '+10' : '0'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
