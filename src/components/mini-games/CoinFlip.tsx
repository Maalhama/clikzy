'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles, Zap } from 'lucide-react'
import { useMiniGameSounds } from '@/hooks/mini-games/useMiniGameSounds'
import { useMiniGameStateMachine } from '@/hooks/mini-games/useMiniGameStateMachine'

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
  const [showWinCelebration, setShowWinCelebration] = useState(false)

  const { playTick, playWhoosh, playImpact, playWin, vibrate } = useMiniGameSounds()

  // State machine for game flow
  const game = useMiniGameStateMachine({
    onStart: () => {
      setShowWinCelebration(false)
      playWhoosh(0.6)
      vibrate(50)
    },
    onStop: () => {
      playImpact(0.5)
      vibrate(60)
    },
    onComplete: () => {
      if (prizeAmount > 0) {
        setShowWinCelebration(true)
        playWin()
        vibrate([100, 50, 100])
      } else {
        vibrate(30)
      }
      onComplete(prizeAmount)
    },
  })

  // Auto-reset après completion pour permettre de rejouer
  useEffect(() => {
    if (game.isCompleted) {
      const timer = setTimeout(() => {
        game.reset()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [game])

  // Tick à chaque rotation visible pendant le flip
  useEffect(() => {
    if (game.isPlaying) {
      const tickInterval = setInterval(() => {
        playTick(1.5 + Math.random() * 0.3)
      }, 111) // ~9 ticks pendant 2s (180° rotation = 111ms)

      return () => clearInterval(tickInterval)
    }
  }, [game.isPlaying, playTick])

  const flipCoin = () => {
    if (disabled || !game.isIdle) return

    // Start the game (idle -> playing)
    if (!game.start()) return

    // Flip animation: playing -> stopping -> completed
    setTimeout(() => {
      game.stop() // playing -> stopping (show result)

      setTimeout(() => {
        game.complete() // stopping -> completed
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

      {/* Win Celebration Particles - Enhanced */}
      <AnimatePresence>
        {showWinCelebration && (
          <>
            {/* Pièces dorées qui tombent */}
            {[...Array(15)].map((_, i) => {
              const xStart = (Math.random() - 0.5) * 300

              return (
                <motion.div
                  key={`coin-${i}`}
                  initial={{ opacity: 0, x: xStart, y: -100, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: xStart + (Math.random() - 0.5) * 80,
                    y: 250,
                    rotate: [0, 180, 360, 540],
                  }}
                  transition={{ duration: 1.8 + Math.random() * 0.5, delay: i * 0.08, ease: 'easeIn' }}
                  className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFB800, #FF8C00)',
                      boxShadow: '0 0 12px rgba(255, 184, 0, 0.8)',
                    }}
                  />
                </motion.div>
              )
            })}

            {/* Explosion d'étoiles */}
            {[...Array(20)].map((_, i) => {
              const angle = (i / 20) * Math.PI * 2
              const distance = 120 + Math.random() * 50
              const colors = ['#FFB800', '#00FF88', '#3CCBFF']
              const color = colors[i % colors.length]

              return (
                <motion.div
                  key={`star-${i}`}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.4],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                  }}
                  transition={{ duration: 1.3, delay: i * 0.03 }}
                  className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                >
                  <Sparkles size={16} className={`text-[${color}]`} style={{ color }} />
                </motion.div>
              )
            })}

            {/* Confetti */}
            {[...Array(12)].map((_, i) => {
              const xStart = (Math.random() - 0.5) * 200
              const colors = ['#FFB800', '#FF4FD8', '#3CCBFF']
              const color = colors[i % colors.length]

              return (
                <motion.div
                  key={`confetti-${i}`}
                  initial={{ opacity: 0, x: xStart, y: -50, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: xStart + (Math.random() - 0.5) * 60,
                    y: 200,
                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  }}
                  transition={{ duration: 1.5 + Math.random(), delay: i * 0.06 }}
                  className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                  style={{
                    width: 5,
                    height: 10,
                    backgroundColor: color,
                  }}
                />
              )
            })}
          </>
        )}
      </AnimatePresence>

      {/* Coin Container */}
      <div className="relative mb-4" style={{ perspective: '800px' }}>
        {/* Shadow */}
        <motion.div
          animate={game.isPlaying ? { scale: [1, 0.5, 1], opacity: [0.3, 0.1, 0.3] } : {}}
          transition={{ duration: 2 }}
          className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-24 h-6 bg-black/30 rounded-full blur-md"
        />

        {/* The Coin - Compact */}
        <motion.div
          className="relative w-28 h-28 sm:w-32 sm:h-32 cursor-pointer"
          style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
          onClick={flipCoin}
          animate={
            game.isPlaying
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
          whileHover={!game.isPlaying && !disabled && !game.isCompleted ? { scale: 1.05 } : {}}
          whileTap={!game.isPlaying && !disabled && !game.isCompleted ? { scale: 0.95 } : {}}
        >
          {/* Front (Heads) */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: (game.isStopping || game.isCompleted) && result === 'tails' ? 'rotateX(180deg)' : 'rotateX(0deg)',
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
              transform: (game.isStopping || game.isCompleted) && result === 'heads' ? 'rotateX(-180deg)' : 'rotateX(180deg)',
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
        {game.isPlaying && (
          <motion.p
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-[#FFB800] text-base sm:text-lg font-bold"
          >
            🪙 La pièce tourne...
          </motion.p>
        )}
        {(game.isStopping || game.isCompleted) && (
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
      {!game.isPlaying && !game.isStopping && !game.isCompleted && (
        <motion.button
          onClick={flipCoin}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          className={`
            px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-sm sm:text-base uppercase tracking-wider
            transition-all duration-300 min-h-[44px] sm:min-h-0
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
          {(game.isStopping || game.isCompleted) && (
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
                  {isWin ? `+${prizeAmount}` : '0'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
