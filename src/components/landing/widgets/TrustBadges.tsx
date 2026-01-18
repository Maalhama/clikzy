'use client'

import { useRef, useState, useEffect, ComponentType } from 'react'
import { ShieldIcon, GiftIcon, LightningIcon, UsersIcon } from '@/components/ui/GamingIcons'

interface Badge {
  Icon: ComponentType<{ className?: string }>
  title: string
  description: string
  color: 'purple' | 'blue' | 'pink' | 'green'
}

interface TrustBadgesProps {
  className?: string
  variant?: 'horizontal' | 'grid'
}

const BADGES: Badge[] = [
  {
    Icon: ShieldIcon,
    title: 'Zero arnaque',
    description: 'Paiement Stripe securise',
    color: 'purple',
  },
  {
    Icon: GiftIcon,
    title: 'Livraison offerte',
    description: 'Neuf. Emballe. Chez toi.',
    color: 'blue',
  },
  {
    Icon: LightningIcon,
    title: '100% live',
    description: 'Pas de triche possible',
    color: 'pink',
  },
  {
    Icon: UsersIcon,
    title: 'On repond',
    description: '24h/24 - 7j/7',
    color: 'green',
  },
]

const getColorStyles = (color: Badge['color']) => {
  switch (color) {
    case 'purple':
      return {
        text: 'text-neon-purple',
        glow: 'bg-neon-purple/30',
        border: 'group-hover:border-neon-purple/50',
        shadow: '0 0 20px rgba(155, 92, 255, 0.4)',
        hex: '#9B5CFF',
      }
    case 'blue':
      return {
        text: 'text-neon-blue',
        glow: 'bg-neon-blue/30',
        border: 'group-hover:border-neon-blue/50',
        shadow: '0 0 20px rgba(60, 203, 255, 0.4)',
        hex: '#3CCBFF',
      }
    case 'pink':
      return {
        text: 'text-neon-pink',
        glow: 'bg-neon-pink/30',
        border: 'group-hover:border-neon-pink/50',
        shadow: '0 0 20px rgba(255, 79, 216, 0.4)',
        hex: '#FF4FD8',
      }
    case 'green':
      return {
        text: 'text-success',
        glow: 'bg-success/30',
        border: 'group-hover:border-success/50',
        shadow: '0 0 20px rgba(0, 255, 136, 0.4)',
        hex: '#00FF88',
      }
  }
}

export function TrustBadges({ className = '', variant = 'horizontal' }: TrustBadgesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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

  if (variant === 'grid') {
    return (
      <div ref={containerRef} className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {BADGES.map((badge, index) => {
          const colors = getColorStyles(badge.color)
          return (
            <div
              key={index}
              className={`
                trust-badge relative p-6 bg-bg-secondary/50 backdrop-blur-sm
                border border-white/10 ${colors.border}
                rounded-xl text-center
                transition-all duration-500 group
                hover:bg-bg-secondary/70
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
              }}
            >
              {/* Glow effect on hover */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 30px ${colors.hex}15, ${colors.shadow}`,
                }}
              />

              {/* Icon with glow */}
              <div className="relative mb-4 flex justify-center">
                <div className={`absolute inset-0 ${colors.glow} blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative group-hover:scale-110 transition-transform duration-300">
                  <badge.Icon className={`w-10 h-10 ${colors.text}`} />
                </div>
              </div>

              <h4 className="font-bold text-sm mb-1 group-hover:text-white transition-colors">{badge.title}</h4>
              <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors">{badge.description}</p>

              {/* Animated bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-xl">
                <div
                  className="h-full w-0 group-hover:w-full transition-all duration-500"
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

  // Horizontal variant
  return (
    <div
      ref={containerRef}
      className={`relative flex flex-wrap items-center justify-center gap-6 md:gap-10 py-8 px-4 bg-bg-secondary/30 backdrop-blur-sm border-y border-white/10 ${className}`}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 via-transparent to-neon-pink/5 pointer-events-none" />

      {BADGES.map((badge, index) => {
        const colors = getColorStyles(badge.color)
        return (
          <div
            key={index}
            className={`
              trust-badge relative flex items-center gap-3 px-4 py-2 rounded-lg
              transition-all duration-500 group
              hover:bg-white/5
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{
              transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
            }}
          >
            {/* Icon with glow */}
            <div className="relative">
              <div className={`absolute inset-0 ${colors.glow} blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative group-hover:scale-110 transition-transform duration-300">
                <badge.Icon className={`w-7 h-7 ${colors.text}`} />
              </div>
            </div>

            <div>
              <h4
                className="font-bold text-sm transition-all duration-300"
                style={{
                  textShadow: 'none',
                }}
              >
                <span className="group-hover:hidden">{badge.title}</span>
                <span
                  className="hidden group-hover:inline"
                  style={{
                    textShadow: `0 0 10px ${colors.hex}60`,
                  }}
                >
                  {badge.title}
                </span>
              </h4>
              <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors">{badge.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
