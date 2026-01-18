'use client'

import { useRef, ComponentType } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'
import { ShieldIcon, GiftIcon, LightningIcon, UsersIcon } from '@/components/ui/GamingIcons'

interface Badge {
  Icon: ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
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
    color: 'text-neon-purple',
  },
  {
    Icon: GiftIcon,
    title: 'Livraison offerte',
    description: 'Neuf. Emballe. Chez toi.',
    color: 'text-neon-blue',
  },
  {
    Icon: LightningIcon,
    title: '100% live',
    description: 'Pas de triche possible',
    color: 'text-neon-pink',
  },
  {
    Icon: UsersIcon,
    title: 'On repond',
    description: '24h/24 - 7j/7',
    color: 'text-neon-purple',
  },
]

export function TrustBadges({ className = '', variant = 'horizontal' }: TrustBadgesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.from('.trust-badge', {
              y: 20,
              opacity: 0,
              stagger: 0.1,
              duration: 0.5,
              ease: 'power3.out',
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.2 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, { scope: containerRef })

  if (variant === 'grid') {
    return (
      <div ref={containerRef} className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {BADGES.map((badge, index) => (
          <div
            key={index}
            className="trust-badge p-6 bg-bg-secondary/30 border border-white/10 rounded-xl text-center hover:border-neon-purple/30 transition-colors group"
          >
            <div className="mb-3 flex justify-center group-hover:scale-110 transition-transform">
              <badge.Icon className={`w-10 h-10 ${badge.color}`} />
            </div>
            <h4 className="font-bold text-sm mb-1">{badge.title}</h4>
            <p className="text-xs text-white/50">{badge.description}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-wrap items-center justify-center gap-6 md:gap-12 py-6 px-4 bg-bg-secondary/20 border-y border-white/5 ${className}`}
    >
      {BADGES.map((badge, index) => (
        <div
          key={index}
          className="trust-badge flex items-center gap-3 group"
        >
          <div className="group-hover:scale-110 transition-transform">
            <badge.Icon className={`w-6 h-6 ${badge.color}`} />
          </div>
          <div>
            <h4 className="font-bold text-sm">{badge.title}</h4>
            <p className="text-xs text-white/50">{badge.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
