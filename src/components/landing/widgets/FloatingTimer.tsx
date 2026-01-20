'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSounds } from '@/hooks/useSounds'

// Fake products for non-logged-in users (urgency marketing)
const FAKE_PRODUCTS = [
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

// Threshold for showing timer to logged-in users (10 minutes)
const LOGGED_IN_THRESHOLD = 10 * 60 * 1000 // 10 minutes in ms

interface FloatingTimerProps {
  isLoggedIn?: boolean
  gameId?: string
  initialEndTime?: number
  itemName?: string
  enabled?: boolean
}

export function FloatingTimer({
  isLoggedIn = false,
  gameId,
  initialEndTime,
  itemName,
  enabled = true,
}: FloatingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isCritical, setIsCritical] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [currentProduct, setCurrentProduct] = useState(itemName || FAKE_PRODUCTS[0])
  const [currentGameId, setCurrentGameId] = useState<string | undefined>(gameId)
  const productIndexRef = useRef(0)
  const isWaitingRef = useRef(false)

  // Sounds
  const { playHeartbeat, stopAll: stopSounds } = useSounds(enabled && isVisible)

  // Heartbeat effect when under 3 seconds
  const shouldPlayHeartbeat = timeLeft <= 3 && timeLeft > 0 && isVisible && !isClosed
  useEffect(() => {
    if (shouldPlayHeartbeat) {
      playHeartbeat()
    } else {
      stopSounds()
    }
    return () => stopSounds()
  }, [shouldPlayHeartbeat, playHeartbeat, stopSounds])

  // Close handler
  const handleClose = useCallback(() => {
    setIsClosed(true)
  }, [])

  // Get next random fake product
  const getNextFakeProduct = useCallback(() => {
    let newIndex
    do {
      newIndex = Math.floor(Math.random() * FAKE_PRODUCTS.length)
    } while (newIndex === productIndexRef.current && FAKE_PRODUCTS.length > 1)
    productIndexRef.current = newIndex
    return FAKE_PRODUCTS[newIndex]
  }, [])

  // Track previous game ID to detect changes
  const prevGameIdRef = useRef<string | undefined>(undefined)
  // Track previous end time to detect timer resets from clicks
  const prevEndTimeRef = useRef<number | undefined>(undefined)

  // Initialize timer on mount and update when game changes OR timer resets
  useEffect(() => {
    if (!enabled || isClosed) return

    const now = Date.now()

    if (isLoggedIn) {
      // LOGGED IN: Show for any active game (the one ending soonest)
      if (initialEndTime && initialEndTime > now) {
        // Check if this is a new game
        const isNewGame = gameId !== prevGameIdRef.current
        prevGameIdRef.current = gameId

        // Check if timer was reset (click happened) - new end time is later than current
        const wasTimerReset = prevEndTimeRef.current &&
          initialEndTime > prevEndTimeRef.current + 1000 // Buffer of 1 second to avoid false positives
        prevEndTimeRef.current = initialEndTime

        if (isNewGame || !isVisible || wasTimerReset) {
          // Reset waiting state for new game or timer reset
          isWaitingRef.current = false
          setIsEnding(false)
          setEndTime(initialEndTime)
          setCurrentProduct(itemName || 'Produit en cours')
          setCurrentGameId(gameId)

          // Small delay before showing to allow smooth transition
          if (!isVisible) {
            const showTimeout = setTimeout(() => {
              setIsVisible(true)
            }, isNewGame ? 500 : 2000)
            return () => clearTimeout(showTimeout)
          }
        }
      } else {
        // No valid game within threshold, hide popup
        if (isVisible && !isWaitingRef.current) {
          setIsVisible(false)
        }
      }
    } else {
      // NOT LOGGED IN: Show fake urgency timer (with initial delay)
      if (!isVisible && !isWaitingRef.current) {
        const showTimeout = setTimeout(() => {
          setIsVisible(true)
          setEndTime(Date.now() + (15 + Math.random() * 30) * 1000) // 15-45 seconds
          setCurrentProduct(getNextFakeProduct())
          setCurrentGameId(undefined) // No real game ID for fake timers
        }, 2000)
        return () => clearTimeout(showTimeout)
      }
    }
  }, [enabled, isLoggedIn, initialEndTime, itemName, gameId, isClosed, isVisible, getNextFakeProduct])

  // Real-time countdown
  useEffect(() => {
    if (!endTime || isClosed || !isVisible || isWaitingRef.current) return

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      setTimeLeft(remaining)
      setIsUrgent(remaining <= 60)
      setIsCritical(remaining <= 3 && remaining > 0)

      // Handle timer reaching 0
      if (remaining === 0 && !isWaitingRef.current) {
        isWaitingRef.current = true
        setIsEnding(true)

        setTimeout(() => {
          setIsVisible(false)
          setIsEnding(false)
          setIsCritical(false)

          // Only restart for non-logged-in users (fake urgency)
          if (!isLoggedIn) {
            setTimeout(() => {
              isWaitingRef.current = false
              setCurrentProduct(getNextFakeProduct())
              setEndTime(Date.now() + (15 + Math.random() * 30) * 1000)
              setCurrentGameId(undefined)
              setIsVisible(true)
            }, 120000) // 2 minutes cooldown
          }
        }, 500)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endTime, isClosed, isLoggedIn, isVisible, getNextFakeProduct])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!enabled || !isVisible || isClosed) return null

  // CTA link: real game for logged-in, register for non-logged-in
  const ctaLink = isLoggedIn
    ? (currentGameId ? `/game/${currentGameId}` : '/lobby')
    : '/register'

  // CTA text based on state and login status
  const getCTAText = () => {
    if (!isLoggedIn) {
      return isCritical ? 'INSCRIS-TOI!' : isUrgent ? 'REJOINDRE' : 'PARTICIPER'
    }
    return isCritical ? 'CLIQUE MAINTENANT!' : isUrgent ? 'PARTICIPER VITE!' : 'PARTICIPER'
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentProduct}
        initial={{ opacity: 0, x: 300 }}
        animate={isEnding ? {
          opacity: 0,
          x: 300,
        } : {
          opacity: 1,
          x: 0,
          scale: isCritical ? [1, 1.02, 1] : 1,
        }}
        exit={{ opacity: 0, x: 300 }}
        transition={isEnding ? {
          duration: 0.4,
          ease: 'easeIn',
        } : isCritical ? {
          scale: {
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          x: { type: 'spring', stiffness: 400, damping: 25 },
        } : {
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        className="fixed bottom-3 md:bottom-6 right-2 md:right-6 z-50"
      >
        {/* MOBILE VERSION */}
        <div className="md:hidden">
          <div
            className={`
              relative overflow-hidden
              bg-bg-secondary/95
              border rounded-lg
              p-2 min-w-[120px]
              ${isCritical ? 'border-red-500/60' : isUrgent ? 'border-neon-pink/40' : 'border-white/10'}
            `}
          >
            <button
              onClick={handleClose}
              className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 text-white/40 z-10"
              aria-label="Fermer"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative pr-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-500' : 'bg-neon-purple'}`} />
                  <span className={`relative rounded-full h-1.5 w-1.5 ${isCritical ? 'bg-red-500' : 'bg-neon-purple'}`} />
                </span>
                <span className="text-[9px] font-bold uppercase text-white/50">
                  {isLoggedIn ? 'Live' : 'Urgent'}
                </span>
              </div>

              <p className="text-[10px] text-white/60 truncate max-w-[100px] mb-1">{currentProduct}</p>

              <div
                className={`text-xl font-black font-mono ${isCritical ? 'text-red-500' : isUrgent ? 'text-neon-pink' : 'text-neon-blue'}`}
              >
                {formatTime(timeLeft)}
              </div>

              <Link
                href={ctaLink}
                className={`
                  block w-full text-center py-1.5 mt-1.5 font-bold text-[10px] uppercase rounded
                  ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}
                `}
              >
                GO
              </Link>
            </div>
          </div>
        </div>

        {/* DESKTOP VERSION */}
        <div className="hidden md:block">
          <div
            className={`
              relative overflow-hidden
              bg-bg-secondary/95 backdrop-blur-xl
              border rounded-xl
              p-4 min-w-[280px]
              transition-all duration-300
              ${isCritical ? 'border-red-500/80' : isUrgent ? 'border-neon-pink/50' : 'border-white/10'}
            `}
            style={{
              boxShadow: isCritical
                ? '0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.3)'
                : isUrgent
                  ? '0 0 20px rgba(255, 79, 216, 0.3)'
                  : 'none',
            }}
          >
            {isUrgent && !isCritical && (
              <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 animate-pulse rounded-xl" />
            )}

            <div className="relative">
              <button
                onClick={handleClose}
                className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors z-10"
                aria-label="Fermer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center justify-between mb-3 pr-6">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                    <span className={`relative rounded-full h-2 w-2 ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                    {isLoggedIn ? 'En cours' : 'Se termine bientot'}
                  </span>
                </div>
                {isCritical ? (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded">DERNIERS INSTANTS!</span>
                ) : isUrgent && (
                  <span className="px-2 py-0.5 bg-neon-pink/20 text-neon-pink text-xs font-bold rounded">FINALE</span>
                )}
              </div>

              <p className="text-sm text-white/80 mb-2 truncate">{currentProduct}</p>

              <div
                className={`text-4xl font-black font-mono tracking-wider mb-4 ${isCritical ? 'text-red-500' : isUrgent ? 'text-neon-pink' : 'text-neon-blue'}`}
              >
                {formatTime(timeLeft)}
              </div>

              <Link
                href={ctaLink}
                className={`
                  block w-full text-center py-3 font-bold text-sm uppercase tracking-wider
                  transition-all duration-300 rounded-lg
                  ${isCritical
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : isUrgent
                      ? 'bg-gradient-to-r from-neon-pink to-neon-purple'
                      : 'bg-gradient-to-r from-neon-purple to-neon-blue'
                  }
                `}
              >
                {getCTAText()}
              </Link>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden">
              <motion.div
                className={`h-full ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-purple'}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: timeLeft, ease: 'linear' }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
