'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Check, Sparkles } from 'lucide-react'

interface VIPSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe: () => void
  isLoading?: boolean
}

const VIP_BENEFITS = [
  'Accès aux produits premium (+1000€)',
  '+10 crédits bonus par jour',
  'Badge V.I.P exclusif',
  'Support prioritaire',
]

export default function VIPSubscriptionModal({
  isOpen,
  onClose,
  onSubscribe,
  isLoading = false,
}: VIPSubscriptionModalProps) {
  if (!isOpen) return null

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
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal - Compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xs sm:max-w-sm overflow-hidden rounded-xl border border-[#FFB800]/30 bg-[#141B2D]/95 backdrop-blur-xl shadow-[0_0_40px_rgba(255,184,0,0.15),0_0_60px_rgba(155,92,255,0.1)]"
          >
            {/* Gold accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00]" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1.5 text-white/40 hover:text-white/80 transition-colors z-10"
            >
              <X size={16} />
            </button>

            {/* Content - Compact */}
            <div className="p-4 pt-5">
              {/* Crown with glow - Smaller */}
              <div className="relative flex justify-center mb-3">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#FFB800]/20 blur-[30px]" />
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="relative"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFB800] via-[#FFD700] to-[#FF8C00] flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.5)]">
                    <Crown className="w-6 h-6 text-[#0B0F1A]" fill="currentColor" />
                  </div>
                  <Sparkles className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[#FFD700]" />
                </motion.div>
              </div>

              {/* Title - Smaller */}
              <h2 className="text-center text-lg font-black mb-1">
                <span className="bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] bg-clip-text text-transparent">
                  Abonnement V.I.P
                </span>
              </h2>

              {/* Price - Compact */}
              <div className="text-center mb-3">
                <div className="inline-flex items-baseline gap-0.5">
                  <span className="text-2xl font-black text-white">9,99€</span>
                  <span className="text-white/50 text-sm">/mois</span>
                </div>
              </div>

              {/* Benefits - Compact */}
              <div className="space-y-1.5 mb-4">
                {VIP_BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1E2942]/50 border border-white/5"
                  >
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#FFB800] to-[#FFD700] flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#0B0F1A]" strokeWidth={3} />
                    </div>
                    <span className="text-white/90 text-xs font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Subscribe button - Compact */}
              <motion.button
                onClick={onSubscribe}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] text-[#0B0F1A] shadow-[0_0_20px_rgba(255,184,0,0.4)] hover:shadow-[0_0_30px_rgba(255,184,0,0.6)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#0B0F1A]/30 border-t-[#0B0F1A] rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    S&apos;abonner
                  </>
                )}
              </motion.button>

              {/* Later button - Compact */}
              <button
                onClick={onClose}
                className="w-full py-2 mt-2 text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
              >
                Plus tard
              </button>

              {/* Cancellation note */}
              <p className="text-center text-white/25 text-[10px] mt-2">
                Annulable à tout moment
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
