'use client'

import { useRef, useState, useEffect, ComponentType } from 'react'
import { CoinsIcon, GamepadIcon, UsersIcon } from '@/components/ui/GamingIcons'
import { useIsMobile } from '@/hooks/useIsMobile'

interface StatItem {
  value: number
  label: string
  prefix?: string
  suffix?: string
  color: 'purple' | 'blue' | 'pink'
  Icon: ComponentType<{ className?: string }>
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
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [displayValues, setDisplayValues] = useState({
    winnings: 0,
    games: 0,
    players: 0,
  })
  const isMobile = useIsMobile()

  const stats: StatItem[] = [
    {
      value: totalWinnings,
      label: 'Gagnés par les utilisateurs',
      suffix: '€',
      color: 'purple',
      Icon: CoinsIcon,
    },
    {
      value: totalGames,
      label: 'Lots distribués',
      suffix: '+',
      color: 'blue',
      Icon: GamepadIcon,
    },
    {
      value: playersOnline,
      label: 'Connectés maintenant',
      color: 'pink',
      Icon: UsersIcon,
    },
  ]

  // Intersection Observer for visibility
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.2 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isVisible])

  // Animate numbers ONCE when visible
  useEffect(() => {
    if (!isVisible || hasAnimated) return

    setHasAnimated(true)

    const duration = 2000 // 2 seconds
    const startTime = Date.now()
    const targetWinnings = totalWinnings
    const targetGames = totalGames
    const targetPlayers = playersOnline

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayValues({
        winnings: Math.floor(targetWinnings * eased),
        games: Math.floor(targetGames * eased),
        players: Math.floor(targetPlayers * eased),
      })

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, hasAnimated, totalWinnings, totalGames, playersOnline])

  // Update players count in real-time AFTER initial animation
  useEffect(() => {
    if (hasAnimated) {
      setDisplayValues(prev => ({
        ...prev,
        players: playersOnline,
      }))
    }
  }, [playersOnline, hasAnimated])

  const getColorClasses = (color: StatItem['color']) => {
    switch (color) {
      case 'purple':
        return {
          text: 'text-neon-purple',
          border: 'border-neon-purple/30',
          hoverBorder: 'group-hover:border-neon-purple/60',
          glow: 'group-hover:shadow-[0_0_40px_rgba(155,92,255,0.4)]',
          bg: 'bg-neon-purple/10',
          iconGlow: 'group-hover:shadow-[0_0_20px_rgba(155,92,255,0.6)]',
          hex: '#9B5CFF',
        }
      case 'blue':
        return {
          text: 'text-neon-blue',
          border: 'border-neon-blue/30',
          hoverBorder: 'group-hover:border-neon-blue/60',
          glow: 'group-hover:shadow-[0_0_40px_rgba(60,203,255,0.4)]',
          bg: 'bg-neon-blue/10',
          iconGlow: 'group-hover:shadow-[0_0_20px_rgba(60,203,255,0.6)]',
          hex: '#3CCBFF',
        }
      case 'pink':
        return {
          text: 'text-neon-pink',
          border: 'border-neon-pink/30',
          hoverBorder: 'group-hover:border-neon-pink/60',
          glow: 'group-hover:shadow-[0_0_40px_rgba(255,79,216,0.4)]',
          bg: 'bg-neon-pink/10',
          iconGlow: 'group-hover:shadow-[0_0_20px_rgba(255,79,216,0.6)]',
          hex: '#FF4FD8',
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
              stat-card relative p-8 rounded-lg
              bg-bg-secondary/50 backdrop-blur-sm
              border ${colors.border} ${colors.hoverBorder}
              ${colors.glow}
              transition-all duration-500
              group
              ${isMobile ? 'opacity-100' : (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}
            `}
            style={{
              transitionDelay: isMobile ? '0ms' : (isVisible ? `${index * 150}ms` : '0ms'),
            }}
          >
            {/* Gradient border glow on hover */}
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
              style={{
                background: `radial-gradient(ellipse at center, ${colors.hex}15 0%, transparent 70%)`,
              }}
            />

            {/* Icon with pulse effect */}
            <div className={`
              absolute top-6 right-6 w-14 h-14 rounded-xl
              ${colors.bg}
              flex items-center justify-center
              transition-all duration-300
              ${colors.iconGlow}
              group-hover:scale-110
            `}>
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-xl animate-ping opacity-0 group-hover:opacity-30"
                style={{ backgroundColor: colors.hex }}
              />
              <stat.Icon className={`w-7 h-7 ${colors.text} relative z-10`} />
            </div>

            {/* Value with text glow */}
            <div
              className={`text-4xl md:text-5xl font-black ${colors.text} mb-2 transition-all duration-300`}
              style={{
                textShadow: isVisible ? `0 0 20px ${colors.hex}40` : 'none',
              }}
            >
              {stat.prefix}
              {getDisplayValue(index)}
              {stat.suffix}
            </div>

            {/* Label */}
            <div className="text-sm text-white/50 uppercase tracking-wider">
              {stat.label}
            </div>

            {/* Animated bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-lg">
              <div
                className="h-full w-0 group-hover:w-full transition-all duration-700"
                style={{
                  background: `linear-gradient(90deg, transparent, ${colors.hex}, transparent)`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
