'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Badge } from '@/actions/badges'

interface BadgeWithStatus {
  badge: Badge
  earned: boolean
  earnedAt: string | null
}

interface BadgesSectionProps {
  badges: BadgeWithStatus[]
  stats: {
    total: number
    earned: number
    byRarity: { rarity: string; total: number; earned: number }[]
  }
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: 'bg-white/5',
    border: 'border-white/20',
    text: 'text-white/60',
    glow: '',
  },
  rare: {
    bg: 'bg-neon-blue/10',
    border: 'border-neon-blue/30',
    text: 'text-neon-blue',
    glow: 'shadow-neon-blue/20',
  },
  epic: {
    bg: 'bg-neon-purple/10',
    border: 'border-neon-purple/30',
    text: 'text-neon-purple',
    glow: 'shadow-neon-purple/20',
  },
  legendary: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    glow: 'shadow-warning/20',
  },
}

const rarityLabels: Record<string, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

const categoryLabels: Record<string, string> = {
  clicks: 'Clics',
  wins: 'Victoires',
  games: 'Parties',
  referrals: 'Parrainage',
  special: 'Spécial',
}

export function BadgesSection({ badges, stats }: BadgesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null)

  // Group badges by category
  const categories = Array.from(new Set(badges.map(b => b.badge.category)))

  const filteredBadges = selectedCategory
    ? badges.filter(b => b.badge.category === selectedCategory)
    : badges

  const progressPercent = stats.total > 0 ? (stats.earned / stats.total) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🏅</span>
          Badges & Succès
        </h2>
        <span className="px-2 py-1 rounded-lg bg-neon-purple/10 text-neon-purple text-xs font-medium">
          {stats.earned}/{stats.total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-pink"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {stats.byRarity.map(({ rarity, total, earned }) => (
            <div key={rarity} className="text-center">
              <div className={`text-xs font-bold ${rarityColors[rarity].text}`}>
                {earned}/{total}
              </div>
              <div className="text-[10px] text-white/40">{rarityLabels[rarity]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? 'bg-neon-purple text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Tous
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-neon-purple text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map(({ badge, earned, earnedAt }, index) => {
            const colors = rarityColors[badge.rarity]
            return (
              <motion.button
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setSelectedBadge({ badge, earned, earnedAt })}
                className={`aspect-square rounded-xl border flex items-center justify-center text-2xl transition-all hover:scale-105 ${
                  earned
                    ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
                    : 'bg-white/5 border-white/10 opacity-40 grayscale'
                }`}
              >
                {badge.icon}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs p-6 rounded-2xl bg-bg-secondary border border-white/10"
            >
              {(() => {
                const { badge, earned, earnedAt } = selectedBadge
                const colors = rarityColors[badge.rarity]
                return (
                  <>
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center text-4xl ${
                      earned ? `shadow-lg ${colors.glow}` : 'opacity-40 grayscale'
                    }`}>
                      {badge.icon}
                    </div>

                    <h3 className="text-xl font-bold text-white text-center mb-1">
                      {badge.name}
                    </h3>

                    <p className={`text-center text-xs font-medium mb-3 ${colors.text}`}>
                      {rarityLabels[badge.rarity]}
                    </p>

                    <p className="text-white/60 text-sm text-center mb-4">
                      {badge.description}
                    </p>

                    {badge.credits_reward > 0 && (
                      <div className="text-center mb-4">
                        <span className="px-3 py-1 rounded-lg bg-success/20 text-success text-sm font-bold">
                          +{badge.credits_reward} crédits
                        </span>
                      </div>
                    )}

                    {earned ? (
                      <div className="text-center text-success text-sm">
                        ✓ Obtenu le {earnedAt ? new Date(earnedAt).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    ) : (
                      <div className="text-center text-white/40 text-sm">
                        🔒 Non débloqué
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedBadge(null)}
                      className="w-full mt-4 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                    >
                      Fermer
                    </button>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
