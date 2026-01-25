'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, Sparkles } from 'lucide-react'
import { useBadgeNotification } from '@/contexts/BadgeNotificationContext'

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: 'bg-white/10',
    border: 'border-white/30',
    text: 'text-white',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.2)]',
  },
  rare: {
    bg: 'bg-[#3CCBFF]/20',
    border: 'border-[#3CCBFF]/50',
    text: 'text-[#3CCBFF]',
    glow: 'shadow-[0_0_30px_rgba(60,203,255,0.4)]',
  },
  epic: {
    bg: 'bg-[#9B5CFF]/20',
    border: 'border-[#9B5CFF]/50',
    text: 'text-[#9B5CFF]',
    glow: 'shadow-[0_0_30px_rgba(155,92,255,0.4)]',
  },
  legendary: {
    bg: 'bg-[#FFB800]/20',
    border: 'border-[#FFB800]/50',
    text: 'text-[#FFB800]',
    glow: 'shadow-[0_0_30px_rgba(255,184,0,0.4)]',
  },
}

const rarityLabels: Record<string, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

export function BadgeNotificationContainer() {
  const { notifications, dismissNotification } = useBadgeNotification()

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map(({ badge, id }) => {
          const colors = rarityColors[badge.rarity] || rarityColors.common

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="pointer-events-auto"
            >
              <div
                className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.bg} ${colors.glow} backdrop-blur-xl p-4 min-w-[320px] max-w-[380px]`}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] ${
                      badge.rarity === 'legendary'
                        ? 'bg-gradient-conic from-[#FFB800]/20 via-transparent to-[#FFB800]/20'
                        : badge.rarity === 'epic'
                          ? 'bg-gradient-conic from-[#9B5CFF]/20 via-transparent to-[#9B5CFF]/20'
                          : badge.rarity === 'rare'
                            ? 'bg-gradient-conic from-[#3CCBFF]/20 via-transparent to-[#3CCBFF]/20'
                            : 'bg-gradient-conic from-white/10 via-transparent to-white/10'
                    }`}
                  />
                </div>

                {/* Close button */}
                <button
                  onClick={() => dismissNotification(id)}
                  className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors z-10"
                >
                  <X size={18} />
                </button>

                {/* Content */}
                <div className="relative z-10 flex items-start gap-4">
                  {/* Badge icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}
                  >
                    <Trophy className={`w-8 h-8 ${colors.text}`} />

                    {/* Sparkle effects */}
                    {['legendary', 'epic'].includes(badge.rarity) && (
                      <>
                        <motion.div
                          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Sparkles size={12} className={colors.text} />
                        </motion.div>
                        <motion.div
                          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                          className="absolute -bottom-1 -left-1"
                        >
                          <Sparkles size={10} className={colors.text} />
                        </motion.div>
                      </>
                    )}
                  </motion.div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2 mb-1"
                    >
                      <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                        {rarityLabels[badge.rarity]}
                      </span>
                      <span className="text-white/40 text-xs">•</span>
                      <span className="text-[#00FF88] text-xs font-bold">
                        +{badge.credits_reward} crédits
                      </span>
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white font-bold text-lg leading-tight mb-1 truncate"
                    >
                      {badge.name}
                    </motion.h3>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/60 text-sm line-clamp-2"
                    >
                      {badge.description}
                    </motion.p>
                  </div>
                </div>

                {/* Bottom accent line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className={`absolute bottom-0 left-0 right-0 h-1 ${
                    badge.rarity === 'legendary'
                      ? 'bg-gradient-to-r from-[#FFB800] via-[#FF8C00] to-[#FFB800]'
                      : badge.rarity === 'epic'
                        ? 'bg-gradient-to-r from-[#9B5CFF] via-[#FF4FD8] to-[#9B5CFF]'
                        : badge.rarity === 'rare'
                          ? 'bg-gradient-to-r from-[#3CCBFF] via-[#1DA1D1] to-[#3CCBFF]'
                          : 'bg-gradient-to-r from-white/30 via-white/50 to-white/30'
                  }`}
                />

                {/* "New Badge" label */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-[#00FF88] text-[#0B0F1A] text-[10px] font-black uppercase tracking-wider"
                >
                  Nouveau !
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
