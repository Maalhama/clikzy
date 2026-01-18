'use client'

import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'
import { formatTime, calculateTimeLeft } from '@/lib/utils/timer'
import { GAME_CONSTANTS } from '@/lib/utils/constants'

interface LiveTimerProps {
  endTime: number | string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  onEnd?: () => void
  className?: string
}

const sizeStyles = {
  sm: 'text-2xl md:text-3xl',
  md: 'text-4xl md:text-5xl',
  lg: 'text-5xl md:text-6xl',
  xl: 'text-6xl md:text-8xl',
}

export function LiveTimer({
  endTime,
  size = 'lg',
  showLabel = true,
  onEnd,
  className = '',
}: LiveTimerProps) {
  const timerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endTime))

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endTime)
      setTimeLeft(newTimeLeft)

      if (newTimeLeft <= 0) {
        clearInterval(interval)
        onEnd?.()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [endTime, onEnd])

  // Urgency animations
  useGSAP(
    () => {
      if (!containerRef.current || !timerRef.current) return

      const ctx = gsap.context(() => {
        // Critical phase animation (< 5 seconds)
        if (timeLeft <= 5000 && timeLeft > 0) {
          gsap.to(timerRef.current, {
            scale: 1.1,
            duration: 0.25,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true,
          })
          gsap.to(containerRef.current, {
            x: 3,
            duration: 0.05,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
          })
        }
        // Warning phase (< 30 seconds)
        else if (timeLeft <= 30000 && timeLeft > 5000) {
          gsap.to(timerRef.current, {
            scale: 1.02,
            duration: 0.5,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
          })
        }
        // Final phase (< 1 minute)
        else if (timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD && timeLeft > 30000) {
          gsap.to(timerRef.current, {
            scale: 1.01,
            duration: 1,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
          })
        }
      }, containerRef)

      return () => ctx.revert()
    },
    { scope: containerRef, dependencies: [timeLeft] }
  )

  const isUrgent = timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD && timeLeft > 0
  const isWarning = timeLeft <= 30000 && timeLeft > 5000
  const isCritical = timeLeft <= 5000 && timeLeft > 0
  const isEnded = timeLeft <= 0

  const getTimerStyles = () => {
    if (isEnded) return { className: 'text-text-secondary', shadow: 'none' }
    if (isCritical) return { className: 'text-danger', shadow: '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)' }
    if (isWarning) return { className: 'text-warning', shadow: '0 0 20px rgba(234, 179, 8, 0.6)' }
    if (isUrgent) return { className: 'text-danger animate-pulse', shadow: '0 0 25px rgba(239, 68, 68, 0.6)' }
    return { className: 'text-neon-blue', shadow: '0 0 20px rgba(60, 203, 255, 0.5)' }
  }

  const getLabel = () => {
    if (isEnded) return 'Terminé'
    if (isCritical) return 'Dernières secondes !'
    if (isUrgent) return 'Phase finale !'
    return 'Temps restant'
  }

  return (
    <div ref={containerRef} className={`text-center ${className}`}>
      {showLabel && (
        <div
          className={`text-xs uppercase tracking-wider mb-2 transition-colors ${
            isUrgent ? 'text-danger animate-pulse' : 'text-text-secondary'
          }`}
        >
          {getLabel()}
        </div>
      )}
      <div
        ref={timerRef}
        className={`font-mono font-bold transition-all ${sizeStyles[size]} ${getTimerStyles().className}`}
        style={{ textShadow: getTimerStyles().shadow }}
      >
        {formatTime(timeLeft)}
      </div>
      {isUrgent && !isEnded && (
        <div className="mt-2 text-xs text-danger animate-pulse">
          Chaque clic remet le timer !
        </div>
      )}
    </div>
  )
}
