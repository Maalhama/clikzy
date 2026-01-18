'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

interface Winner {
  id: string
  username: string
  item_name: string
  item_value: number
  won_at: string
  avatar_url?: string
}

interface SocialProofSectionProps {
  winners: Winner[]
  totalWinningsValue: number
  totalGames: number
  activePlayersNow: number
}

// Animated counter component
function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const startTime = Date.now()

          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayValue(Math.floor(value * eased))

            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

export function SocialProofSection({
  winners,
  totalWinningsValue,
  totalGames,
  activePlayersNow,
}: SocialProofSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    return `${Math.floor(diffMs / 86400000)}j`
  }

  useGSAP(
    () => {
      if (!sectionRef.current || !cardsRef.current) return

      const ctx = gsap.context(() => {
        // Stagger animation for winner cards
        gsap.fromTo(
          '.winner-card',
          { opacity: 0, x: 50, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        )

        // Stats cards animation
        gsap.fromTo(
          '.stat-card-new',
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }, sectionRef)

      return () => ctx.revert()
    },
    { scope: sectionRef }
  )

  const displayWinners = winners.slice(0, 5)

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-success/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6">
        {/* Header - More compact and bold */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-full text-success text-sm font-medium mb-4"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Live
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black">
              DERNIERS{' '}
              <span
                className="text-success"
                style={{ textShadow: '0 0 40px rgba(0, 255, 136, 0.5)' }}
              >
                GAGNANTS
              </span>
            </h2>
            <p className="text-text-secondary mt-3 max-w-md">
              Des gagnants remportent des objets chaque jour. Consulte les gains en temps réel.
            </p>
          </div>

          {/* Stats row - horizontal on desktop */}
          <div className="flex gap-4 md:gap-6">
            <div
              className="stat-card-new flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-bg-secondary/60 border border-neon-purple/30 backdrop-blur-sm"
              style={{ boxShadow: '0 0 25px rgba(155, 92, 255, 0.15)' }}
            >
              <span
                className="text-2xl md:text-3xl font-black text-neon-purple"
                style={{ textShadow: '0 0 20px rgba(155, 92, 255, 0.5)' }}
              >
                <AnimatedNumber value={totalWinningsValue} suffix="€" />
              </span>
              <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">Total distribué</span>
            </div>
            <div
              className="stat-card-new flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-bg-secondary/60 border border-success/30 backdrop-blur-sm"
              style={{ boxShadow: '0 0 25px rgba(0, 255, 136, 0.15)' }}
            >
              <span
                className="text-2xl md:text-3xl font-black text-success"
                style={{ textShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}
              >
                <AnimatedNumber value={totalGames} suffix="+" />
              </span>
              <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">Gagnants</span>
            </div>
          </div>
        </div>

        {/* Winners Grid - Modern card design */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {displayWinners.map((winner, index) => (
            <div
              key={winner.id}
              className={`winner-card group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                index === 0 ? 'md:col-span-2 lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              {/* Card background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  index === 0
                    ? 'from-success/20 via-bg-secondary/80 to-bg-secondary/90'
                    : 'from-bg-secondary/80 to-bg-secondary/60'
                } backdrop-blur-sm`}
              />

              {/* Border glow */}
              <div
                className={`absolute inset-0 rounded-2xl border ${
                  index === 0 ? 'border-success/40' : 'border-white/10'
                } group-hover:border-success/50 transition-colors duration-300`}
              />

              {/* Content */}
              <div className={`relative ${index === 0 ? 'p-6 md:p-8' : 'p-4'}`}>
                {/* Time badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 mb-3 ${
                    index === 0 ? 'text-sm' : 'text-xs'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-text-secondary">{formatTimeAgo(winner.won_at)}</span>
                </div>

                {/* Avatar & Username */}
                <div className={`flex items-center gap-3 ${index === 0 ? 'mb-4' : 'mb-2'}`}>
                  <div
                    className={`rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold flex-shrink-0 ${
                      index === 0 ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm'
                    }`}
                    style={{ boxShadow: index === 0 ? '0 0 25px rgba(155, 92, 255, 0.5)' : '0 0 15px rgba(155, 92, 255, 0.3)' }}
                  >
                    {winner.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={`font-bold text-white ${index === 0 ? 'text-lg' : 'text-sm'}`}>
                      {winner.username}
                    </div>
                    <div className="text-xs text-success font-medium">vient de remporter</div>
                  </div>
                </div>

                {/* Item won */}
                <div className={index === 0 ? 'mt-auto' : ''}>
                  <div
                    className={`font-bold text-white ${index === 0 ? 'text-2xl md:text-3xl mb-2' : 'text-base mb-1'}`}
                  >
                    {winner.item_name}
                  </div>
                  <div
                    className={`font-black ${index === 0 ? 'text-3xl md:text-4xl' : 'text-xl'}`}
                    style={{
                      background: 'linear-gradient(135deg, #00FF88 0%, #3CCBFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.4))',
                    }}
                  >
                    {winner.item_value.toLocaleString()}€
                  </div>
                </div>

                {/* Decorative elements for featured card */}
                {index === 0 && (
                  <>
                    <div className="absolute top-4 right-4 px-3 py-1 bg-success/20 border border-success/40 rounded-full text-success text-xs font-bold">
                      RÉCENT
                    </div>
                    <div
                      className="absolute -bottom-10 -right-10 w-40 h-40 bg-success/10 rounded-full blur-3xl"
                    />
                  </>
                )}
              </div>

              {/* Hover glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 30px rgba(0, 255, 136, 0.1)' }}
              />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <a
            href="/lobby"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-success border border-success/30 rounded-full hover:bg-success/10 hover:border-success/50 transition-all duration-300"
            style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)' }}
          >
            Voir tous les gagnants
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
