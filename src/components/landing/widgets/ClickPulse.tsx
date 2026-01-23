'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PulsePoint {
  id: string
  x: number
  y: number
  color: 'purple' | 'blue' | 'pink'
}

interface ClickPulseProps {
  enabled?: boolean
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export function ClickPulse({
  enabled = true,
  intensity = 'medium',
  className = '',
}: ClickPulseProps) {
  const [pulses, setPulses] = useState<PulsePoint[]>([])
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const getIntervalRange = useCallback(() => {
    switch (intensity) {
      case 'low':
        return { min: 2000, max: 5000 }
      case 'medium':
        return { min: 800, max: 2500 }
      case 'high':
        return { min: 300, max: 1000 }
    }
  }, [intensity])

  const addPulse = useCallback(() => {
    const colors: PulsePoint['color'][] = ['purple', 'blue', 'pink']
    const newPulse: PulsePoint = {
      id: Math.random().toString(36).substring(7),
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }

    setPulses(prev => [...prev, newPulse])

    // Remove after animation
    setTimeout(() => {
      setPulses(prev => prev.filter(p => p.id !== newPulse.id))
    }, 2000)
  }, [])

  useEffect(() => {
    // Disable on mobile for performance
    if (!enabled || isMobile) return

    const { min, max } = getIntervalRange()

    const scheduleNext = () => {
      const delay = min + Math.random() * (max - min)
      return setTimeout(() => {
        addPulse()
        scheduleNext()
      }, delay)
    }

    // Initial pulses (reduced from 3 to 1)
    setTimeout(addPulse, 500)

    const timeout = scheduleNext()

    return () => clearTimeout(timeout)
  }, [enabled, addPulse, isMobile, getIntervalRange])

  const getColorStyles = (color: PulsePoint['color']) => {
    switch (color) {
      case 'purple':
        return { bg: 'bg-neon-purple', shadow: '0 0 20px rgba(155, 92, 255, 0.8)' }
      case 'blue':
        return { bg: 'bg-neon-blue', shadow: '0 0 20px rgba(60, 203, 255, 0.8)' }
      case 'pink':
        return { bg: 'bg-neon-pink', shadow: '0 0 20px rgba(255, 79, 216, 0.8)' }
    }
  }

  // Don't render on mobile for performance
  if (!enabled || isMobile) return null

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <AnimatePresence>
        {pulses.map((pulse) => (
          <motion.div
            key={pulse.id}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute"
            style={{
              left: `${pulse.x}%`,
              top: `${pulse.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`w-8 h-8 rounded-full ${getColorStyles(pulse.color).bg} blur-sm`}
              style={{ boxShadow: getColorStyles(pulse.color).shadow }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Activity indicator */}
      <div
        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-bg-secondary/80 backdrop-blur-sm rounded-full border border-neon-purple/30"
        style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.2)' }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute h-full w-full rounded-full bg-neon-purple opacity-75"
            style={{ boxShadow: '0 0 10px rgba(155, 92, 255, 0.8)' }}
          />
          <span
            className="relative rounded-full h-2 w-2 bg-neon-purple"
            style={{ boxShadow: '0 0 8px rgba(155, 92, 255, 0.6)' }}
          />
        </span>
        <span className="text-xs text-neon-purple/80 font-medium">
          {intensity === 'high' ? 'Tres actif' : intensity === 'medium' ? 'Actif' : 'Normal'}
        </span>
      </div>
    </div>
  )
}
