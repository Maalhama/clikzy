'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'

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

// Calculate credits from sum for display
function getCreditsFromSum(sum: number): number {
  if (sum <= 3) return 2
  if (sum <= 5) return 3
  if (sum <= 7) return 4
  if (sum <= 9) return 6
  if (sum <= 11) return 8
  return 10
}

function DiceFace({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`absolute w-full h-full rounded-lg ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full p-2">
        {DICE_DOTS[value]?.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="12"
            fill="white"
            style={{
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

function Dice3D({
  finalValue,
  color,
  isRolling,
  delay,
  onAnimationComplete
}: {
  finalValue: number
  color: string
  isRolling: boolean
  delay: number
  onAnimationComplete?: () => void
}) {
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 })

  // Map face values to rotations (which rotation shows which face on top)
  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: 90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: -90 },
    6: { x: 180, y: 0 },
  }

  useEffect(() => {
    if (isRolling) {
      // Animate through random rotations during roll
      const interval = setInterval(() => {
        setCurrentRotation({
          x: Math.random() * 360,
          y: Math.random() * 360,
        })
      }, 100)

      // Stop after animation and land on final value
      const timeout = setTimeout(() => {
        clearInterval(interval)
        setCurrentRotation(faceRotations[finalValue])
        if (onAnimationComplete) onAnimationComplete()
      }, 1500 + delay * 1000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolling, finalValue, delay])

  return (
    <motion.div
      className="relative"
      style={{ perspective: '600px' }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: isRolling ? [-20, 0, -40, 0, -20, 0] : 0,
      }}
      transition={{
        scale: { duration: 0.3, delay: delay * 0.3 },
        y: { duration: 1.5, repeat: isRolling ? Infinity : 0 },
      }}
    >
      <motion.div
        className="w-20 h-20 sm:w-24 sm:h-24 relative"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateX: isRolling ? [0, 720, 1440, 2160] : currentRotation.x,
          rotateY: isRolling ? [0, 720, 1440, 2160] : currentRotation.y,
        }}
        transition={{
          duration: isRolling ? 1.5 : 0.5,
          delay: delay * 0.2,
          ease: isRolling ? 'easeInOut' : 'easeOut',
        }}
      >
        {/* Front face (1) */}
        <DiceFace
          value={1}
          className={`bg-gradient-to-br from-[${color}] to-[${color}cc] border-2 border-white/20`}
        />
        <div
          className="absolute w-full h-full rounded-lg flex items-center justify-center"
          style={{
            transform: 'translateZ(40px)',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            {DICE_DOTS[1]?.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="12" fill="white" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
            ))}
          </svg>
        </div>

        {/* Back face (6) */}
        <div
          className="absolute w-full h-full rounded-lg flex items-center justify-center"
          style={{
            transform: 'rotateY(180deg) translateZ(40px)',
            background: `linear-gradient(135deg, ${color}cc, ${color})`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            {DICE_DOTS[6]?.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="12" fill="white" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
            ))}
          </svg>
        </div>

        {/* Right face (2) */}
        <div
          className="absolute w-full h-full rounded-lg flex items-center justify-center"
          style={{
            transform: 'rotateY(90deg) translateZ(40px)',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            {DICE_DOTS[2]?.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="12" fill="white" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
            ))}
          </svg>
        </div>

        {/* Left face (5) */}
        <div
          className="absolute w-full h-full rounded-lg flex items-center justify-center"
          style={{
            transform: 'rotateY(-90deg) translateZ(40px)',
            background: `linear-gradient(135deg, ${color}cc, ${color})`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            {DICE_DOTS[5]?.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="12" fill="white" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
            ))}
          </svg>
        </div>

        {/* Top face (3) */}
        <div
          className="absolute w-full h-full rounded-lg flex items-center justify-center"
          style={{
            transform: 'rotateX(90deg) translateZ(40px)',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            {DICE_DOTS[3]?.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="12" fill="white" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
            ))}
          </svg>
        </div>

        {/* Bottom face (4) */}
        <div
          className="absolute w-full h-full rounded-lg flex items-center justify-center"
          style={{
            transform: 'rotateX(-90deg) translateZ(40px)',
            background: `linear-gradient(135deg, ${color}cc, ${color})`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            {DICE_DOTS[4]?.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="12" fill="white" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
            ))}
          </svg>
        </div>
      </motion.div>

      {/* Shadow */}
      <motion.div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full blur-md"
        animate={{
          scale: isRolling ? [1, 0.5, 1] : 1,
          opacity: isRolling ? [0.3, 0.1, 0.3] : 0.3,
        }}
        transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
      />

      {/* Glow effect when showing value */}
      {!isRolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: `0 0 40px ${color}60`,
          }}
        />
      )}
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
  const [showConversion, setShowConversion] = useState(false)

  const roll = () => {
    if (isRolling || disabled) return

    setIsRolling(true)
    setHasFinished(false)
    setShowDice(true)
    setShowConversion(false)

    setTimeout(() => {
      setIsRolling(false)
      // Show conversion animation
      setTimeout(() => {
        setShowConversion(true)
        setTimeout(() => {
          setHasFinished(true)
          onComplete(prizeAmount)
        }, 1000)
      }, 500)
    }, 2000)
  }

  const total = diceResults[0] + diceResults[1]
  const calculatedCredits = getCreditsFromSum(total)

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#9B5CFF] opacity-10 blur-[100px] rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-[200px] h-[200px] bg-[#FF4FD8] opacity-10 blur-[80px] rounded-full" />
      </div>

      {/* Payout table */}
      {!showDice && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/60">2-3</div>
            <div className="text-[#00FF88] font-bold">2 cr</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/60">4-5</div>
            <div className="text-[#00FF88] font-bold">3 cr</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/60">6-7</div>
            <div className="text-[#00FF88] font-bold">4 cr</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/60">8-9</div>
            <div className="text-[#00FF88] font-bold">6 cr</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/60">10-11</div>
            <div className="text-[#00FF88] font-bold">8 cr</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-[#FFB800]/30">
            <div className="text-[#FFB800]">12</div>
            <div className="text-[#FFB800] font-bold">10 cr</div>
          </div>
        </div>
      )}

      {/* Dice Table */}
      <div className="relative mb-6">
        {/* Table surface */}
        <div className="relative w-72 h-48 sm:w-80 sm:h-56 bg-gradient-to-b from-[#1E2942] to-[#141B2D] rounded-2xl border-4 border-[#1E2942] shadow-[inset_0_4px_20px_rgba(0,0,0,0.5),0_0_30px_rgba(155,92,255,0.2)]">
          {/* Felt texture overlay */}
          <div className="absolute inset-2 rounded-xl bg-[#0B0F1A]/50" />

          {/* Dice container */}
          <div className="absolute inset-0 flex items-center justify-center gap-6">
            {showDice ? (
              <>
                <Dice3D
                  finalValue={diceResults[0]}
                  color="#9B5CFF"
                  isRolling={isRolling}
                  delay={0}
                />
                <Dice3D
                  finalValue={diceResults[1]}
                  color="#FF4FD8"
                  isRolling={isRolling}
                  delay={0.2}
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

      {/* Total and Conversion display */}
      <AnimatePresence>
        {showDice && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <motion.span
                className="text-4xl font-black text-[#9B5CFF]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                {diceResults[0]}
              </motion.span>
              <span className="text-2xl text-white/60">+</span>
              <motion.span
                className="text-4xl font-black text-[#FF4FD8]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {diceResults[1]}
              </motion.span>
              <span className="text-2xl text-white/60">=</span>
              <motion.span
                className={`text-4xl font-black ${total === 12 ? 'text-[#FFB800]' : 'text-white'}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                {total}
              </motion.span>
            </div>

            {/* Conversion animation */}
            {showConversion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3"
              >
                <motion.div
                  animate={{ x: [-5, 5, -5] }}
                  transition={{ duration: 0.3, repeat: 3 }}
                >
                  <Sparkles className="w-5 h-5 text-[#FFB800]" />
                </motion.div>
                <span className="text-lg text-white/60">→</span>
                <motion.span
                  className={`text-3xl font-black ${calculatedCredits >= 8 ? 'text-[#FFB800]' : 'text-[#00FF88]'}`}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {calculatedCredits} CRÉDITS
                </motion.span>
                <motion.div
                  animate={{ x: [5, -5, 5] }}
                  transition={{ duration: 0.3, repeat: 3 }}
                >
                  <Sparkles className="w-5 h-5 text-[#FFB800]" />
                </motion.div>
              </motion.div>
            )}

            {/* Jackpot for double 6 */}
            {total === 12 && showConversion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-[#FFB800] font-bold text-sm uppercase tracking-wider"
              >
                Double 6 ! Jackpot !
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
              <Trophy className={`w-6 h-6 ${prizeAmount >= 8 ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Gagné</span>
                <span className={`text-xl font-black ${prizeAmount >= 8 ? 'text-[#FFB800]' : 'text-white'}`}>
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
