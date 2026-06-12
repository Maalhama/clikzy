'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Target, Users } from 'lucide-react'
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
      window.location.href = result.data.url
    } else {
      setError(result.error || 'Une erreur est survenue')
      setLoadingPack(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label="Acheter des crédits" className="fixed inset-0 max-sm:min-h-[100lvh] z-50 flex items-center justify-center p-4">
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
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-bg-secondary border border-white/10 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header compact */}
            <div className="px-5 pt-5 pb-3 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-3">
                <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-neon-purple text-xs font-semibold">CRÉDITS</span>
              </div>
              <h2 className="text-lg font-bold text-white">Choisis ton pack</h2>
            </div>

            {/* Packs - Compact cards */}
            <div className="px-4 pb-4 space-y-2">
              {CREDIT_PACKS.map((pack, index) => (
                <motion.button
                  key={pack.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(pack.id)}
                  disabled={loadingPack !== null}
                  className={`
                    relative w-full p-3 rounded-xl transition-all flex items-center gap-3
                    ${pack.popular
                      ? 'bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 border-2 border-neon-purple/40 shadow-[0_0_20px_rgba(155,92,255,0.15)]'
                      : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                    }
                    ${loadingPack === pack.id ? 'opacity-70' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  {/* Credits badge */}
                  <div className={`
                    w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0
                    ${pack.popular
                      ? 'bg-gradient-to-br from-neon-purple to-neon-pink shadow-lg'
                      : 'bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-white/10'
                    }
                  `}>
                    <span className="text-white font-black text-lg leading-none">{pack.credits}</span>
                    <span className="text-white/70 text-[9px] uppercase">crédits</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{pack.name}</span>
                      {pack.popular && (
                        <span className="px-1.5 py-0.5 rounded bg-neon-pink/20 text-neon-pink text-[10px] font-bold uppercase">
                          Top
                        </span>
                      )}
                    </div>
                    <div className="text-xs">
                      {pack.bonus > 0 ? (
                        <span className="text-success font-medium">+{pack.bonus}% de valeur</span>
                      ) : (
                        <span className="text-white/40">Pack de base</span>
                      )}
                    </div>
                  </div>

                  {/* Price / Loading */}
                  <div className="flex-shrink-0">
                    {loadingPack === pack.id ? (
                      <svg className="w-6 h-6 animate-spin text-neon-purple" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <div className={`
                        px-3 py-1.5 rounded-lg font-bold text-sm
                        ${pack.popular
                          ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
                          : 'bg-white/10 text-white'
                        }
                      `}>
                        {pack.price.toFixed(2)}€
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs text-center"
                >
                  {error}
                </motion.div>
              )}
            </div>

            {/* Alternatives gratuites : réengager plutôt que frustrer à 0 crédit */}
            <div className="mx-4 mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Ou gagne des crédits gratuitement
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <a href="/mini-games" className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 transition-colors hover:border-neon-purple/40 hover:bg-neon-purple/10">
                  <Dices className="mx-auto h-4 w-4 text-neon-purple" aria-hidden />
                  <div className="mt-1 text-[10px] font-medium text-white/70">Mini-jeux gratuits</div>
                </a>
                <a href="/lobby" className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 transition-colors hover:border-neon-purple/40 hover:bg-neon-purple/10">
                  <Target className="mx-auto h-4 w-4 text-neon-purple" aria-hidden />
                  <div className="mt-1 text-[10px] font-medium text-white/70">Quêtes du jour</div>
                </a>
                <a href="/profile" className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 transition-colors hover:border-neon-purple/40 hover:bg-neon-purple/10">
                  <Users className="mx-auto h-4 w-4 text-neon-purple" aria-hidden />
                  <div className="mt-1 text-[10px] font-medium text-white/70">Parrainage +10</div>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 pt-1 border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-white/50 text-[10px]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Paiement sécurisé Stripe • Crédits instantanés
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
