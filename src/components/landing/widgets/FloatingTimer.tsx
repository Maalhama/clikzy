'use client'

import { useState, useEffect } from 'react'
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
  const [isUrgent, setIsUrgent] = useState(false)

  // Simulate a game timer if no real data
  useEffect(() => {
    if (!enabled) return

    // Show after 3 seconds scroll or immediately if game exists
    const showTimeout = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    // Simulate timer (5-15 minutes)
    const simulatedEndTime = initialEndTime || Date.now() + (5 + Math.random() * 10) * 60 * 1000

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((simulatedEndTime - now) / 1000))
      setTimeLeft(remaining)
      setIsUrgent(remaining <= 60)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => {
      clearTimeout(showTimeout)
      clearInterval(interval)
    }
  }, [enabled, initialEndTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!enabled || !isVisible) return null

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
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute h-full w-full rounded-full opacity-75 ${isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                  <span className={`relative rounded-full h-2 w-2 ${isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Partie en cours
                </span>
              </div>
              {isUrgent && (
                <span className="px-2 py-0.5 bg-neon-pink/20 text-neon-pink text-xs font-bold rounded">
                  PHASE FINALE
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
              {isUrgent ? 'REJOINDRE VITE!' : 'REJOINDRE LA PARTIE'}
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
