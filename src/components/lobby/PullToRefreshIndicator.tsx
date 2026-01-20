'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
}

export const PullToRefreshIndicator = memo(function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) return null

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 360

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{
        paddingTop: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
      }}
    >
      <div
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-full
          bg-bg-secondary/95 backdrop-blur-sm
          border border-neon-purple/30
          shadow-[0_0_20px_rgba(155,92,255,0.3)]
          transition-transform duration-200
        `}
        style={{
          transform: `translateY(-50%) scale(${0.5 + progress * 0.5})`,
        }}
      >
        {isRefreshing ? (
          // Spinning loader
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <svg
              className="w-5 h-5 text-neon-purple"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </motion.div>
        ) : (
          // Arrow that rotates based on pull progress
          <motion.div
            style={{ rotate: rotation }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                progress >= 1 ? 'text-neon-pink' : 'text-neon-purple'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Text indicator */}
      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: progress >= 0.3 ? 1 : 0, y: 0 }}
        className="absolute top-full mt-2 text-xs font-medium text-white/60"
      >
        {isRefreshing
          ? 'Chargement...'
          : progress >= 1
          ? 'Relache pour rafraichir'
          : 'Tire vers le bas'}
      </motion.span>
    </motion.div>
  )
})
