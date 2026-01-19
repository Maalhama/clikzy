'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface TodayWinsCounterProps {
  className?: string
  initialCount?: number
}

export function TodayWinsCounter({ className = '', initialCount = 12 }: TodayWinsCounterProps) {
  const [count, setCount] = useState(initialCount)
  const [displayCount, setDisplayCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const hasAnimated = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Animate count on first view
  useEffect(() => {
    if (hasAnimated.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          animateCount(0, count)
        }
      },
      { threshold: 0.5 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [count])

  // Animate count up
  const animateCount = (from: number, to: number) => {
    const duration = 2000
    const steps = 60
    const increment = (to - from) / steps
    let current = from
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      setDisplayCount(Math.round(current))

      if (step >= steps) {
        clearInterval(timer)
        setDisplayCount(to)
      }
    }, duration / steps)
  }

  // Simulate occasional new win
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to add a win (roughly every 3-5 minutes on average)
      if (Math.random() < 0.3) {
        setIsAnimating(true)
        setCount(prev => prev + 1)
        setDisplayCount(prev => prev + 1)

        setTimeout(() => setIsAnimating(false), 1000)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {/* Mobile version */}
      <div className="md:hidden">
        <motion.div
          animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-success/10 via-success/5 to-success/10 border-y border-success/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-sm">
            <motion.span
              key={displayCount}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-black text-success"
            >
              {displayCount}
            </motion.span>
            <span className="text-white/70"> lots gagnés aujourd'hui</span>
          </span>
          <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </motion.div>
      </div>

      {/* Desktop version */}
      <div className="hidden md:block">
        <motion.div
          animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4 py-4 bg-gradient-to-r from-transparent via-success/10 to-transparent border-y border-success/20"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
            </span>
            <span className="text-base">
              <motion.span
                key={displayCount}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-black text-2xl text-success"
                style={{ textShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}
              >
                {displayCount}
              </motion.span>
              <span className="text-white/70 ml-2">lots gagnés aujourd'hui</span>
            </span>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="flex items-center gap-2 text-white/50 text-sm">
            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>En direct</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
