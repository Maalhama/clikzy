'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingTimerProps {
  gameId?: string
  initialEndTime?: number
  itemName?: string
  enabled?: boolean
}

export function FloatingTimer({
  gameId,
  initialEndTime,
  itemName = 'iPhone 15 Pro',
  enabled = true,
}: FloatingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [endTime, setEndTime] = useState<number | null>(null)

  // Close handler
  const handleClose = useCallback(() => {
    setIsClosed(true)
  }, [])

  // Initialize and update timer
  useEffect(() => {
    if (!enabled || isClosed) return

    // Show after 2 seconds
    const showTimeout = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    // Use real endTime or simulate one close to 0 for urgency (15-45 seconds)
    const targetEndTime = initialEndTime || Date.now() + (15 + Math.random() * 30) * 1000
    setEndTime(targetEndTime)

    return () => {
      clearTimeout(showTimeout)
    }
  }, [enabled, initialEndTime, isClosed])

  // Track if we're using simulated time
  const isSimulated = !initialEndTime

  // Real-time countdown
  useEffect(() => {
    if (!endTime || isClosed) return

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      setTimeLeft(remaining)
      setIsUrgent(remaining <= 60)

      // Reset timer when it reaches 0 to maintain urgency (only for simulated timers)
      if (remaining === 0 && isSimulated) {
        setTimeout(() => {
          setEndTime(Date.now() + (15 + Math.random() * 30) * 1000)
        }, 2000)
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, isClosed, isSimulated])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!enabled || !isVisible || isClosed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className={`
          relative overflow-hidden
          bg-bg-secondary/95 backdrop-blur-xl
          border border-white/10
          clip-angle-lg
          p-4 min-w-[280px]
          ${isUrgent ? 'border-neon-pink/50 animate-pulse-border' : ''}
        `}>
          {/* Urgent glow effect */}
          {isUrgent && (
            <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 animate-pulse" />
          )}

          <div className="relative">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors z-10"
              aria-label="Fermer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pr-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute h-full w-full rounded-full opacity-75 ${isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                  <span className={`relative rounded-full h-2 w-2 ${isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  En cours
                </span>
              </div>
              {isUrgent && (
                <span className="px-2 py-0.5 bg-neon-pink/20 text-neon-pink text-xs font-bold rounded">
                  FINALE
                </span>
              )}
            </div>

            {/* Item name */}
            <p className="text-sm text-white/80 mb-2 truncate">{itemName}</p>

            {/* Timer */}
            <div className={`
              text-4xl font-black font-mono tracking-wider mb-4
              ${isUrgent ? 'text-neon-pink animate-pulse' : 'text-neon-blue'}
            `}>
              {formatTime(timeLeft)}
            </div>

            {/* CTA Button */}
            <Link
              href={gameId ? `/game/${gameId}` : '/lobby'}
              className={`
                block w-full text-center py-3 font-bold text-sm uppercase tracking-wider
                transition-all duration-300
                ${isUrgent
                  ? 'bg-gradient-to-r from-neon-pink to-neon-purple hover:shadow-[0_0_30px_rgba(255,79,216,0.5)]'
                  : 'bg-gradient-to-r from-neon-purple to-neon-blue hover:shadow-[0_0_30px_rgba(155,92,255,0.5)]'
                }
                clip-angle-sm
              `}
            >
              {isUrgent ? 'PARTICIPER VITE!' : 'PARTICIPER'}
            </Link>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              className={`h-full ${isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: timeLeft, ease: 'linear' }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
