'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'

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

  const flipCoin = () => {
    if (isFlipping || disabled) return

    setIsFlipping(true)
    setHasFinished(false)
    setShowResult(false)

    // Flip animation duration
    setTimeout(() => {
      setShowResult(true)
      setTimeout(() => {
        setIsFlipping(false)
        setHasFinished(true)
        onComplete(prizeAmount)
      }, 500)
    }, 2000)
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FFB800] opacity-15 blur-[100px] rounded-full" />
      </div>

      {/* Coin Container */}
      <div className="relative mb-8" style={{ perspective: '1000px' }}>
        {/* Shadow */}
        <motion.div
          animate={isFlipping ? { scale: [1, 0.5, 1], opacity: [0.3, 0.1, 0.3] } : {}}
          transition={{ duration: 2 }}
          className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-32 h-8 bg-black/30 rounded-full blur-md"
        />

        {/* The Coin */}
        <motion.div
          className="relative w-40 h-40 cursor-pointer"
          onClick={flipCoin}
          animate={
            isFlipping
              ? {
                  rotateX: [0, 1800],
                  y: [0, -100, 0],
                }
              : {}
          }
          transition={{
            duration: 2,
            ease: [0.45, 0, 0.55, 1],
          }}
          style={{ transformStyle: 'preserve-3d' }}
          whileHover={!isFlipping && !disabled ? { scale: 1.05 } : {}}
          whileTap={!isFlipping && !disabled ? { scale: 0.95 } : {}}
        >
          {/* Front (Heads) */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: showResult && result === 'tails' ? 'rotateX(180deg)' : 'rotateX(0deg)',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD700] via-[#FFB800] to-[#FF8C00] shadow-[0_0_40px_rgba(255,184,0,0.5),inset_0_-8px_16px_rgba(0,0,0,0.3),inset_0_8px_16px_rgba(255,255,255,0.3)]">
              {/* Inner ring */}
              <div className="absolute inset-4 rounded-full border-4 border-[#B8860B]/40" />
              {/* Crown symbol */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 50 50" className="w-20 h-20 text-[#0B0F1A]/70">
                  <path
                    fill="currentColor"
                    d="M10 35 L15 15 L20 25 L25 10 L30 25 L35 15 L40 35 Z"
                  />
                  <rect x="10" y="35" width="30" height="5" rx="1" fill="currentColor" />
                </svg>
              </div>
              {/* Shine effect */}
              <div className="absolute top-4 left-6 w-8 h-12 bg-white/20 rounded-full rotate-[-30deg] blur-sm" />
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
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#C0C0C0] via-[#E8E8E8] to-[#A8A8A8] shadow-[0_0_40px_rgba(192,192,192,0.3),inset_0_-8px_16px_rgba(0,0,0,0.3),inset_0_8px_16px_rgba(255,255,255,0.4)]">
              {/* Inner ring */}
              <div className="absolute inset-4 rounded-full border-4 border-[#808080]/40" />
              {/* Number pattern */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-black text-[#4A5568]/60">C</span>
              </div>
              {/* Shine effect */}
              <div className="absolute top-4 left-6 w-8 h-12 bg-white/30 rounded-full rotate-[-30deg] blur-sm" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payout info */}
      {!isFlipping && !hasFinished && (
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-[#FFB800] text-2xl font-black">👑 PILE</div>
            <div className="text-[#00FF88] text-lg font-bold">+10 crédits</div>
            <div className="text-white/40 text-xs">10% de chance</div>
          </div>
          <div className="text-center">
            <div className="text-[#C0C0C0] text-2xl font-black">🪙 FACE</div>
            <div className="text-[#FF4F4F] text-lg font-bold">0 crédit</div>
            <div className="text-white/40 text-xs">90% de chance</div>
          </div>
        </div>
      )}

      {/* Instructions or Result */}
      <div className="text-center mb-6">
        {!isFlipping && !hasFinished && (
          <p className="text-[var(--text-secondary)] text-lg">
            Cliquez sur la pièce pour la lancer !
          </p>
        )}
        {isFlipping && (
          <motion.p
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-[#FFB800] text-xl font-bold"
          >
            La pièce tourne...
          </motion.p>
        )}
        {hasFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className={`text-3xl font-black ${result === 'heads' ? 'text-[#FFB800]' : 'text-[#C0C0C0]'}`}>
              {result === 'heads' ? '👑 PILE !' : '🪙 FACE !'}
            </p>
            <p className={`text-lg mt-1 ${result === 'heads' ? 'text-[#00FF88]' : 'text-white/50'}`}>
              {result === 'heads' ? 'Félicitations !' : 'Pas de chance...'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Play Button (alternative to clicking coin) */}
      {!isFlipping && !hasFinished && (
        <button
          onClick={flipCoin}
          disabled={disabled}
          className={`
            px-8 py-3 rounded-xl font-bold text-lg uppercase tracking-wider
            transition-all duration-300
            ${disabled
              ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FFB800] to-[#FF8C00] text-[#0B0F1A] hover:shadow-[0_0_30px_rgba(255,184,0,0.5)] hover:scale-105 active:scale-95'
            }
          `}
        >
          🪙 Lancer la pièce
        </button>
      )}

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
