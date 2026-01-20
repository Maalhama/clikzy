'use client'

import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'
import { useIsMobile } from '@/hooks/useIsMobile'

interface PlayerCounterProps {
  count: number
  label?: string
  showDot?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-5 py-2.5',
}

export function PlayerCounter({
  count,
  label = 'joueurs en ligne',
  showDot = true,
  size = 'md',
  className = '',
}: PlayerCounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [displayCount, setDisplayCount] = useState(count)
  const isMobile = useIsMobile()

  // Animate count changes
  useEffect(() => {
    if (!counterRef.current) return

    const obj = { value: displayCount }
    gsap.to(obj, {
      value: count,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayCount(Math.round(obj.value))
      },
    })
  }, [count, displayCount])

  // Pulsing dot animation with glow - disabled on mobile
  useGSAP(
    () => {
      if (!dotRef.current || isMobile) return

      gsap.to(dotRef.current, {
        scale: 1.8,
        opacity: 0.3,
        duration: 1.2,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
    },
    { scope: dotRef, dependencies: [isMobile] }
  )

  // Subtle container glow pulse - disabled on mobile
  useGSAP(
    () => {
      if (!containerRef.current || isMobile) return

      gsap.to(containerRef.current, {
        boxShadow: '0 0 20px rgba(0, 255, 136, 0.3), inset 0 0 15px rgba(0, 255, 136, 0.05)',
        duration: 2,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
    },
    { scope: containerRef, dependencies: [isMobile] }
  )

  return (
    <div
      ref={containerRef}
      className={`group inline-flex items-center gap-2 bg-bg-secondary/80 border border-success/40 rounded-full backdrop-blur-sm transition-all duration-300 hover:border-success/60 ${sizeStyles[size]} ${className}`}
      style={{
        boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)',
      }}
    >
      {showDot && (
        <span className="relative flex h-2.5 w-2.5">
          {/* Outer glow ring */}
          <span
            ref={dotRef}
            className="absolute inline-flex h-full w-full rounded-full bg-success"
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
            }}
          />
          {/* Inner solid dot */}
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"
            style={{
              boxShadow: '0 0 6px rgba(0, 255, 136, 0.6)',
            }}
          />
        </span>
      )}
      <span
        className="text-success font-bold"
        style={{
          textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
        }}
      >
        <span ref={counterRef}>{displayCount.toLocaleString()}</span>
      </span>
      <span className="text-text-secondary uppercase text-xs tracking-wide">{label}</span>
    </div>
  )
}

// Click notification toast
interface ClickNotificationProps {
  username: string
  onComplete?: () => void
}

export function ClickNotification({ username, onComplete }: ClickNotificationProps) {
  const notifRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useGSAP(
    () => {
      if (!notifRef.current) return

      // Simplified animation on mobile
      if (isMobile) {
        gsap.set(notifRef.current, { opacity: 1 })
        gsap.to(notifRef.current, { opacity: 0, duration: 0.2, delay: 3, onComplete })
        return
      }

      const tl = gsap.timeline({
        onComplete,
      })

      tl.fromTo(
        notifRef.current,
        { y: 20, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
      ).to(
        notifRef.current,
        { y: -20, opacity: 0, duration: 0.3, delay: 2 },
        '+=2'
      )
    },
    { scope: notifRef, dependencies: [isMobile] }
  )

  return (
    <div
      ref={notifRef}
      className="flex items-center gap-2 px-4 py-2 bg-neon-purple/15 border border-neon-purple/50 rounded-full text-sm backdrop-blur-sm"
      style={{
        boxShadow: '0 0 20px rgba(155, 92, 255, 0.3), inset 0 0 15px rgba(155, 92, 255, 0.05)',
      }}
    >
      {/* Pulsing indicator */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75" />
        <span
          className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple"
          style={{ boxShadow: '0 0 8px rgba(155, 92, 255, 0.8)' }}
        />
      </span>
      <span
        className="text-neon-purple font-bold"
        style={{ textShadow: '0 0 10px rgba(155, 92, 255, 0.5)' }}
      >
        {username}
      </span>
      <span className="text-text-secondary">vient de cliquer !</span>
    </div>
  )
}

// Stats counter with count-up animation
interface StatsCounterProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
  duration?: number
  color?: 'purple' | 'blue' | 'pink' | 'success'
  className?: string
}

const colorStyles = {
  purple: {
    text: 'text-neon-purple',
    shadow: '0 0 20px rgba(155, 92, 255, 0.5)',
  },
  blue: {
    text: 'text-neon-blue',
    shadow: '0 0 20px rgba(60, 203, 255, 0.5)',
  },
  pink: {
    text: 'text-neon-pink',
    shadow: '0 0 20px rgba(255, 79, 216, 0.5)',
  },
  success: {
    text: 'text-success',
    shadow: '0 0 20px rgba(0, 255, 136, 0.5)',
  },
}

export function StatsCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  duration = 2,
  color = 'blue',
  className = '',
}: StatsCounterProps) {
  const valueRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const isMobile = useIsMobile()

  const colors = colorStyles[color]

  useGSAP(
    () => {
      if (!valueRef.current || !containerRef.current || hasAnimated) return

      // On mobile, show value instantly without animation
      if (isMobile) {
        if (valueRef.current) {
          valueRef.current.textContent = `${prefix}${Math.round(value).toLocaleString()}${suffix}`
        }
        setHasAnimated(true)
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              setHasAnimated(true)

              const obj = { value: 0 }
              gsap.to(obj, {
                value,
                duration,
                ease: 'power2.out',
                onUpdate: () => {
                  if (valueRef.current) {
                    valueRef.current.textContent = `${prefix}${Math.round(obj.value).toLocaleString()}${suffix}`
                  }
                },
              })
            }
          })
        },
        { threshold: 0.5 }
      )

      observer.observe(containerRef.current)

      return () => observer.disconnect()
    },
    { scope: containerRef, dependencies: [value, hasAnimated, isMobile] }
  )

  return (
    <div ref={containerRef} className={`text-center group ${className}`}>
      <div
        className={`text-3xl md:text-4xl font-black ${colors.text} transition-all duration-300`}
        style={{
          textShadow: colors.shadow,
        }}
      >
        <span ref={valueRef}>
          {prefix}0{suffix}
        </span>
      </div>
      <div className="text-sm text-text-secondary mt-2 uppercase tracking-wider">{label}</div>
    </div>
  )
}
