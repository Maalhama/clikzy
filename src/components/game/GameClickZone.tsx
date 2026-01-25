'use client'

import { useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameClickZoneProps {
  onClickAction: () => void
  disabled: boolean
  isPending: boolean
  isUrgent: boolean
  isCritical: boolean
  hasCredits: boolean
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
  clickCount: number
  lastClickUsername: string | null
}

export const GameClickZone = memo(function GameClickZone({
  onClickAction,
  disabled,
  isPending,
  isUrgent,
  isCritical,
  hasCredits,
  status,
  clickCount,
  lastClickUsername,
}: GameClickZoneProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([])

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || isPending) return

    // Get click position
    const rect = e.currentTarget.getBoundingClientRect()
    let x: number, y: number

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    const id = Date.now()

    // Add ripple
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)

    // Add particles
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: id + i,
      x,
      y,
      angle: (360 / 8) * i,
    }))
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 800)

    onClickAction()
  }, [disabled, isPending, onClickAction])

  const getButtonContent = () => {
    if (isPending) {
      return (
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full"
          />
          <span className="text-lg font-medium">Enregistrement...</span>
        </div>
      )
    }

    if (status === 'waiting') {
      return (
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">⏳</span>
          <span className="text-lg font-medium">En attente</span>
        </div>
      )
    }

    if (status === 'ended') {
      return (
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🏁</span>
          <span className="text-lg font-medium">Partie terminée</span>
        </div>
      )
    }

    if (!hasCredits) {
      return (
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">💸</span>
          <span className="text-lg font-medium">Crédits insuffisants</span>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <motion.span
          key={clickCount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl"
        >
          👆
        </motion.span>
        <span className="text-2xl font-bold">CLIQUER</span>
        <span className="text-sm opacity-75">1 crédit par clic</span>
      </div>
    )
  }

  const getButtonClasses = () => {
    const base = 'relative w-full h-44 sm:h-48 rounded-3xl font-bold transition-all duration-200 overflow-hidden touch-manipulation'

    if (disabled || !hasCredits) {
      return `${base} bg-bg-secondary/50 text-text-secondary cursor-not-allowed border border-white/5`
    }

    if (isCritical) {
      return `${base} bg-gradient-to-br from-danger via-neon-pink to-danger text-white shadow-[0_0_40px_rgba(239,68,68,0.4)] border border-danger/50 active:scale-[0.98]`
    }

    if (isUrgent) {
      return `${base} bg-gradient-to-br from-neon-pink via-neon-purple to-neon-pink text-white shadow-[0_0_30px_rgba(255,79,216,0.3)] border border-neon-pink/50 active:scale-[0.98]`
    }

    return `${base} bg-gradient-to-br from-neon-purple via-neon-blue to-neon-purple text-white shadow-[0_0_20px_rgba(155,92,255,0.3)] border border-neon-purple/50 active:scale-[0.98]`
  }

  return (
    <div className="space-y-3">
      {/* Click button */}
      <motion.button
        onClick={handleClick}
        onTouchStart={handleClick}
        disabled={disabled}
        className={getButtonClasses()}
        whileTap={!disabled && hasCredits ? { scale: 0.98 } : {}}
        animate={isCritical && !disabled ? {
          boxShadow: [
            '0 0 40px rgba(239,68,68,0.4)',
            '0 0 60px rgba(239,68,68,0.6)',
            '0 0 40px rgba(239,68,68,0.4)',
          ],
        } : {}}
        transition={isCritical ? { repeat: Infinity, duration: 0.5 } : {}}
      >
        {/* Animated background gradient */}
        {!disabled && hasCredits && (
          <motion.div
            className="absolute inset-0 opacity-50"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: ripple.x - 25,
                top: ripple.y - 25,
                width: 50,
                height: 50,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Particle effects */}
        <AnimatePresence>
          {particles.map(particle => (
            <motion.span
              key={particle.id}
              initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              animate={{
                scale: 0,
                opacity: 0,
                x: Math.cos(particle.angle * Math.PI / 180) * 80,
                y: Math.sin(particle.angle * Math.PI / 180) * 80,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute w-3 h-3 rounded-full bg-white pointer-events-none"
              style={{
                left: particle.x - 6,
                top: particle.y - 6,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Content */}
        <span className="relative z-10">{getButtonContent()}</span>
      </motion.button>

      {/* Current leader indicator */}
      {lastClickUsername && status !== 'ended' && status !== 'waiting' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-sm"
        >
          <span className="text-text-secondary">Leader actuel :</span>
          <span className="font-semibold text-neon-purple flex items-center gap-1">
            <span>👑</span>
            {lastClickUsername}
          </span>
        </motion.div>
      )}
    </div>
  )
})
