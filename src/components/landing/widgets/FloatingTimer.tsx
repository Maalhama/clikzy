'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Variety of products to display
const PRODUCT_NAMES = [
  'iPhone 15 Pro',
  'PlayStation 5',
  'MacBook Air M3',
  'Nintendo Switch OLED',
  'AirPods Pro 2',
  'Apple Watch Ultra',
  'Samsung Galaxy S24',
  'Xbox Series X',
  'iPad Pro 12.9"',
  'Meta Quest 3',
  'Sony WH-1000XM5',
  'DJI Mini 4 Pro',
]

interface FloatingTimerProps {
  gameId?: string
  initialEndTime?: number
  itemName?: string
  enabled?: boolean
}

export function FloatingTimer({
  gameId,
  initialEndTime,
  itemName,
  enabled = true,
}: FloatingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isCritical, setIsCritical] = useState(false) // For heartbeat at <= 3s
  const [isEnding, setIsEnding] = useState(false) // For exit animation
  const [endTime, setEndTime] = useState<number | null>(null)
  const [currentProduct, setCurrentProduct] = useState(itemName || PRODUCT_NAMES[0])
  const productIndexRef = useRef(0)

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

  // Get next random product (different from current)
  const getNextProduct = useCallback(() => {
    let newIndex
    do {
      newIndex = Math.floor(Math.random() * PRODUCT_NAMES.length)
    } while (newIndex === productIndexRef.current && PRODUCT_NAMES.length > 1)
    productIndexRef.current = newIndex
    return PRODUCT_NAMES[newIndex]
  }, [])

  // Real-time countdown
  useEffect(() => {
    if (!endTime || isClosed) return

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      setTimeLeft(remaining)
      setIsUrgent(remaining <= 60)
      setIsCritical(remaining <= 3 && remaining > 0)

      // Handle timer reaching 0
      if (remaining === 0 && isSimulated && !isEnding) {
        setIsEnding(true)

        // After exit animation, reset with new product
        setTimeout(() => {
          setIsEnding(false)
          setIsCritical(false)
          setCurrentProduct(getNextProduct())
          setEndTime(Date.now() + (15 + Math.random() * 30) * 1000)
        }, 1500)
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, isClosed, isSimulated, isEnding, getNextProduct])

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
    <AnimatePresence mode="wait">
      <motion.div
        key={currentProduct}
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={isEnding ? {
          opacity: 0,
          scale: 1.1,
          y: -20,
          filter: 'blur(10px)',
        } : {
          opacity: 1,
          y: 0,
          scale: isCritical ? [1, 1.02, 1] : 1,
        }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={isCritical ? {
          scale: {
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        } : {
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div
          className={`
            relative overflow-hidden
            bg-bg-secondary/95 backdrop-blur-xl
            border rounded-xl
            p-4 min-w-[280px]
            transition-all duration-300
            ${isCritical
              ? 'border-red-500/80'
              : isUrgent
                ? 'border-neon-pink/50'
                : 'border-white/10'
            }
          `}
          style={{
            boxShadow: isCritical
              ? '0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.3), inset 0 0 30px rgba(239, 68, 68, 0.1)'
              : isUrgent
                ? '0 0 20px rgba(255, 79, 216, 0.3)'
                : 'none',
            animation: isCritical ? 'heartbeat 0.5s ease-in-out infinite' : 'none',
          }}
        >
          {/* Critical heartbeat glow overlay */}
          {isCritical && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                animation: 'pulse 0.5s ease-in-out infinite',
              }}
            />
          )}

          {/* Urgent glow effect */}
          {isUrgent && !isCritical && (
            <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 animate-pulse rounded-xl" />
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
                  <span className={`animate-ping absolute h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                  <span className={`relative rounded-full h-2 w-2 ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  En cours
                </span>
              </div>
              {isCritical ? (
                <span
                  className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded"
                  style={{ animation: 'pulse 0.5s ease-in-out infinite' }}
                >
                  DERNIERS INSTANTS!
                </span>
              ) : isUrgent && (
                <span className="px-2 py-0.5 bg-neon-pink/20 text-neon-pink text-xs font-bold rounded">
                  FINALE
                </span>
              )}
            </div>

            {/* Item name */}
            <p className="text-sm text-white/80 mb-2 truncate">{currentProduct}</p>

            {/* Timer */}
            <div
              className={`
                text-4xl font-black font-mono tracking-wider mb-4
                ${isCritical ? 'text-red-500' : isUrgent ? 'text-neon-pink' : 'text-neon-blue'}
              `}
              style={{
                textShadow: isCritical
                  ? '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.5)'
                  : isUrgent
                    ? '0 0 15px rgba(255, 79, 216, 0.5)'
                    : 'none',
                animation: isCritical ? 'pulse 0.5s ease-in-out infinite' : 'none',
              }}
            >
              {formatTime(timeLeft)}
            </div>

            {/* CTA Button */}
            <Link
              href={gameId ? `/game/${gameId}` : '/lobby'}
              className={`
                block w-full text-center py-3 font-bold text-sm uppercase tracking-wider
                transition-all duration-300 rounded-lg
                ${isCritical
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]'
                  : isUrgent
                    ? 'bg-gradient-to-r from-neon-pink to-neon-purple hover:shadow-[0_0_30px_rgba(255,79,216,0.5)]'
                    : 'bg-gradient-to-r from-neon-purple to-neon-blue hover:shadow-[0_0_30px_rgba(155,92,255,0.5)]'
                }
              `}
              style={{
                animation: isCritical ? 'pulse 0.5s ease-in-out infinite' : 'none',
              }}
            >
              {isCritical ? 'CLIQUE MAINTENANT!' : isUrgent ? 'PARTICIPER VITE!' : 'PARTICIPER'}
            </Link>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden">
            <motion.div
              className={`h-full ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: timeLeft, ease: 'linear' }}
              style={{
                boxShadow: isCritical ? '0 0 10px rgba(239, 68, 68, 0.8)' : 'none',
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
