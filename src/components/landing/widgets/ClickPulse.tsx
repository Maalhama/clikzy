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

  const getIntervalRange = () => {
    switch (intensity) {
      case 'low':
        return { min: 2000, max: 5000 }
      case 'medium':
        return { min: 800, max: 2500 }
      case 'high':
        return { min: 300, max: 1000 }
    }
  }

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
    if (!enabled) return

    const { min, max } = getIntervalRange()

    const scheduleNext = () => {
      const delay = min + Math.random() * (max - min)
      return setTimeout(() => {
        addPulse()
        scheduleNext()
      }, delay)
    }

    // Initial pulses
    for (let i = 0; i < 3; i++) {
      setTimeout(addPulse, i * 500)
    }

    const timeout = scheduleNext()

    return () => clearTimeout(timeout)
  }, [enabled, intensity, addPulse])

  const getColorClass = (color: PulsePoint['color']) => {
    switch (color) {
      case 'purple':
        return 'bg-neon-purple'
      case 'blue':
        return 'bg-neon-blue'
      case 'pink':
        return 'bg-neon-pink'
    }
  }

  if (!enabled) return null

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
            <div className={`w-8 h-8 rounded-full ${getColorClass(pulse.color)} blur-sm`} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Activity indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-bg-secondary/80 backdrop-blur-sm rounded-full border border-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute h-full w-full rounded-full bg-neon-purple opacity-75" />
          <span className="relative rounded-full h-2 w-2 bg-neon-purple" />
        </span>
        <span className="text-xs text-white/60">
          {intensity === 'high' ? 'Tres actif' : intensity === 'medium' ? 'Actif' : 'Normal'}
        </span>
      </div>
    </div>
  )
}
