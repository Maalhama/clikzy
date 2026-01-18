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
  purple: 'bg-neon-purple',
  blue: 'bg-neon-blue',
  pink: 'bg-neon-pink',
  gradient: 'bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink',
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
      <div
        ref={progressRef}
        className={`h-full ${colorStyles[color]} shadow-lg`}
        style={{
          width: '0%',
          boxShadow:
            color === 'gradient'
              ? '0 0 10px rgba(155, 92, 255, 0.5)'
              : undefined,
        }}
      />
      {showPercentage && (
        <div
          className="absolute right-2 text-xs font-mono text-text-secondary"
          style={{ top: position === 'top' ? height + 4 : 'auto', bottom: position === 'bottom' ? height + 4 : 'auto' }}
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

  useEffect(() => {
    if (!indicatorRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(indicatorRef.current, {
        y: 10,
        duration: 1,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
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
      className={`cursor-pointer flex flex-col items-center gap-2 ${className}`}
    >
      <span className="text-xs text-text-secondary uppercase tracking-wider">Scroll</span>
      <div className="w-6 h-10 rounded-full border-2 border-text-secondary/30 flex justify-center pt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-bounce" />
      </div>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-text-secondary/50"
      >
        <path
          d="M12 5V19M12 19L5 12M12 19L19 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
