'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTime } from '@/lib/utils/timer'

interface GameTimerProps {
  timeLeft: number
  isUrgent: boolean
  isCritical: boolean
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

export const GameTimer = memo(function GameTimer({
  timeLeft,
  isUrgent,
  isCritical,
  status,
}: GameTimerProps) {
  const formattedTime = useMemo(() => {
    if (status === 'waiting') return '--:--:--'
    return formatTime(timeLeft)
  }, [timeLeft, status])

  const digits = formattedTime.split('')

  const getStatusConfig = () => {
    if (status === 'waiting') {
      return {
        label: 'Commence bientôt',
        color: 'text-text-secondary',
        bgColor: 'bg-white/5',
        borderColor: 'border-white/10',
        glowColor: '',
      }
    }
    if (isCritical) {
      return {
        label: 'DERNIERES SECONDES !',
        color: 'text-danger',
        bgColor: 'bg-danger/10',
        borderColor: 'border-danger/30',
        glowColor: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
      }
    }
    if (isUrgent) {
      return {
        label: 'PHASE FINALE',
        color: 'text-neon-pink',
        bgColor: 'bg-neon-pink/10',
        borderColor: 'border-neon-pink/30',
        glowColor: 'shadow-[0_0_20px_rgba(255,79,216,0.2)]',
      }
    }
    return {
      label: 'Temps restant',
      color: 'text-neon-blue',
      bgColor: 'bg-neon-blue/5',
      borderColor: 'border-neon-blue/20',
      glowColor: '',
    }
  }

  const config = getStatusConfig()

  // Progress percentage for the bar
  const maxTime = 60000 // 60 seconds max display
  const progress = Math.min(timeLeft / maxTime, 1)

  return (
    <div className="space-y-4">
      {/* Status label */}
      <motion.div
        key={config.label}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className={`
          inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
          ${config.bgColor} ${config.borderColor} border ${config.color}
        `}>
          {(isUrgent || isCritical) && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              ⚡
            </motion.span>
          )}
          {config.label}
        </span>
      </motion.div>

      {/* Timer display */}
      <motion.div
        className={`
          relative rounded-2xl p-6 text-center
          ${config.bgColor} ${config.borderColor} border
          ${config.glowColor}
          transition-all duration-300
        `}
        animate={isCritical ? {
          scale: [1, 1.02, 1],
          transition: { repeat: Infinity, duration: 0.5 }
        } : {}}
      >
        {/* Timer digits */}
        <div className="flex items-center justify-center gap-1">
          <AnimatePresence mode="popLayout">
            {digits.map((digit, index) => (
              <motion.span
                key={`${index}-${digit}`}
                initial={{ opacity: 0, y: 20, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20, rotateX: 90 }}
                transition={{ duration: 0.2 }}
                className={`
                  inline-block font-mono font-bold
                  ${digit === ':' ? 'text-4xl md:text-5xl mx-1' : 'text-5xl md:text-6xl'}
                  ${config.color}
                `}
                style={{
                  textShadow: isCritical
                    ? '0 0 20px rgba(239,68,68,0.5)'
                    : isUrgent
                    ? '0 0 15px rgba(255,79,216,0.4)'
                    : '0 0 10px rgba(60,203,255,0.3)',
                }}
              >
                {digit}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        {status !== 'waiting' && (
          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isCritical
                  ? 'bg-gradient-to-r from-danger to-neon-pink'
                  : isUrgent
                  ? 'bg-gradient-to-r from-neon-pink to-neon-purple'
                  : 'bg-gradient-to-r from-neon-blue to-neon-purple'
              }`}
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </motion.div>

      {/* Phase finale info */}
      <AnimatePresence>
        {isUrgent && status !== 'ended' && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-sm text-neon-pink"
          >
            Chaque clic remet le timer a 1 minute !
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
})
