'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useMiniGameSounds } from '@/hooks/mini-games/useMiniGameSounds'

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
  const [animationPhase, setAnimationPhase] = useState<'tumbling' | 'bouncing' | 'settling' | 'settled'>('settled')

  // Map face values to rotations (which rotation shows which face on top)
  const faceRotations: Record<number, { x: number; y: number; z: number }> = {
    1: { x: 0, y: 0, z: 0 },
    2: { x: 0, y: 90, z: 0 },
    3: { x: -90, y: 0, z: 0 },
    4: { x: 90, y: 0, z: 0 },
    5: { x: 0, y: -90, z: 0 },
    6: { x: 180, y: 0, z: 0 },
  }

  const finalRotation = faceRotations[finalValue]

  useEffect(() => {
    if (isRolling) {
      // Phase 1: Tumbling (chaotic rotation)
      setAnimationPhase('tumbling')

      // Phase 2: Bouncing (landing with multiple bounces)
      const bouncingTimeout = setTimeout(() => {
        setAnimationPhase('bouncing')
      }, 1200 + delay * 200)

      // Phase 3: Settling (micro-oscillations)
      const settlingTimeout = setTimeout(() => {
        setAnimationPhase('settling')
      }, 1800 + delay * 200)

      // Phase 4: Settled (final position)
      const settledTimeout = setTimeout(() => {
        setAnimationPhase('settled')
        if (onAnimationComplete) onAnimationComplete()
      }, 2200 + delay * 200)

      return () => {
        clearTimeout(bouncingTimeout)
        clearTimeout(settlingTimeout)
        clearTimeout(settledTimeout)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolling, delay])

  // Physics-based animation variants
  const getTumblingAnimation = () => {
    // Chaotic tumbling with different speeds on each axis
    const baseSpins = 3 + Math.random() * 2
    return {
      rotateX: [0, 360 * baseSpins + (Math.random() - 0.5) * 180],
      rotateY: [0, 360 * (baseSpins + 0.5) + (Math.random() - 0.5) * 180],
      rotateZ: [0, 360 * (baseSpins - 0.3) + (Math.random() - 0.5) * 180],
      y: [0, -40, -25, -45, -20, -35, -10],
    }
  }

  const getBouncingAnimation = () => {
    // Multiple bounces with decreasing height
    return {
      rotateX: [
        null, // Start from current
        finalRotation.x + 720, // Extra spins while bouncing
        finalRotation.x + 360,
        finalRotation.x + 180,
        finalRotation.x,
      ],
      rotateY: [
        null,
        finalRotation.y + 720,
        finalRotation.y + 360,
        finalRotation.y + 180,
        finalRotation.y,
      ],
      rotateZ: [
        null,
        finalRotation.z + 360,
        finalRotation.z + 180,
        finalRotation.z + 90,
        finalRotation.z,
      ],
      y: [null, -15, 0, -8, 0, -3, 0], // Bounces: 15px, 8px, 3px
    }
  }

  const getSettlingAnimation = () => {
    // Micro-oscillations (wobble) around final position
    return {
      rotateX: [
        finalRotation.x,
        finalRotation.x + 5,
        finalRotation.x - 3,
        finalRotation.x + 2,
        finalRotation.x - 1,
        finalRotation.x,
      ],
      rotateY: [
        finalRotation.y,
        finalRotation.y - 4,
        finalRotation.y + 3,
        finalRotation.y - 2,
        finalRotation.y + 1,
        finalRotation.y,
      ],
      rotateZ: [
        finalRotation.z,
        finalRotation.z + 3,
        finalRotation.z - 2,
        finalRotation.z + 1,
        finalRotation.z,
      ],
      y: [0, -1, 0, -0.5, 0],
    }
  }

  return (
    <motion.div
      className="relative"
      style={{ perspective: '500px' }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        scale: { duration: 0.3, delay: delay * 0.3 },
        opacity: { duration: 0.3, delay: delay * 0.3 },
      }}
    >
      <motion.div
        className="w-14 h-14 sm:w-16 sm:h-16 relative"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={
          animationPhase === 'tumbling'
            ? getTumblingAnimation()
            : animationPhase === 'bouncing'
              ? getBouncingAnimation()
              : animationPhase === 'settling'
                ? getSettlingAnimation()
                : {
                    rotateX: finalRotation.x,
                    rotateY: finalRotation.y,
                    rotateZ: finalRotation.z,
                    y: 0,
                  }
        }
        transition={
          animationPhase === 'tumbling'
            ? {
                duration: 1.2,
                ease: [0.25, 0.1, 0.25, 1], // Custom easing for chaotic feel
              }
            : animationPhase === 'bouncing'
              ? {
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1], // Bounce easing
                }
              : animationPhase === 'settling'
                ? {
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1], // Smooth settle
                  }
                : {
                    duration: 0.3,
                    ease: 'easeOut',
                  }
        }
      >
        {/* Front face (1) */}
        <DiceFace
          value={1}
          className={`bg-gradient-to-br from-[${color}] to-[${color}cc] border-2 border-white/20`}
        />
        <div
          className="absolute w-full h-full rounded-lg flex items-center justify-center"
          style={{
            transform: 'translateZ(28px)',
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
            transform: 'rotateY(180deg) translateZ(28px)',
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
            transform: 'rotateY(90deg) translateZ(28px)',
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
            transform: 'rotateY(-90deg) translateZ(28px)',
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
            transform: 'rotateX(90deg) translateZ(28px)',
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
            transform: 'rotateX(-90deg) translateZ(28px)',
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

      {/* Shadow - synchronized with dice bounces */}
      <motion.div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full blur-md"
        animate={
          animationPhase === 'tumbling'
            ? {
                scale: [1, 0.5, 0.6, 0.4, 0.6, 0.5, 0.7],
                opacity: [0.3, 0.1, 0.15, 0.08, 0.15, 0.12, 0.2],
              }
            : animationPhase === 'bouncing'
              ? {
                  scale: [0.7, 0.8, 1, 0.9, 1, 0.95, 1],
                  opacity: [0.2, 0.15, 0.3, 0.2, 0.3, 0.25, 0.3],
                }
              : animationPhase === 'settling'
                ? {
                    scale: [1, 0.98, 1],
                    opacity: [0.3, 0.28, 0.3],
                  }
                : {
                    scale: 1,
                    opacity: 0.3,
                  }
        }
        transition={
          animationPhase === 'tumbling'
            ? { duration: 1.2 }
            : animationPhase === 'bouncing'
              ? { duration: 0.6 }
              : animationPhase === 'settling'
                ? { duration: 0.4 }
                : { duration: 0.3 }
        }
      />

      {/* Glow effect - dynamic based on phase */}
      {animationPhase !== 'settled' && isRolling && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={
            animationPhase === 'tumbling'
              ? {
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.3, 1],
                }
              : animationPhase === 'bouncing'
                ? {
                    opacity: [0.6, 0.8, 0.4],
                    scale: [1, 1.2, 1],
                  }
                : {
                    opacity: [0.4, 1],
                    scale: [1, 1.1],
                  }
          }
          transition={{
            duration: animationPhase === 'tumbling' ? 1.2 : animationPhase === 'bouncing' ? 0.6 : 0.4,
          }}
          style={{
            boxShadow: `0 0 40px ${color}`,
          }}
        />
      )}
      {animationPhase === 'settled' && !isRolling && (
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
  const [screenShake, setScreenShake] = useState(false)

  const { playImpact, playWhoosh, playWin, vibrate } = useMiniGameSounds()

  const roll = () => {
    if (isRolling || disabled) return

    setIsRolling(true)
    setHasFinished(false)
    setShowDice(true)
    setShowConversion(false)

    // Whoosh au lancer
    playWhoosh(0.5)
    vibrate(50)

    // Impacts pendant la phase tumbling (hits en l'air)
    const tumblingImpacts = [300, 600, 900]
    tumblingImpacts.forEach((time, i) => {
      setTimeout(() => {
        playImpact(0.15 + i * 0.05)
        vibrate(15)
      }, time)
    })

    // Impacts des bounces (landing phase) - synchronized with bounce animation
    // Bounce 1: fort (1200ms) - Premier atterrissage
    setTimeout(() => {
      playImpact(0.6)
      vibrate(50)
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 100)
    }, 1200)

    // Bounce 2: moyen (1400ms)
    setTimeout(() => {
      playImpact(0.4)
      vibrate(30)
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 80)
    }, 1400)

    // Bounce 3: léger (1600ms)
    setTimeout(() => {
      playImpact(0.25)
      vibrate(20)
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 60)
    }, 1600)

    // Settling: micro-impact (1800ms)
    setTimeout(() => {
      playImpact(0.15)
      vibrate(10)

      setIsRolling(false)

      // Show conversion animation
      setTimeout(() => {
        setShowConversion(true)

        const total = diceResults[0] + diceResults[1]
        const isDouble6 = total === 12

        if (isDouble6) {
          playWin()
          vibrate([100, 50, 100, 50, 100])
        } else if (prizeAmount >= 8) {
          playWin()
          vibrate([80, 40, 80])
        } else {
          vibrate(40)
        }

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
    <motion.div
      animate={screenShake ? { x: [-3, 3, -3, 3, 0], y: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col items-center justify-center p-2 select-none"
    >
      {/* Glow Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#9B5CFF] opacity-10 blur-[80px] rounded-full" />
      </div>


      {/* Dice Table */}
      <div className="relative mb-3">
        {/* Table surface */}
        <div className="relative w-56 h-36 sm:w-64 sm:h-40 bg-gradient-to-b from-[#1E2942] to-[#141B2D] rounded-xl border-2 border-[#1E2942] shadow-[inset_0_4px_15px_rgba(0,0,0,0.5),0_0_20px_rgba(155,92,255,0.2)]">
          {/* Felt texture overlay */}
          <div className="absolute inset-1.5 rounded-lg bg-[#0B0F1A]/50" />

          {/* Dice container */}
          <div className="absolute inset-0 flex items-center justify-center gap-4">
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
              <div className="text-[var(--text-secondary)] text-sm">
                Cliquez pour lancer
              </div>
            )}
          </div>

          {/* Corner decorations */}
          {[
            'top-1.5 left-1.5',
            'top-1.5 right-1.5',
            'bottom-1.5 left-1.5',
            'bottom-1.5 right-1.5',
          ].map((position, i) => (
            <div
              key={i}
              className={`absolute ${position} w-2 h-2 rounded-full bg-[#9B5CFF]/30`}
            />
          ))}
        </div>
      </div>

      {/* Total and Conversion display */}
      <AnimatePresence>
        {showDice && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <motion.span
                className="text-2xl font-black text-[#9B5CFF]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                {diceResults[0]}
              </motion.span>
              <span className="text-lg text-white/60">+</span>
              <motion.span
                className="text-2xl font-black text-[#FF4FD8]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {diceResults[1]}
              </motion.span>
              <span className="text-lg text-white/60">=</span>
              <motion.span
                className={`text-2xl font-black ${total === 12 ? 'text-[#FFB800]' : 'text-white'}`}
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <span className="text-sm text-white/60">→</span>
                <motion.span
                  className={`text-xl font-black ${calculatedCredits >= 8 ? 'text-[#FFB800]' : 'text-[#00FF88]'}`}
                >
                  +{calculatedCredits}
                </motion.span>
              </motion.div>
            )}

            {/* Jackpot for double 6 */}
            {total === 12 && showConversion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#FFB800] font-bold text-xs uppercase tracking-wider"
              >
                Double 6 !
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Particles */}
      <AnimatePresence>
        {showConversion && prizeAmount >= 8 && (
          <>
            {/* Explosion d'étoiles pour gros gains */}
            {[...Array(16)].map((_, i) => {
              const angle = (i / 16) * Math.PI * 2
              const distance = 80 + Math.random() * 40
              const color = total === 12 ? '#FFB800' : i % 2 === 0 ? '#9B5CFF' : '#FF4FD8'

              return (
                <motion.div
                  key={`star-${i}`}
                  initial={{ opacity: 0, scale: 0, x: 0, y: -50 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.4],
                    x: Math.cos(angle) * distance,
                    y: -50 + Math.sin(angle) * distance,
                  }}
                  transition={{ duration: 1.2, delay: i * 0.04 }}
                  className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />
              )
            })}
          </>
        )}
      </AnimatePresence>

      {/* Roll Button */}
      {!hasFinished && (
        <motion.button
          onClick={roll}
          disabled={isRolling || disabled}
          whileHover={!isRolling && !disabled ? { scale: 1.05 } : {}}
          whileTap={!isRolling && !disabled ? { scale: 0.95 } : {}}
          className={`
            px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider
            transition-all duration-300
            ${isRolling || disabled
              ? 'bg-[#1E2942] text-[#4A5568] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4FD8] text-white hover:shadow-[0_0_20px_rgba(155,92,255,0.5)]'
            }
          `}
        >
          {isRolling ? 'Lancer...' : 'Lancer'}
        </motion.button>
      )}

      {/* Result */}
      <div className="h-14 mt-2 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasFinished && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${prizeAmount >= 8 ? 'bg-[#FFB800]/20 border-[#FFB800]/50' : 'bg-[#141B2D] border-white/10'}`}
            >
              <Trophy className={`w-5 h-5 ${prizeAmount >= 8 ? 'text-[#FFB800]' : 'text-[#9B5CFF]'}`} />
              <div className="flex flex-col">
                <span className="text-white/60 text-[9px] uppercase font-bold tracking-widest">Gagné</span>
                <span className={`text-lg font-black ${prizeAmount >= 8 ? 'text-[#FFB800]' : 'text-white'}`}>
                  +{prizeAmount}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
