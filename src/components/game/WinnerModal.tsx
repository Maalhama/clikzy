'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Neon SVG Icons
const CelebrationIcon = () => (
  <svg className="w-16 h-16 text-success drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
    <circle cx="5" cy="5" r="1" fill="currentColor" />
    <circle cx="19" cy="5" r="1" fill="currentColor" />
    <circle cx="3" cy="12" r="1" fill="currentColor" />
    <circle cx="21" cy="12" r="1" fill="currentColor" />
  </svg>
)

const TrophyIcon = () => (
  <svg className="w-16 h-16 text-neon-purple drop-shadow-[0_0_20px_rgba(155,92,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M6 3h12v9a6 6 0 0 1-12 0V3z" />
    <path d="M12 18v4" />
    <path d="M8 22h8" />
  </svg>
)

type WinnerModalProps = {
  isOpen: boolean
  isWinner: boolean
  winnerUsername: string | null
  itemName: string
  itemValue: number | null
  onClose: () => void
}

export function WinnerModal({
  isOpen,
  isWinner,
  winnerUsername,
  itemName,
  itemValue,
  onClose,
}: WinnerModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen && isWinner) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isWinner])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Confetti effect for winner */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#9B5CFF', '#3CCBFF', '#FF4FD8', '#00FF88', '#FFB800'][
                    Math.floor(Math.random() * 5)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal content */}
      <div
        className={`
          relative z-10 w-full max-w-md mx-4 p-8 rounded-2xl
          ${isWinner ? 'bg-gradient-to-br from-success/20 to-neon-purple/20' : 'bg-bg-secondary'}
          border ${isWinner ? 'border-success/50' : 'border-bg-tertiary'}
          shadow-2xl animate-modal-enter
        `}
      >
        {isWinner ? (
          <>
            {/* Winner content */}
            <div className="text-center">
              <div className="mb-4 animate-bounce flex justify-center"><CelebrationIcon /></div>
              <h2 className="text-3xl font-bold text-success neon-text-success mb-2">
                Félicitations !
              </h2>
              <p className="text-xl text-text-primary mb-4">
                Tu as gagné !
              </p>
              <div className="bg-bg-tertiary/50 rounded-xl p-6 mb-6">
                <p className="text-2xl font-bold text-text-primary mb-1">
                  {itemName}
                </p>
                {itemValue && (
                  <p className="text-lg text-success">
                    Valeur : {itemValue.toFixed(0)}€
                  </p>
                )}
              </div>
              <p className="text-text-secondary text-sm mb-6">
                Un email de confirmation t&apos;a été envoyé avec les instructions pour récupérer ton lot.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Loser content */}
            <div className="text-center">
              <div className="mb-4 flex justify-center"><TrophyIcon /></div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Partie terminée
              </h2>
              <p className="text-text-secondary mb-4">
                Le gagnant est :
              </p>
              <div className="bg-bg-tertiary rounded-xl p-4 mb-6">
                <p className="text-2xl font-bold text-neon-purple neon-text">
                  {winnerUsername || 'Inconnu'}
                </p>
                <p className="text-text-secondary mt-1">
                  a remporté {itemName}
                </p>
              </div>
              <p className="text-text-secondary text-sm mb-6">
                Pas de chance cette fois ! Tente ta chance sur une autre partie.
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/lobby" className="flex-1">
            <Button variant="primary" className="w-full">
              Retour au lobby
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}
