'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

interface StatItem {
  value: number
  label: string
  prefix?: string
  suffix?: string
  color: 'purple' | 'blue' | 'pink'
  icon: string
}

interface AnimatedStatsProps {
  totalWinnings?: number
  totalGames?: number
  playersOnline?: number
  className?: string
}

export function AnimatedStats({
  totalWinnings = 125000,
  totalGames = 1250,
  playersOnline = 42,
  className = '',
}: AnimatedStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [displayValues, setDisplayValues] = useState({
    winnings: 0,
    games: 0,
    players: 0,
  })

  const stats: StatItem[] = [
    {
      value: totalWinnings,
      label: 'Distribues',
      suffix: '€',
      color: 'purple',
      icon: '💰',
    },
    {
      value: totalGames,
      label: 'Parties jouees',
      suffix: '+',
      color: 'blue',
      icon: '🎮',
    },
    {
      value: playersOnline,
      label: 'Joueurs en ligne',
      color: 'pink',
      icon: '👥',
    },
  ]

  useGSAP(() => {
    if (!containerRef.current || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)

            // Animate numbers
            const duration = 2

            // Winnings
            gsap.to({ val: 0 }, {
              val: totalWinnings,
              duration,
              ease: 'power2.out',
              onUpdate: function() {
                setDisplayValues(prev => ({
                  ...prev,
                  winnings: Math.floor(this.targets()[0].val),
                }))
              },
            })

            // Games
            gsap.to({ val: 0 }, {
              val: totalGames,
              duration,
              ease: 'power2.out',
              onUpdate: function() {
                setDisplayValues(prev => ({
                  ...prev,
                  games: Math.floor(this.targets()[0].val),
                }))
              },
            })

            // Players
            gsap.to({ val: 0 }, {
              val: playersOnline,
              duration: 1,
              ease: 'power2.out',
              onUpdate: function() {
                setDisplayValues(prev => ({
                  ...prev,
                  players: Math.floor(this.targets()[0].val),
                }))
              },
            })

            // Animate cards
            gsap.from('.stat-card', {
              y: 40,
              opacity: 0,
              stagger: 0.15,
              duration: 0.6,
              ease: 'power3.out',
            })

            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, { scope: containerRef, dependencies: [hasAnimated, totalWinnings, totalGames, playersOnline] })

  const getColorClasses = (color: StatItem['color']) => {
    switch (color) {
      case 'purple':
        return {
          text: 'text-neon-purple',
          border: 'border-neon-purple/30',
          glow: 'shadow-[0_0_30px_rgba(155,92,255,0.2)]',
          bg: 'bg-neon-purple/10',
        }
      case 'blue':
        return {
          text: 'text-neon-blue',
          border: 'border-neon-blue/30',
          glow: 'shadow-[0_0_30px_rgba(60,203,255,0.2)]',
          bg: 'bg-neon-blue/10',
        }
      case 'pink':
        return {
          text: 'text-neon-pink',
          border: 'border-neon-pink/30',
          glow: 'shadow-[0_0_30px_rgba(255,79,216,0.2)]',
          bg: 'bg-neon-pink/10',
        }
    }
  }

  const getDisplayValue = (index: number) => {
    switch (index) {
      case 0:
        return displayValues.winnings.toLocaleString()
      case 1:
        return displayValues.games.toLocaleString()
      case 2:
        return displayValues.players
      default:
        return 0
    }
  }

  return (
    <div ref={containerRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color)
        return (
          <div
            key={index}
            className={`
              stat-card relative p-6
              bg-bg-secondary/50 backdrop-blur-sm
              border ${colors.border}
              clip-angle
              hover:${colors.glow}
              transition-shadow duration-500
              group
            `}
          >
            {/* Icon */}
            <div className={`
              absolute top-4 right-4 w-12 h-12 rounded-lg
              ${colors.bg}
              flex items-center justify-center text-2xl
              group-hover:scale-110 transition-transform
            `}>
              {stat.icon}
            </div>

            {/* Value */}
            <div className={`text-4xl md:text-5xl font-black ${colors.text} mb-2`}>
              {stat.prefix}
              {getDisplayValue(index)}
              {stat.suffix}
            </div>

            {/* Label */}
            <div className="text-sm text-white/50 uppercase tracking-wider">
              {stat.label}
            </div>

            {/* Animated underline */}
            <div className={`
              absolute bottom-0 left-0 h-1 w-0
              bg-gradient-to-r from-transparent ${colors.text.replace('text-', 'via-')} to-transparent
              group-hover:w-full transition-all duration-700
            `} />
          </div>
        )
      })}
    </div>
  )
}
