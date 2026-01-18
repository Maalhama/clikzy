'use client'

import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

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
  const [displayCount, setDisplayCount] = useState(count)

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

  // Pulsing dot animation
  useGSAP(
    () => {
      if (!dotRef.current) return

      gsap.to(dotRef.current, {
        scale: 1.5,
        opacity: 0.5,
        duration: 1,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
    },
    { scope: dotRef }
  )

  return (
    <div
      className={`inline-flex items-center gap-2 bg-bg-secondary/80 border border-neon-purple/30 rounded-full backdrop-blur-sm ${sizeStyles[size]} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          <span
            ref={dotRef}
            className="absolute inline-flex h-full w-full rounded-full bg-success"
          />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
      )}
      <span className="text-text-primary font-semibold">
        <span ref={counterRef}>{displayCount.toLocaleString()}</span>
      </span>
      <span className="text-text-secondary">{label}</span>
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

  useGSAP(
    () => {
      if (!notifRef.current) return

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
    { scope: notifRef }
  )

  return (
    <div
      ref={notifRef}
      className="flex items-center gap-2 px-3 py-1.5 bg-neon-purple/20 border border-neon-purple/50 rounded-full text-sm"
    >
      <span className="text-neon-purple">*</span>
      <span className="text-text-primary font-medium">{username}</span>
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
  className?: string
}

export function StatsCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
}: StatsCounterProps) {
  const valueRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useGSAP(
    () => {
      if (!valueRef.current || !containerRef.current || hasAnimated) return

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
    { scope: containerRef, dependencies: [value, hasAnimated] }
  )

  return (
    <div ref={containerRef} className={`text-center ${className}`}>
      <div className="text-3xl md:text-4xl font-bold text-neon-blue neon-text-blue">
        <span ref={valueRef}>
          {prefix}0{suffix}
        </span>
      </div>
      <div className="text-sm text-text-secondary mt-1">{label}</div>
    </div>
  )
}
