'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles, Info } from 'lucide-react'

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

  const flipCoin = () => {
    if (isFlipping || disabled) return

    setIsFlipping(true)
    setHasFinished(false)
    setShowResult(false)
    setShowWinCelebration(false)

    // Flip animation duration
    setTimeout(() => {
      setShowResult(true)
      setTimeout(() => {
        setIsFlipping(false)
        setHasFinished(true)
        if (prizeAmount > 0) {
          setShowWinCelebration(true)
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
      <div className="relative mb-6" style={{ perspective: '1000px' }}>
        {/* Shadow */}
        <motion.div
          animate={isFlipping ? { scale: [1, 0.5, 1], opacity: [0.3, 0.1, 0.3] } : {}}
          transition={{ duration: 2 }}
          className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-36 h-8 bg-black/30 rounded-full blur-md"
        />

        {/* The Coin - Bigger and more prominent */}
        <motion.div
          className="relative w-44 h-44 cursor-pointer"
          onClick={flipCoin}
          animate={
            isFlipping
              ? {
                  rotateX: [0, 1800],
                  y: [0, -120, 0],
                }
              : {}
          }
          transition={{
            duration: 2,
            ease: [0.45, 0, 0.55, 1],
          }}
          style={{ transformStyle: 'preserve-3d' }}
          whileHover={!isFlipping && !disabled && !hasFinished ? { scale: 1.08, rotate: 5 } : {}}
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

      {/* Payout info - More visual and clear */}
      {!isFlipping && !hasFinished && (
        <div className="w-full max-w-xs mb-4">
          {/* Payout cards */}
          <div className="flex justify-center gap-4 mb-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-1 bg-gradient-to-br from-[#FFB800]/20 to-[#FF8C00]/10 border border-[#FFB800]/40 rounded-xl p-3 text-center"
            >
              <div className="text-3xl mb-1">👑</div>
              <div className="text-[#FFB800] text-sm font-black uppercase">Pile</div>
              <div className="text-[#00FF88] text-xl font-black">+10</div>
              <div className="text-white/40 text-[10px]">10% de chance</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-1 bg-gradient-to-br from-[#4A5568]/20 to-[#2D3748]/10 border border-white/20 rounded-xl p-3 text-center"
            >
              <div className="text-3xl mb-1">🪙</div>
              <div className="text-[#C0C0C0] text-sm font-black uppercase">Face</div>
              <div className="text-[#FF4F4F] text-xl font-black">0</div>
              <div className="text-white/40 text-[10px]">90% de chance</div>
            </motion.div>
          </div>

          {/* Hint */}
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
            <Info size={12} />
            <span>Cliquez sur la pièce ou le bouton</span>
          </div>
        </div>
      )}

      {/* Instructions or Result */}
      <div className="text-center mb-4">
        {isFlipping && (
          <motion.div className="flex flex-col items-center gap-2">
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-[#FFB800] text-xl font-bold"
            >
              La pièce tourne...
            </motion.p>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              className="text-2xl"
            >
              🪙
            </motion.div>
          </motion.div>
        )}
        {hasFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-center"
          >
            <motion.p
              animate={isWin ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3, repeat: isWin ? 2 : 0 }}
              className={`text-4xl font-black ${result === 'heads' ? 'text-[#FFB800]' : 'text-[#C0C0C0]'}`}
            >
              {result === 'heads' ? '👑 PILE !' : '🪙 FACE !'}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-lg mt-2 font-bold ${result === 'heads' ? 'text-[#00FF88]' : 'text-white/50'}`}
            >
              {result === 'heads' ? '🎉 Félicitations !' : 'Pas de chance cette fois...'}
            </motion.p>
          </motion.div>
        )}
      </div>

      {/* Play Button - More prominent */}
      {!isFlipping && !hasFinished && (
        <motion.button
          onClick={flipCoin}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          className={`
            relative px-10 py-4 rounded-xl font-black text-lg uppercase tracking-wider
            transition-all duration-300 overflow-hidden
            ${disabled
              ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FFB800] to-[#FF8C00] text-[#0B0F1A] shadow-[0_0_30px_rgba(255,184,0,0.3)]'
            }
          `}
        >
          {/* Shine effect */}
          {!disabled && (
            <motion.div
              animate={{ x: [-200, 200] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
          )}
          <span className="relative z-10">🪙 Lancer la pièce</span>
        </motion.button>
      )}

      {/* Result Card */}
      <div className="h-20 mt-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-4 px-8 py-4 rounded-2xl border shadow-lg ${
                isWin
                  ? 'bg-gradient-to-r from-[#FFB800]/20 to-[#00FF88]/20 border-[#FFB800]/50 shadow-[0_0_30px_rgba(255,184,0,0.3)]'
                  : 'bg-[#141B2D] border-white/10'
              }`}
            >
              <motion.div
                animate={isWin ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: isWin ? 2 : 0 }}
              >
                <Trophy className={`w-8 h-8 ${isWin ? 'text-[#FFB800]' : 'text-white/40'}`} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
                  {isWin ? '🎉 Gagné !' : 'Perdu'}
                </span>
                <span className={`text-2xl font-black ${isWin ? 'text-[#FFB800]' : 'text-white/60'}`}>
                  {isWin ? '+10' : '0'} CRÉDITS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
