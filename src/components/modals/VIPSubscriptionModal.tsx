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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#FFB800]/30 bg-[#141B2D]/95 backdrop-blur-xl shadow-[0_0_60px_rgba(255,184,0,0.15),0_0_100px_rgba(155,92,255,0.1)]"
          >
            {/* Gold accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00]" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/80 transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Crown with glow */}
              <div className="relative flex justify-center mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-[#FFB800]/20 blur-[40px]" />
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFB800] via-[#FFD700] to-[#FF8C00] flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.5)]">
                    <Crown className="w-10 h-10 text-[#0B0F1A]" fill="currentColor" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-[#FFD700]" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-center text-2xl font-black mb-2">
                <span className="bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] bg-clip-text text-transparent">
                  Abonnement V.I.P
                </span>
              </h2>

              <p className="text-center text-white/60 text-sm mb-6">
                Débloquez l&apos;accès aux produits premium
              </p>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">9,99€</span>
                  <span className="text-white/50 text-lg">/mois</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                {VIP_BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1E2942]/50 border border-white/5"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#FFB800] to-[#FFD700] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#0B0F1A]" strokeWidth={3} />
                    </div>
                    <span className="text-white/90 text-sm font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Subscribe button */}
              <motion.button
                onClick={onSubscribe}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] text-[#0B0F1A] shadow-[0_0_30px_rgba(255,184,0,0.4)] hover:shadow-[0_0_40px_rgba(255,184,0,0.6)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-[#0B0F1A]/30 border-t-[#0B0F1A] rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    S&apos;abonner maintenant
                  </>
                )}
              </motion.button>

              {/* Later button */}
              <button
                onClick={onClose}
                className="w-full py-3 mt-3 text-white/50 hover:text-white/80 font-medium transition-colors"
              >
                Plus tard
              </button>

              {/* Cancellation note */}
              <p className="text-center text-white/30 text-xs mt-4">
                Annulable à tout moment depuis votre profil
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
