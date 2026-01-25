'use client'

import { useState } from 'react'

// Neon SVG Icons
const WaitingIcon = () => (
  <svg className="w-10 h-10 text-neon-blue drop-shadow-[0_0_10px_rgba(60,203,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const EndedIcon = () => (
  <svg className="w-10 h-10 text-neon-purple drop-shadow-[0_0_10px_rgba(155,92,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
)

const NoCreditsIcon = () => (
  <svg className="w-10 h-10 text-danger drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" />
    <line x1="4" y1="4" x2="20" y2="20" strokeWidth={2} />
  </svg>
)

const ClickIcon = () => (
  <svg className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <path d="M15 15l-2 5L9 9l11 4-5 2z" />
    <path d="M14 14l5 5" />
  </svg>
)

type ClickZoneProps = {
  onClickAction: () => void
  disabled: boolean
  isPending: boolean
  isUrgent: boolean
  hasCredits: boolean
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

export function ClickZone({
  onClickAction,
  disabled,
  isPending,
  isUrgent,
  hasCredits,
  status,
}: ClickZoneProps) {
  const [clickAnimation, setClickAnimation] = useState(false)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isPending) return

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)

    // Trigger animation
    setClickAnimation(true)
    setTimeout(() => setClickAnimation(false), 150)

    onClickAction()
  }

  const getButtonContent = () => {
    if (isPending) {
      return (
        <span className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Enregistrement...
        </span>
      )
    }

    if (status === 'waiting') {
      return (
        <span className="flex flex-col items-center">
          <span className="mb-2"><WaitingIcon /></span>
          <span>En attente du démarrage</span>
        </span>
      )
    }

    if (status === 'ended') {
      return (
        <span className="flex flex-col items-center">
          <span className="mb-2"><EndedIcon /></span>
          <span>Partie terminée</span>
        </span>
      )
    }

    if (!hasCredits) {
      return (
        <span className="flex flex-col items-center">
          <span className="mb-2"><NoCreditsIcon /></span>
          <span>Crédits insuffisants</span>
        </span>
      )
    }

    return (
      <span className="flex flex-col items-center">
        <span className="mb-2 transition-transform group-hover:scale-110">
          <ClickIcon />
        </span>
        <span className="text-2xl font-bold">CLIQUER</span>
        <span className="text-sm font-normal opacity-75 mt-1">1 crédit par clic</span>
      </span>
    )
  }

  const getButtonClasses = () => {
    const base = `
      group relative w-full h-40 rounded-2xl font-bold
      transition-all duration-200 overflow-hidden
      ${clickAnimation ? 'scale-95' : 'scale-100'}
    `

    if (disabled || !hasCredits) {
      return `${base} bg-bg-tertiary text-text-secondary cursor-not-allowed`
    }

    if (isUrgent) {
      return `${base} bg-gradient-to-r from-danger via-neon-pink to-danger bg-[length:200%_100%] animate-gradient text-white shadow-lg shadow-danger/30 hover:shadow-xl hover:shadow-danger/50 active:scale-95`
    }

    return `${base} bg-gradient-to-r from-neon-purple via-neon-blue to-neon-purple bg-[length:200%_100%] animate-gradient text-white shadow-lg shadow-neon-purple/30 hover:shadow-xl hover:shadow-neon-purple/50 active:scale-95`
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={getButtonClasses()}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
          }}
        />
      ))}

      {/* Content */}
      <span className="relative z-10">{getButtonContent()}</span>

      {/* Glow effect on hover */}
      {!disabled && hasCredits && (
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className={`absolute inset-0 blur-xl ${isUrgent ? 'bg-danger/20' : 'bg-neon-purple/20'}`} />
        </span>
      )}
    </button>
  )
}
