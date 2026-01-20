'use client'

import { useEffect, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface GameWinnerModalProps {
  isOpen: boolean
  isWinner: boolean
  winnerUsername: string | null
  itemName: string
  itemValue: number | null
  itemImage: string
  onClose: () => void
}

export const GameWinnerModal = memo(function GameWinnerModal({
  isOpen,
  isWinner,
  winnerUsername,
  itemName,
  itemValue,
  itemImage,
  onClose,
}: GameWinnerModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen && isWinner) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isWinner])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(60)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0,
                  }}
                  animate={{
                    y: window.innerHeight + 20,
                    rotate: Math.random() * 720 - 360,
                    x: Math.random() * window.innerWidth,
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: 'linear',
                  }}
                  className="absolute"
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: ['#9B5CFF', '#3CCBFF', '#FF4FD8', '#00FF88', '#FFB800'][
                        Math.floor(Math.random() * 5)
                      ],
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className={`
              relative z-10 w-full max-w-md rounded-3xl overflow-hidden
              ${isWinner
                ? 'bg-gradient-to-br from-success/20 via-bg-secondary to-neon-purple/20'
                : 'bg-bg-secondary'
              }
              border ${isWinner ? 'border-success/30' : 'border-white/10'}
              shadow-2xl
            `}
          >
            {/* Glow effect for winner */}
            {isWinner && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-success/20 rounded-full blur-[100px]" />
              </div>
            )}

            <div className="relative p-8">
              {isWinner ? (
                <>
                  {/* Winner content */}
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-8xl mb-4"
                    >
                      🎉
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-bold text-success mb-2"
                    >
                      Felicitations !
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl text-white mb-6"
                    >
                      Tu as gagne !
                    </motion.p>

                    {/* Item won */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-bg-tertiary/50 rounded-2xl p-6 mb-6 border border-white/10"
                    >
                      <div className="w-24 h-24 mx-auto mb-4 rounded-xl bg-bg-secondary flex items-center justify-center overflow-hidden">
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="max-w-[90%] max-h-[90%] object-contain"
                        />
                      </div>
                      <p className="text-xl font-bold text-white mb-1">
                        {itemName}
                      </p>
                      {itemValue && (
                        <p className="text-lg text-success font-semibold">
                          Valeur : {itemValue.toFixed(0)}€
                        </p>
                      )}
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-text-secondary text-sm mb-6"
                    >
                      Un email de confirmation t&apos;a ete envoye avec les instructions.
                    </motion.p>
                  </div>
                </>
              ) : (
                <>
                  {/* Loser content */}
                  <div className="text-center">
                    <div className="text-7xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Partie terminee
                    </h2>
                    <p className="text-text-secondary mb-4">
                      Le gagnant est :
                    </p>
                    <div className="bg-bg-tertiary/50 rounded-2xl p-5 mb-6 border border-neon-purple/20">
                      <p className="text-2xl font-bold text-neon-purple mb-1">
                        {winnerUsername || 'Inconnu'}
                      </p>
                      <p className="text-text-secondary text-sm">
                        a remporte {itemName}
                      </p>
                    </div>
                    <p className="text-text-secondary text-sm mb-6">
                      Pas de chance cette fois ! Retente sur une autre partie.
                    </p>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Link href="/lobby" className="flex-1">
                  <Button
                    variant={isWinner ? 'neon-pink' : 'primary'}
                    className="w-full py-3 rounded-xl"
                  >
                    Retour au lobby
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
