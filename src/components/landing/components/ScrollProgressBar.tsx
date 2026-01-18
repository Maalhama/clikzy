'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from '@/lib/gsap/gsapConfig'

interface ScrollProgressBarProps {
  color?: 'purple' | 'blue' | 'pink' | 'gradient'
  height?: number
  position?: 'top' | 'bottom'
  showPercentage?: boolean
  className?: string
}

const colorStyles = {
  purple: {
    bg: 'bg-neon-purple',
    shadow: '0 0 15px rgba(155, 92, 255, 0.6), 0 0 30px rgba(155, 92, 255, 0.3)',
    text: 'text-neon-purple',
  },
  blue: {
    bg: 'bg-neon-blue',
    shadow: '0 0 15px rgba(60, 203, 255, 0.6), 0 0 30px rgba(60, 203, 255, 0.3)',
    text: 'text-neon-blue',
  },
  pink: {
    bg: 'bg-neon-pink',
    shadow: '0 0 15px rgba(255, 79, 216, 0.6), 0 0 30px rgba(255, 79, 216, 0.3)',
    text: 'text-neon-pink',
  },
  gradient: {
    bg: 'bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink',
    shadow: '0 0 15px rgba(155, 92, 255, 0.5), 0 0 30px rgba(60, 203, 255, 0.3)',
    text: 'text-neon-purple',
  },
}

export function ScrollProgressBar({
  color = 'gradient',
  height = 3,
  position = 'top',
  showPercentage = false,
  className = '',
}: ScrollProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  const colors = colorStyles[color]

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const newProgress = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0

      setProgress(newProgress)

      if (progressRef.current) {
        gsap.to(progressRef.current, {
          width: `${newProgress}%`,
          duration: 0.1,
          ease: 'none',
        })
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div
      className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 ${className}`}
      style={{ height }}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-bg-secondary/50 backdrop-blur-sm" />

      {/* Progress bar with glow */}
      <div
        ref={progressRef}
        className={`relative h-full ${colors.bg}`}
        style={{
          width: '0%',
          boxShadow: colors.shadow,
        }}
      />

      {/* Percentage indicator */}
      {showPercentage && progress > 0 && (
        <div
          className={`absolute right-3 px-2 py-0.5 rounded-full bg-bg-secondary/80 backdrop-blur-sm border border-white/10 text-xs font-mono ${colors.text}`}
          style={{
            top: position === 'top' ? height + 8 : 'auto',
            bottom: position === 'bottom' ? height + 8 : 'auto',
            textShadow: colors.shadow.split(',')[0],
          }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )
}

// Scroll indicator arrow
interface ScrollIndicatorProps {
  targetId?: string
  className?: string
}

export function ScrollIndicator({ targetId, className = '' }: ScrollIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!indicatorRef.current) return

    const ctx = gsap.context(() => {
      // Floating animation
      gsap.to(indicatorRef.current, {
        y: 8,
        duration: 1.5,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })

      // Dot glow pulse
      if (dotRef.current) {
        gsap.to(dotRef.current, {
          boxShadow: '0 0 15px rgba(155, 92, 255, 0.8), 0 0 25px rgba(155, 92, 255, 0.4)',
          scale: 1.3,
          duration: 0.8,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
        })
      }
    }, indicatorRef)

    return () => ctx.revert()
  }, [])

  const handleClick = () => {
    if (targetId) {
      const element = document.getElementById(targetId)
      element?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div
      ref={indicatorRef}
      onClick={handleClick}
      className={`cursor-pointer flex flex-col items-center gap-2 group ${className}`}
    >
      <span
        className="text-xs text-text-secondary uppercase tracking-widest group-hover:text-neon-purple transition-colors duration-300"
        style={{ letterSpacing: '0.2em' }}
      >
        Scroll
      </span>

      {/* Mouse icon with neon glow */}
      <div
        className="w-7 h-11 rounded-full border-2 border-neon-purple/40 flex justify-center pt-2.5 group-hover:border-neon-purple/70 transition-all duration-300"
        style={{
          boxShadow: '0 0 10px rgba(155, 92, 255, 0.2), inset 0 0 10px rgba(155, 92, 255, 0.05)',
        }}
      >
        <div
          ref={dotRef}
          className="w-1.5 h-3 rounded-full bg-neon-purple"
          style={{
            boxShadow: '0 0 8px rgba(155, 92, 255, 0.6)',
          }}
        />
      </div>

      {/* Arrow with glow */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="text-neon-purple/50 group-hover:text-neon-purple transition-colors duration-300"
        style={{
          filter: 'drop-shadow(0 0 4px rgba(155, 92, 255, 0.5))',
        }}
      >
        <path
          d="M12 5V19M12 19L6 13M12 19L18 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
