'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'
import { createCheckoutSession } from '@/actions/stripe'

interface CreditPacksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreditPacksModal({ isOpen, onClose }: CreditPacksModalProps) {
  const [loadingPack, setLoadingPack] = useState<CreditPackId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (packId: CreditPackId) => {
    setLoadingPack(packId)
    setError(null)

    const result = await createCheckoutSession(packId)

    if (result.success && result.data?.url) {
      // Redirect to Stripe Checkout
      window.location.href = result.data.url
    } else {
      setError(result.error || 'Une erreur est survenue')
      setLoadingPack(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative z-10 w-full max-w-lg rounded-2xl bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-secondary border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 text-center border-b border-white/10">
              <div className="absolute top-4 right-4">
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">Acheter des crédits</h2>
              <p className="text-white/50 text-sm">Choisis ton pack pour continuer à jouer</p>
            </div>

            {/* Packs */}
            <div className="p-6 space-y-3">
              {CREDIT_PACKS.map((pack) => (
                <motion.button
                  key={pack.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(pack.id)}
                  disabled={loadingPack !== null}
                  className={`
                    relative w-full p-4 rounded-xl transition-all
                    ${pack.popular
                      ? 'bg-gradient-to-r from-neon-purple/20 via-neon-pink/20 to-neon-purple/20 border-2 border-neon-purple/50'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                    }
                    ${loadingPack === pack.id ? 'opacity-80' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  {/* Popular badge */}
                  {pack.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white text-xs font-bold uppercase">
                        Populaire
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${pack.popular
                          ? 'bg-gradient-to-br from-neon-purple to-neon-pink'
                          : 'bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 border border-neon-blue/30'
                        }
                      `}>
                        <span className="text-white font-black text-lg">{pack.credits}</span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">{pack.credits} crédits</div>
                        <div className="text-white/50 text-sm">
                          {(pack.price / pack.credits * 100).toFixed(1)}c / crédit
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {loadingPack === pack.id ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 animate-spin text-neon-purple" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`font-bold text-xl ${pack.popular ? 'text-neon-pink' : 'text-white'}`}>
                          {pack.price.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
              <p className="text-white/30 text-xs text-center mt-4">
                Paiement sécurisé par Stripe. Les crédits sont crédités instantanément.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
