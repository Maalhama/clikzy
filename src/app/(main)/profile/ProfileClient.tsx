'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { updateUsername, uploadAvatar } from '@/actions/profile'
import { CreditPacksModal } from '@/components/modals/CreditPacksModal'
import { NotificationsCard } from '@/components/profile/NotificationsCard'
import { GameHistorySection } from '@/components/profile/GameHistorySection'
import { ReferralSection } from '@/components/profile/ReferralSection'
import { BadgesSection } from '@/components/profile/BadgesSection'
import { BuyItNowSection } from '@/components/profile/BuyItNowSection'
import { ProgressionCard } from '@/components/progression/ProgressionCard'
import { getProductSvg } from '@/lib/utils/productImages'
import type { Badge } from '@/actions/badges'
import {
  TrophyIcon,
  GiftIcon,
  GamepadIcon,
  SparklesIcon,
} from '@/components/ui/GamingIcons'
import type { Profile, Winner, Item } from '@/types/database'
import type { GameHistoryItem } from '@/actions/gameHistory'
import type { ShippingAddress } from '@/actions/shipping'
import { ShippingAddressForm } from '@/components/forms/ShippingAddressForm'

type WinnerWithItem = Winner & {
  item: Item
}

interface ProfileClientProps {
  profile: Profile
  wins: WinnerWithItem[]
  shippingAddress?: ShippingAddress | null
  gamesPlayed: number
  totalValueWon: number
  gameHistory: GameHistoryItem[]
  historyStats: {
    totalGames: number
    totalClicks: number
    wins: number
    winRate: number
  }
  referralStats: {
    referralCode: string | null
    referralCount: number
    creditsEarned: number
    referredBy: string | null
  }
  badges: {
    badge: Badge
    earned: boolean
    earnedAt: string | null
  }[]
  badgeStats: {
    total: number
    earned: number
    byRarity: { rarity: string; total: number; earned: number }[]
  }
}

// Calculate player level based on stats
export function ProfileClient({ profile, wins, gamesPlayed, totalValueWon, gameHistory, historyStats, referralStats, badges, badgeStats, shippingAddress }: ProfileClientProps) {
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState(profile.username || '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)

  // Courbe XP serveur (xp_to_level) : niveau L atteint à 50·L·(L-1), 100·L XP par palier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xpTotal = Number((profile as any).xp ?? 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const level = Number((profile as any).level ?? 1) || 1
  const xpIntoLevel = Math.max(0, xpTotal - 50 * level * (level - 1))
  const xpForLevel = 100 * level
  const levelProgress = Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100))
  const levelTitle = level >= 20 ? 'Légende' : level >= 10 ? 'Expert' : level >= 5 ? 'Confirmé' : 'Débutant'
  const winRate = gamesPlayed > 0 ? ((wins.length / gamesPlayed) * 100).toFixed(1) : '0'

  async function handleSaveUsername() {
    setUsernameError(null)
    setIsSavingUsername(true)
    const result = await updateUsername(newUsername)
    if (result.success) {
      setIsEditingUsername(false)
      setSuccessMessage('Pseudo mis à jour !')
      setTimeout(() => setSuccessMessage(null), 3000)
    } else {
      setUsernameError(result.error || 'Erreur')
    }
    setIsSavingUsername(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
    setIsUploadingAvatar(true)
    setAvatarError(null)
    const formData = new FormData()
    formData.append('avatar', file)
    const result = await uploadAvatar(formData)
    if (result.success) {
      setSuccessMessage('Avatar mis à jour !')
      setTimeout(() => setSuccessMessage(null), 3000)
    } else {
      setAvatarError(result.error || 'Erreur')
      setAvatarPreview(null)
    }
    setIsUploadingAvatar(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-neon-pink/8 rounded-full blur-[120px]" />
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold shadow-lg shadow-neon-purple/30 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel overflow-hidden mb-6"
        >
          {/* Profile Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-neon-purple/50"
                >
                  {avatarPreview || profile.avatar_url ? (
                    <Image
                      src={avatarPreview || profile.avatar_url || ''}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 flex items-center justify-center">
                      <span className="text-3xl font-black text-white/80">
                        {profile.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}

                  {/* Upload overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

                {/* Level badge */}
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-neon-purple text-white text-xs font-bold">
                  {level}
                </div>

                {avatarError && (
                  <p className="absolute -bottom-6 left-0 text-[10px] text-danger whitespace-nowrap">{avatarError}</p>
                )}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                {/* Username */}
                {isEditingUsername ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-bg-primary border border-white/20 text-white text-lg font-bold focus:outline-none focus:border-neon-purple transition-colors"
                      maxLength={20}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={isSavingUsername}
                      className="p-2 rounded-lg bg-success hover:bg-success/80 text-white transition-all disabled:opacity-50"
                    >
                      {isSavingUsername ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => { setIsEditingUsername(false); setNewUsername(profile.username || ''); setUsernameError(null) }}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-white truncate">
                      {profile.username || 'Joueur'}
                    </h1>
                    {profile.is_vip && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                        <svg className="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        <span className="text-xs font-bold text-yellow-400 tracking-wide">V.I.P</span>
                      </span>
                    )}
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
                {usernameError && <p className="text-danger text-xs mb-1">{usernameError}</p>}

                {/* Level & title */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple text-xs font-medium">
                    {levelTitle}
                  </span>
                  <span className="text-white/40 text-xs">
                    {xpIntoLevel}/{xpForLevel} XP → Niv. {level + 1}
                  </span>
                </div>

                {/* XP Progress */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-pink"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 divide-x divide-white/10">
            <StatItem value={wins.length} label="Victoires" color="text-success" />
            <StatItem value={gamesPlayed} label="Parties" color="text-neon-purple" />
            <StatItem value={profile.total_clicks || 0} label="Clics" color="text-neon-pink" />
            <StatItem value={`${winRate}%`} label="Win rate" color="text-warning" />
          </div>
        </motion.div>

        {/* Buy Credits Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setShowCreditModal(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-neon-purple/10 via-neon-pink/10 to-neon-purple/10 border border-neon-purple/30 hover:border-neon-pink/50 p-4 mb-6 flex items-center justify-between group transition-all hover:shadow-lg hover:shadow-neon-purple/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-lg shadow-neon-purple/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-white font-bold">Mes crédits</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl stat-numeral text-neon-purple">{(profile.credits || 0) + (profile.earned_credits || 0)}</span>
                <span className="text-white/40 text-sm">disponibles</span>
              </div>
            </div>
          </div>
          <div className="btn-arena px-4 py-2 text-xs group-hover:scale-105">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Recharger
          </div>
        </motion.button>

        {/* Total Value Won */}
        {totalValueWon > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-success/10 border border-success/30 p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-white/50 text-xs">Valeur totale gagnée</div>
                <div className="text-2xl stat-numeral text-success">{totalValueWon.toLocaleString()}€</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-6"><NotificationsCard /></div>

        {/* Wins Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GiftIcon className="w-5 h-5 text-neon-purple" />
              Mes victoires
            </h2>
            {wins.length > 0 && (
              <span className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-medium">
                {wins.length} lot{wins.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {wins.length > 0 ? (
            <div className="space-y-3">
              {wins.map((win, index) => (
                <WinCard key={win.id} win={win} index={index} />
              ))}
            </div>
          ) : (
            <EmptyWinsState />
          )}
        </motion.div>

        {/* Adresse de livraison (réception des lots) */}
        <ShippingSection initial={shippingAddress ?? null} hasWins={wins.length > 0} />

        {/* Progression : niveau/XP, streak, quêtes du jour */}
        <div className="mt-8">
          <ProgressionCard />
        </div>

        {/* Rachat malin — racheter les enchères perdues à prix réduit */}
        <div className="mt-8 mb-6"><BuyItNowSection /></div>

        {/* Badges Section */}
        <BadgesSection badges={badges} stats={badgeStats} />

        {/* Referral Section */}
        <div className="mt-8 mb-6">
          <ReferralSection
            referralCode={referralStats.referralCode}
            referralCount={referralStats.referralCount}
            creditsEarned={referralStats.creditsEarned}
            hasReferrer={!!referralStats.referredBy}
          />
        </div>

        {/* Game History Section */}
        <GameHistorySection history={gameHistory} stats={historyStats} />

        {/* Play CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            href="/lobby"
            className="btn-arena px-8 py-4 text-sm"
          >
            <GamepadIcon className="w-5 h-5" />
            Jouer maintenant
          </Link>
        </motion.div>

        {/* Member since */}
        <p className="text-center text-white/50 text-xs mt-6">
          Membre depuis {profile.created_at
            ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
            : '-'}
        </p>
      </main>

      {/* Credit Packs Modal */}
      <CreditPacksModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />
    </div>
  )
}

// Compact stat item
function StatItem({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="p-4 text-center">
      <div className={`text-xl font-bold ${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  )
}

// Win card component
const SHIPPING_STEPS = ['processing', 'shipped', 'delivered'] as const

const SHIPPING_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'En préparation', cls: 'bg-white/10 text-white/60' },
  address_needed: { label: 'Adresse requise', cls: 'bg-yellow-400/15 text-yellow-300' },
  processing: { label: 'En préparation', cls: 'bg-neon-purple/15 text-neon-purple' },
  shipped: { label: 'Expédié', cls: 'bg-cyan-400/15 text-cyan-300' },
  delivered: { label: 'Livré', cls: 'bg-success/15 text-success' },
}

function WinCard({ win, index }: { win: WinnerWithItem; index: number }) {
  const status = win.shipping_status ?? 'pending'
  const badge = SHIPPING_LABEL[status] ?? SHIPPING_LABEL.pending
  const stepIndex = status === 'delivered' ? 3 : status === 'shipped' ? 2 : 1
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      className="p-3 rounded-xl bg-bg-secondary/50 border border-white/10 hover:border-success/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 rounded-lg bg-bg-primary/50 flex-shrink-0 overflow-hidden">
          <Image
            src={getProductSvg(win.item_name, win.item_id)}
            alt={win.item_name}
            fill
            className="object-contain p-1.5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{win.item_name}</h3>
          <p className="text-white/40 text-xs">
            {new Date(win.won_at ?? new Date(0).toISOString()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {(win.item_value || win.item?.retail_value) && (
            <span className="px-2.5 py-1 rounded-lg bg-success/20 text-success font-bold text-sm">
              {(win.item_value || win.item?.retail_value || 0).toFixed(0)}€
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Suivi de livraison */}
      <div className="mt-3 flex items-center gap-1.5">
        {SHIPPING_STEPS.map((step, i) => (
          <div key={step} className="flex flex-1 items-center gap-1.5">
            <span
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < stepIndex ? 'bg-success' : 'bg-white/10'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-[0.6rem] text-white/55">
        <span className={stepIndex >= 1 ? 'text-success' : ''}>Préparation</span>
        <span className={stepIndex >= 2 ? 'text-success' : ''}>
          Expédié{win.shipped_at ? ` · ${new Date(win.shipped_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
        </span>
        <span className={stepIndex >= 3 ? 'text-success' : ''}>
          Livré{win.delivered_at ? ` · ${new Date(win.delivered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
        </span>
      </div>
      {win.tracking_number && (
        <p className="mt-1.5 text-[0.65rem] text-white/45">
          N° de suivi : <span className="stat-numeral text-white/70">{win.tracking_number}</span>
        </p>
      )}
      {status === 'address_needed' && (
        <p className="mt-1.5 text-[0.65rem] font-semibold text-yellow-300">
          Renseigne ton adresse de livraison ci-dessous pour recevoir ton lot.
        </p>
      )}
    </motion.div>
  )
}

// Empty state component
function EmptyWinsState() {
  return (
    <div className="panel p-8 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
        <SparklesIcon className="w-7 h-7 text-neon-purple" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Ta première victoire t&apos;attend !</h3>
      <p className="text-white/50 text-sm mb-4 max-w-xs mx-auto">
        Chaque clic te rapproche de ton premier lot.
      </p>
      <Link
        href="/lobby"
        className="btn-arena px-5 py-2.5 text-xs"
      >
        <GamepadIcon className="w-4 h-4" />
        Commencer à jouer
      </Link>
    </div>
  )
}


function ShippingSection({ initial, hasWins }: { initial: ShippingAddress | null; hasWins: boolean }) {
  const [open, setOpen] = useState(hasWins && !initial?.address)
  const filled = !!initial?.address
  return (
    <div className="mt-8 panel p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <p className="font-display text-sm font-semibold text-white">Adresse de livraison</p>
          <p className="text-xs text-white/50">
            {filled
              ? `${initial?.address}, ${initial?.postalCode} ${initial?.city}`
              : 'Renseigne ton adresse pour recevoir tes lots'}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-semibold ${
          filled ? 'bg-success/15 text-success' : 'bg-yellow-400/15 text-yellow-300'
        }`}>
          {filled ? 'Complète' : 'À compléter'}
        </span>
      </button>
      {open && (
        <div className="mt-4">
          <ShippingAddressForm initialData={initial} compact onSuccess={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
