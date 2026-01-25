'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

// SVG Icons - Neon Style
const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
    <circle cx="12" cy="4" r="1.5" />
    <circle cx="5" cy="5" r="1.5" />
    <circle cx="19" cy="5" r="1.5" />
    <rect x="6" y="16" width="12" height="2" rx="0.5" />
    <rect x="5" y="19" width="14" height="2" rx="0.5" />
  </svg>
)

const MedalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="9" r="6" />
    <path d="M8 15l-2 7 6-3 6 3-2-7" />
  </svg>
)

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3v3H9V7c0-1.65 1.35-3 3-3zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
  </svg>
)

const CreditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
)

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.5c3.5 0 6.5-2.5 6.5-6V4h-13v7.5c0 3.5 3 6 6.5 6zM5.5 4H2v3c0 2 1.5 3.5 3.5 3.5V4zM18.5 4v6.5c2 0 3.5-1.5 3.5-3.5V4h-3.5zM12 19.5V22M8 22h8" />
  </svg>
)

const DiamondIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 3h12l4 6-10 12L2 9l4-6zm3 0l-2 6h10l-2-6H9z" />
  </svg>
)

const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8 2 4.5 5.5 3 10l2 2 2.5-.5C8.5 9 10 7.5 12 7.5s3.5 1.5 4.5 4l2.5.5 2-2c-1.5-4.5-5-8-9-8zM5 18l2-2-2.5-.5C3 17 2.5 19 3 21c2-.5 4-1 5.5-2.5L6 21l-1-3zM19 18l-2-2 2.5-.5c1.5 1.5 2 3.5 1.5 5.5-2-.5-4-1-5.5-2.5l2.5 2.5 1-3z" />
  </svg>
)

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
  </svg>
)

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

// Types
type VIPTier = 'bronze' | 'silver' | 'gold'

interface VIPDashboardProps {
  tier: VIPTier
  memberSince: string
  daysUntilNextTier: number
  totalCreditsEarned: number
  currentCredits: number
  canCollectBonus: boolean
  isCollectingBonus?: boolean
  onCollectBonus: () => void
  onManageSubscription: () => void
}

// Tier configuration - VIP users keep credits forever (no daily reset)
const TIER_CONFIG = {
  bronze: {
    name: 'Bronze',
    color: 'from-amber-600 to-amber-800',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    glowColor: 'drop-shadow-[0_0_12px_rgba(217,119,6,0.8)]',
    shadowColor: 'shadow-[0_0_30px_rgba(217,119,6,0.3)]',
    nextTier: 'silver' as VIPTier,
    daysToNext: 90,
  },
  silver: {
    name: 'Silver',
    color: 'from-slate-300 to-slate-500',
    borderColor: 'border-slate-400/30',
    bgColor: 'bg-slate-400/10',
    textColor: 'text-slate-300',
    glowColor: 'drop-shadow-[0_0_12px_rgba(148,163,184,0.8)]',
    shadowColor: 'shadow-[0_0_30px_rgba(148,163,184,0.3)]',
    nextTier: 'gold' as VIPTier,
    daysToNext: 90,
  },
  gold: {
    name: 'Gold',
    color: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    glowColor: 'drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]',
    shadowColor: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]',
    nextTier: null,
    daysToNext: 0,
  },
}

// Benefits by tier - VIP users get +10 bonus credits daily to collect
const BENEFITS = {
  bronze: [
    { icon: CreditIcon, title: '+10 Bonus quotidien', description: '20 crédits par jour au total (10 gratuits + 10 bonus)' },
    { icon: DiamondIcon, title: 'Produits Premium', description: 'Accès aux produits de +1000€' },
    { icon: StarIcon, title: 'Badge V.I.P Bronze', description: 'Badge exclusif sur ton profil' },
    { icon: RocketIcon, title: 'Support prioritaire', description: 'Réponses rapides de notre équipe' },
  ],
  silver: [
    { icon: CreditIcon, title: '+10 Bonus quotidien', description: '20 crédits par jour au total (10 gratuits + 10 bonus)' },
    { icon: DiamondIcon, title: 'Produits Premium', description: 'Accès aux produits de +1000€' },
    { icon: StarIcon, title: 'Badge V.I.P Silver', description: 'Badge exclusif sur ton profil' },
    { icon: RocketIcon, title: 'Support prioritaire', description: 'Réponses rapides de notre équipe' },
    { icon: SparkleIcon, title: 'Accès anticipé', description: 'Joue aux nouveaux jeux en avant-première' },
  ],
  gold: [
    { icon: CreditIcon, title: '+10 Bonus quotidien', description: '20 crédits par jour au total (10 gratuits + 10 bonus)' },
    { icon: DiamondIcon, title: 'Produits Premium', description: 'Accès aux produits de +1000€' },
    { icon: StarIcon, title: 'Badge V.I.P Gold', description: 'Badge légendaire sur ton profil' },
    { icon: RocketIcon, title: 'Support prioritaire', description: 'Réponses rapides de notre équipe' },
    { icon: SparkleIcon, title: 'Accès anticipé', description: 'Joue aux nouveaux jeux en avant-première' },
    { icon: TrophyIcon, title: 'Événements exclusifs', description: 'Accès aux événements V.I.P réservés' },
  ],
}

const LOCKED_BENEFITS = {
  bronze: [
    { icon: SparkleIcon, title: 'Accès anticipé', description: 'Disponible au niveau Silver' },
    { icon: TrophyIcon, title: 'Événements exclusifs', description: 'Disponible au niveau Gold' },
  ],
  silver: [
    { icon: TrophyIcon, title: 'Événements exclusifs', description: 'Disponible au niveau Gold' },
  ],
  gold: [],
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const VIP_DAILY_BONUS = 10

export function VIPDashboard({
  tier,
  memberSince,
  daysUntilNextTier,
  totalCreditsEarned,
  currentCredits,
  canCollectBonus,
  isCollectingBonus = false,
  onCollectBonus,
  onManageSubscription,
}: VIPDashboardProps) {
  const config = TIER_CONFIG[tier]
  const benefits = BENEFITS[tier]
  const lockedBenefits = LOCKED_BENEFITS[tier]
  const nextTierConfig = config.nextTier ? TIER_CONFIG[config.nextTier] : null

  // Calculate progress percentage
  const progressPercent = nextTierConfig
    ? Math.max(0, Math.min(100, ((config.daysToNext - daysUntilNextTier) / config.daysToNext) * 100))
    : 100

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-bg-secondary/50 border border-white/10 p-6 md:p-8"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${config.color} opacity-10 blur-[100px]`} />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-purple/10 blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Tier Badge */}
          <div className="flex items-center gap-4">
            <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center ${config.shadowColor}`}>
              <MedalIcon className={`w-10 h-10 text-[#0B0F1A] ${config.glowColor}`} />
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className={`text-2xl md:text-3xl font-bold ${config.textColor}`}>
                  V.I.P {config.name}
                </h1>
                <CrownIcon className={`w-6 h-6 ${config.textColor} ${config.glowColor}`} />
              </div>
              <p className="text-text-secondary text-sm">
                Membre depuis le {new Date(memberSince).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor} border ${config.borderColor}`}>
            <span className={`w-2 h-2 rounded-full bg-success animate-pulse`} />
            <span className={`text-sm font-medium ${config.textColor}`}>Membre V.I.P Actif</span>
          </div>
        </div>
      </motion.section>

      {/* Stats Cards */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Bonus Card - VIP Exclusive */}
        <div className="relative overflow-hidden rounded-xl bg-bg-secondary/50 border border-neon-purple/30 p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-neon-purple/10 blur-[40px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                <CreditIcon className="w-5 h-5 text-neon-purple drop-shadow-[0_0_8px_rgba(155,92,255,0.6)]" />
              </div>
              <span className="text-text-secondary text-sm">Bonus V.I.P</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">+{VIP_DAILY_BONUS}</span>
              <span className="text-text-secondary">crédits</span>
            </div>
            <div className="mt-3">
              {canCollectBonus ? (
                <button
                  onClick={onCollectBonus}
                  disabled={isCollectingBonus}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(155,92,255,0.4)]"
                >
                  {isCollectingBonus ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Récupération...
                    </>
                  ) : (
                    <>
                      <SparkleIcon className="w-4 h-4" />
                      Récupérer mon bonus
                    </>
                  )}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-success">
                  <CheckIcon className="w-4 h-4" />
                  Bonus récupéré ! Reviens demain
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Days Until Next Tier */}
        <div className="relative overflow-hidden rounded-xl bg-bg-secondary/50 border border-white/10 p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-neon-pink/10 blur-[40px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-neon-pink drop-shadow-[0_0_8px_rgba(255,79,216,0.6)]" />
              </div>
              <span className="text-text-secondary text-sm">Prochain niveau</span>
            </div>
            {nextTierConfig ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{daysUntilNextTier}</span>
                  <span className="text-text-secondary">jours</span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Pour devenir <span className={nextTierConfig.textColor}>{nextTierConfig.name}</span>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Niveau Max
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">Tu as atteint le sommet !</p>
              </>
            )}
          </div>
        </div>

        {/* Total Credits Earned */}
        <div className="relative overflow-hidden rounded-xl bg-bg-secondary/50 border border-white/10 p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-neon-blue/10 blur-[40px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-neon-blue/20 flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-neon-blue drop-shadow-[0_0_8px_rgba(60,203,255,0.6)]" />
              </div>
              <span className="text-text-secondary text-sm">Total gagné</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{totalCreditsEarned.toLocaleString()}</span>
              <span className="text-text-secondary">crédits</span>
            </div>
            <p className="mt-2 text-xs text-text-secondary">Depuis ton abonnement</p>
          </div>
        </div>
      </motion.section>

      {/* Progress Section */}
      {nextTierConfig && (
        <motion.section
          variants={itemVariants}
          className="rounded-xl bg-bg-secondary/50 border border-white/10 p-5"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Progression V.I.P</h2>

          {/* Progress Path */}
          <div className="relative">
            {/* Progress Bar */}
            <div className="h-3 rounded-full bg-bg-tertiary overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>

            {/* Tier Markers */}
            <div className="flex justify-between mt-4">
              {/* Current Tier */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center ${config.shadowColor}`}>
                  <MedalIcon className="w-5 h-5 text-[#0B0F1A]" />
                </div>
                <span className={`text-xs mt-2 font-medium ${config.textColor}`}>{config.name}</span>
              </div>

              {/* Next Tier */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${nextTierConfig.color} flex items-center justify-center opacity-50`}>
                  <MedalIcon className="w-5 h-5 text-[#0B0F1A]" />
                </div>
                <span className={`text-xs mt-2 font-medium ${nextTierConfig.textColor} opacity-50`}>{nextTierConfig.name}</span>
              </div>
            </div>

            {/* Progress Text */}
            <p className="text-center text-sm text-text-secondary mt-4">
              <span className="text-white font-medium">{daysUntilNextTier} jours</span> restants pour passer{' '}
              <span className={nextTierConfig.textColor}>{nextTierConfig.name}</span>
            </p>
          </div>
        </motion.section>
      )}

      {/* Current Benefits */}
      <motion.section variants={itemVariants}>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SparkleIcon className={`w-5 h-5 ${config.textColor} ${config.glowColor}`} />
          Tes avantages V.I.P
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              variants={itemVariants}
              custom={index}
              className={`relative overflow-hidden rounded-xl ${config.bgColor} border ${config.borderColor} p-4 group hover:border-opacity-50 transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                  <benefit.icon className="w-5 h-5 text-[#0B0F1A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{benefit.title}</h3>
                    <CheckIcon className={`w-4 h-4 ${config.textColor}`} />
                  </div>
                  <p className="text-sm text-text-secondary">{benefit.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Locked Benefits */}
      {lockedBenefits.length > 0 && (
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white/50 mb-4 flex items-center gap-2">
            <LockIcon className="w-5 h-5 text-white/30" />
            Prochains avantages à débloquer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lockedBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-4 opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-white/30" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white/50">{benefit.title}</h3>
                      <LockIcon className="w-4 h-4 text-white/30" />
                    </div>
                    <p className="text-sm text-white/30">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Quick Actions */}
      <motion.section
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link
          href="/lobby?category=vip"
          className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r ${config.color} text-[#0B0F1A] font-bold hover:opacity-90 transition-all transform hover:scale-[1.02] ${config.shadowColor}`}
        >
          <DiamondIcon className="w-5 h-5" />
          Voir les produits V.I.P
          <ArrowRightIcon className="w-5 h-5" />
        </Link>

        <button
          onClick={onManageSubscription}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
        >
          <SettingsIcon className="w-5 h-5 text-text-secondary" />
          Gérer mon abonnement
        </button>
      </motion.section>
    </motion.div>
  )
}
