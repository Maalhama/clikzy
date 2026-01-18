'use client'

import { useRef, useEffect } from 'react'
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

interface WinnersFeedProps {
  winners: Winner[]
  maxDisplay?: number
  className?: string
}

export function WinnersFeed({
  winners,
  maxDisplay = 5,
  className = '',
}: WinnersFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])

  // Animate new winner entry
  useGSAP(
    () => {
      if (!containerRef.current || itemsRef.current.length === 0) return

      const ctx = gsap.context(() => {
        // Initial animation for items
        gsap.fromTo(
          itemsRef.current.filter(Boolean),
          { opacity: 0, x: -30, scale: 0.9 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: 'back.out(1.7)',
          }
        )
      }, containerRef)

      return () => ctx.revert()
    },
    { scope: containerRef, dependencies: [winners] }
  )

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "A l'instant"
    if (diffMins < 60) return `Il y a ${diffMins}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return `Il y a ${diffDays}j`
  }

  const displayWinners = winners.slice(0, maxDisplay)

  if (displayWinners.length === 0) {
    return (
      <div className={`text-center text-text-secondary py-8 ${className}`}>
        <p>Aucun gagnant récent</p>
        <p className="text-sm mt-1">Sois le premier !</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`space-y-3 ${className}`}>
      {displayWinners.map((winner, index) => (
        <div
          key={winner.id}
          ref={(el) => {
            if (el) itemsRef.current[index] = el
          }}
          className="group flex items-center gap-3 p-3 rounded-xl bg-bg-secondary/50 border border-bg-tertiary hover:border-neon-purple/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(155,92,255,0.15)]"
        >
          {/* Avatar */}
          <div
            className="relative w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0 group-hover:shadow-[0_0_15px_rgba(155,92,255,0.5)] transition-shadow duration-300"
          >
            {winner.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={winner.avatar_url}
                alt={winner.username}
                className="w-full h-full object-cover"
              />
            ) : (
              winner.username.charAt(0).toUpperCase()
            )}
            {/* Winner badge */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)' }}
            >
              <span className="text-[8px]">✓</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary truncate">
                {winner.username}
              </span>
              <span className="text-xs text-success">a gagné</span>
            </div>
            <div
              className="text-sm text-neon-purple truncate font-medium"
              style={{ textShadow: '0 0 10px rgba(155, 92, 255, 0.3)' }}
            >
              {winner.item_name}
            </div>
          </div>

          {/* Value & Time */}
          <div className="text-right flex-shrink-0">
            <div
              className="text-sm font-bold text-neon-pink"
              style={{ textShadow: '0 0 10px rgba(255, 79, 216, 0.4)' }}
            >
              {winner.item_value.toLocaleString()} EUR
            </div>
            <div className="text-xs text-text-secondary">
              {formatTimeAgo(winner.won_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Toast notification for new winners
interface WinnerToastProps {
  winner: Winner
  onClose: () => void
}

export function WinnerToast({ winner, onClose }: WinnerToastProps) {
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  useGSAP(
    () => {
      if (!toastRef.current) return

      gsap.fromTo(
        toastRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      )
    },
    { scope: toastRef }
  )

  return (
    <div
      ref={toastRef}
      className="fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl bg-bg-secondary/90 backdrop-blur-xl border border-success/40 cursor-pointer"
      style={{ boxShadow: '0 0 30px rgba(0, 255, 136, 0.3), inset 0 0 20px rgba(0, 255, 136, 0.05)' }}
      onClick={onClose}
    >
      <div
        className="text-2xl"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.8))' }}
      >
        🏆
      </div>
      <div>
        <div
          className="font-bold text-success"
          style={{ textShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }}
        >
          Nouveau gagnant !
        </div>
        <div className="text-sm text-text-primary">
          <span className="text-neon-purple font-semibold">{winner.username}</span> remporte{' '}
          <span className="text-neon-pink">{winner.item_name}</span>
        </div>
      </div>
    </div>
  )
}
