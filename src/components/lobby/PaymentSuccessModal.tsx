'use client'

import { useEffect, useState } from 'react'

interface PaymentSuccessModalProps {
  credits: number
  onClose: () => void
}

export function PaymentSuccessModal({ credits, onClose }: PaymentSuccessModalProps) {
  const [progress, setProgress] = useState(100)

  // Auto-dismiss after 5 seconds with progress bar
  useEffect(() => {
    const duration = 5000
    const interval = 50
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return prev - step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-dark rounded-2xl p-8 animate-modal-enter overflow-hidden">
        {/* Decorative glow effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-success/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-neon-purple/20 rounded-full blur-[80px]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="relative text-center">
          {/* Success icon with glow */}
          <div className="mx-auto w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-6 neon-glow-success">
            <svg
              className="w-10 h-10 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black mb-2 gradient-text">
            Merci pour ton achat !
          </h2>

          {/* Credits amount */}
          <div className="text-4xl font-black text-success neon-text-success mb-4">
            +{credits} crédits
          </div>

          {/* Subtitle */}
          <p className="text-white/60 mb-8">
            Tes crédits sont disponibles immédiatement.
            <br />
            Bonne chance !
          </p>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-opacity"
          >
            Jouer maintenant
          </button>

          {/* Progress bar */}
          <div className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-purple to-neon-pink transition-all duration-50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-2">
            Fermeture automatique...
          </p>
        </div>
      </div>
    </div>
  )
}
