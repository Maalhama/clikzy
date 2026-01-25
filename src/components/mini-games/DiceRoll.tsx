'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'

interface DiceRollProps {
  onComplete: (creditsWon: number) => void
  diceResults: [number, number] // [dice1, dice2] values 1-6
  prizeAmount: number
  disabled?: boolean
}

// Dot positions for each dice face
const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
}

function Dice({ value, color, isRolling, delay }: { value: number; color: string; isRolling: boolean; delay: number }) {
  return (
    <motion.div
      className="relative w-24 h-24 sm:w-28 sm:h-28"
      animate={
        isRolling
          ? {
              rotateX: [0, 360, 720, 1080],
              rotateY: [0, 360, 720, 1080],
              rotateZ: [0, 180, 360, 540],
              y: [0, -50, 0, -30, 0],
            }
          : {}
      }
      transition={{
        duration: 1.5,
        delay,
        ease: 'easeOut',
      }}
      style={{ perspective: '500px' }}
    >
      <div
        className="w-full h-full rounded-xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2), 0 0 20px ${color}40`,
        }}
      >
        {/* Border glow */}
        <div
          className="absolute inset-0 rounded-xl border-2 opacity-30"
          style={{ borderColor: 'white' }}
        />

        {/* Dots */}
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          {DICE_DOTS[value]?.map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="10"
              fill="white"
              style={{
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
              }}
            />
          ))}
        </svg>

        {/* Shine effect */}
        <div className="absolute top-2 left-2 w-8 h-8 bg-white/20 rounded-full blur-sm" />
      </div>
    </motion.div>
  )
}

export default function DiceRoll({
  onComplete,
  diceResults,
  prizeAmount,
  disabled = false,
}: DiceRollProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const [showDice, setShowDice] = useState(false)

  const roll = () => {
    if (isRolling || disabled) return

    setIsRolling(true)
    setHasFinished(false)
    setShowDice(true)

    setTimeout(() => {
      setIsRolling(false)
      setHasFinished(true)
      onComplete(prizeAmount)
    }, 2000)
  }

  const total = diceResults[0] + diceResults[1]

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#9B5CFF] opacity-10 blur-[100px] rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-[200px] h-[200px] bg-[#FF4FD8] opacity-10 blur-[80px] rounded-full" />
      </div>

      {/* Dice Table */}
      <div className="relative mb-6">
        {/* Table surface */}
        <div className="relative w-72 h-48 sm:w-80 sm:h-56 bg-gradient-to-b from-[#1E2942] to-[#141B2D] rounded-2xl border-4 border-[#1E2942] shadow-[inset_0_4px_20px_rgba(0,0,0,0.5),0_0_30px_rgba(155,92,255,0.2)]">
          {/* Felt texture overlay */}
          <div className="absolute inset-2 rounded-xl bg-[#0B0F1A]/50" />

          {/* Dice container */}
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            {showDice ? (
              <>
                <Dice
                  value={diceResults[0]}
                  color="#9B5CFF"
                  isRolling={isRolling}
                  delay={0}
                />
                <Dice
                  value={diceResults[1]}
                  color="#FF4FD8"
                  isRolling={isRolling}
                  delay={0.1}
                />
              </>
            ) : (
              <div className="text-[var(--text-secondary)] text-lg">
                Cliquez pour lancer les dés
              </div>
            )}
          </div>

          {/* Corner decorations */}
          {[
            'top-2 left-2',
            'top-2 right-2',
            'bottom-2 left-2',
            'bottom-2 right-2',
          ].map((position, i) => (
            <div
              key={i}
              className={`absolute ${position} w-3 h-3 rounded-full bg-[#9B5CFF]/30`}
            />
          ))}
        </div>
      </div>

      {/* Total display */}
      {hasFinished && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 text-center"
        >
          <div className="text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-1">
            Total
          </div>
          <div className="text-4xl font-black text-white">
            {diceResults[0]} + {diceResults[1]} = {' '}
            <span className={total >= 10 ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}>
              {total}
            </span>
          </div>
        </motion.div>
      )}

      {/* Roll Button */}
      {!hasFinished && (
        <button
          onClick={roll}
          disabled={isRolling || disabled}
          className={`
            px-10 py-4 rounded-xl font-black text-lg uppercase tracking-wider
            transition-all duration-300
            ${isRolling || disabled
              ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4FD8] text-white hover:shadow-[0_0_30px_rgba(155,92,255,0.5)] hover:scale-105 active:scale-95'
            }
          `}
        >
          {isRolling ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
              >
                🎲
              </motion.span>
              En cours...
            </span>
          ) : (
            '🎲 Lancer les dés'
          )}
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
