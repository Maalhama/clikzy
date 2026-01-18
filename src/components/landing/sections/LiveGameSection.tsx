'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/gsapConfig'
import { LiveTimer } from '../components/LiveTimer'
import { ClickNotification } from '../components/PlayerCounter'
import { useClickNotifications } from '@/hooks/landing/useLandingRealtime'

interface LiveGameSectionProps {
  game?: {
    id: string
    item_name: string
    item_image_url: string
    end_time: number
    total_clicks: number
    last_click_username: string | null
    status: 'waiting' | 'active' | 'final_phase' | 'ended'
  }
}

export function LiveGameSection({ game }: LiveGameSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [shakeEffect, setShakeEffect] = useState(false)
  const { notifications } = useClickNotifications(!!game && game.status !== 'ended')

  // Demo game data if no real game
  const displayGame = game || {
    id: 'demo',
    item_name: 'iPhone 15 Pro Max',
    item_image_url: '/items/iphone.png',
    end_time: Date.now() + 45 * 1000, // 45 seconds from now
    total_clicks: 1247,
    last_click_username: 'GamerPro',
    status: 'final_phase' as const,
  }

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        // Pin section on desktop
        if (window.innerWidth >= 768) {
          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=100%',
            pin: true,
            pinSpacing: true,
          })
        }

        // Content reveal
        if (contentRef.current) {
          gsap.fromTo(
            contentRef.current,
            { opacity: 0, scale: 0.95 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        }
      }, sectionRef)

      return () => ctx.revert()
    },
    { scope: sectionRef }
  )

  // Shake effect when close to end
  const handleTimerUrgency = () => {
    setShakeEffect(true)
    setTimeout(() => setShakeEffect(false), 500)
  }

  const isUrgent = displayGame.status === 'final_phase'

  return (
    <section
      ref={sectionRef}
      id="live-game"
      className={`relative min-h-screen flex items-center justify-center py-20 ${
        shakeEffect ? 'animate-shake' : ''
      }`}
    >
      {/* Urgent background effect */}
      {isUrgent && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-danger/5 animate-pulse" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent animate-pulse" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent animate-pulse" />
        </div>
      )}

      <div ref={contentRef} className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-danger/20 border border-danger/30 rounded-full text-danger mb-4 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
            </span>
            Partie en cours
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            {displayGame.item_name}
          </h2>
        </div>

        {/* Main game display */}
        <div className="max-w-2xl mx-auto">
          {/* Timer */}
          <div className="glass rounded-3xl p-8 md:p-12 text-center mb-8">
            <LiveTimer
              endTime={displayGame.end_time}
              size="xl"
              showLabel
            />

            {/* Leader info */}
            {displayGame.last_click_username && (
              <div className="mt-8 pt-6 border-t border-bg-tertiary">
                <div className="text-sm text-text-secondary mb-2">Dernier clic par</div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold">
                    {displayGame.last_click_username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xl font-bold text-neon-purple">
                    {displayGame.last_click_username}
                  </span>
                  <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full">
                    Leader
                  </span>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-blue">
                  {displayGame.total_clicks.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">Clics totaux</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isUrgent ? 'text-danger' : 'text-neon-purple'}`}>
                  {displayGame.status === 'final_phase' ? 'FINALE' : displayGame.status.toUpperCase()}
                </div>
                <div className="text-xs text-text-secondary">Phase</div>
              </div>
            </div>
          </div>

          {/* Click notifications */}
          <div className="flex flex-wrap justify-center gap-2 min-h-[40px]">
            {notifications.map((notif) => (
              <ClickNotification key={notif.id} username={notif.username} />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <a
              href="/register"
              className={`inline-flex items-center gap-2 px-8 py-4 font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 ${
                isUrgent
                  ? 'bg-danger text-white hover:shadow-neon-danger animate-pulse'
                  : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-neon-purple'
              }`}
            >
              {isUrgent ? 'Rejoindre maintenant !' : 'Participer a cette partie'}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
