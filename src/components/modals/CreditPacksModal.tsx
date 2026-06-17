'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Target, Users } from 'lucide-react'
import { CREDIT_PACKS, type CreditPackId } from '@/lib/stripe/config'
import { createCheckoutSession } from '@/actions/stripe'
import { PackCard } from '@/components/shop/PackCard'
import { useModalA11y } from '@/hooks/useModalA11y'

interface CreditPacksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreditPacksModal({ isOpen, onClose }: CreditPacksModalProps) {
  const [loadingPack, setLoadingPack] = useState<CreditPackId | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useModalA11y(isOpen, onClose, panelRef)
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
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-md rounded-2xl surface-3 border border-white/10 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-2 right-2 z-10 h-11 w-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
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
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PackCard
                    pack={pack}
                    loading={loadingPack === pack.id}
                    disabled={loadingPack !== null}
                    onBuy={handlePurchase}
                    compact
                  />
                </motion.div>
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
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/55">
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
