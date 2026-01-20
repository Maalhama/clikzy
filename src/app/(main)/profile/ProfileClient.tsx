'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { updateUsername, uploadAvatar } from '@/actions/profile'
import {
  TrophyIcon,
  CursorClickIcon,
  CoinsIcon,
  CrownIcon,
  GiftIcon,
  GamepadIcon,
  StarIcon,
  FireIcon,
  SparklesIcon,
} from '@/components/ui/GamingIcons'
import type { Profile, Winner, Item } from '@/types/database'

type WinnerWithItem = Winner & {
  item: Item
}

interface ProfileClientProps {
  profile: Profile
  wins: WinnerWithItem[]
  gamesPlayed: number
  totalValueWon: number
}

// SVG products mapping
function getProductImage(itemName: string, itemId: string): string {
  const nameLower = itemName.toLowerCase()

  if (nameLower.includes('iphone')) return '/products/iphone-15-pro.svg'
  if (nameLower.includes('macbook')) return '/products/macbook-pro.svg'
  if (nameLower.includes('airpods max')) return '/products/airpods-max.svg'
  if (nameLower.includes('airpods')) return '/products/airpods-pro.svg'
  if (nameLower.includes('ipad')) return '/products/ipad-pro.svg'
  if (nameLower.includes('apple watch')) return '/products/apple-watch.svg'
  if (nameLower.includes('playstation') || nameLower.includes('ps5')) return '/products/ps5.svg'
  if (nameLower.includes('xbox')) return '/products/xbox-series-x.svg'
  if (nameLower.includes('nintendo') || nameLower.includes('switch')) return '/products/nintendo-switch.svg'
  if (nameLower.includes('samsung') || nameLower.includes('galaxy')) return '/products/samsung-galaxy.svg'
  if (nameLower.includes('drone') || nameLower.includes('dji')) return '/products/dji-drone.svg'
  if (nameLower.includes('gopro')) return '/products/gopro-hero.svg'
  if (nameLower.includes('sony') && nameLower.includes('casque')) return '/products/sony-headphones.svg'
  if (nameLower.includes('dyson')) return '/products/dyson-vacuum.svg'
  if (nameLower.includes('rolex')) return '/products/rolex-watch.svg'
  if (nameLower.includes('jordan') || nameLower.includes('nike')) return '/products/nike-jordan.svg'
  if (nameLower.includes('tv')) return '/products/samsung-tv.svg'

  const products = [
    '/products/iphone-15-pro.svg',
    '/products/ps5.svg',
    '/products/macbook-pro.svg',
    '/products/airpods-pro.svg',
    '/products/apple-watch.svg',
    '/products/nintendo-switch.svg',
    '/products/samsung-galaxy.svg',
    '/products/dji-drone.svg',
  ]
  const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return products[hash % products.length]
}

// Calculate player level based on stats
function getPlayerLevel(wins: number, clicks: number, gamesPlayed: number): { level: number; title: string; progress: number; nextLevel: number } {
  const xp = wins * 1000 + clicks + gamesPlayed * 10

  const levels = [
    { level: 1, title: 'Debutant', xp: 0 },
    { level: 2, title: 'Apprenti', xp: 100 },
    { level: 3, title: 'Joueur', xp: 500 },
    { level: 4, title: 'Competiteur', xp: 1500 },
    { level: 5, title: 'Expert', xp: 3000 },
    { level: 6, title: 'Maitre', xp: 6000 },
    { level: 7, title: 'Champion', xp: 10000 },
    { level: 8, title: 'Legende', xp: 20000 },
    { level: 9, title: 'Elite', xp: 50000 },
    { level: 10, title: 'Mythique', xp: 100000 },
  ]

  let currentLevel = levels[0]
  let nextLevelXp = levels[1].xp

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xp) {
      currentLevel = levels[i]
      nextLevelXp = levels[i + 1]?.xp || levels[i].xp * 2
      break
    }
  }

  const progress = Math.min(((xp - currentLevel.xp) / (nextLevelXp - currentLevel.xp)) * 100, 100)

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    progress,
    nextLevel: nextLevelXp - xp
  }
}

export function ProfileClient({ profile, wins, gamesPlayed, totalValueWon }: ProfileClientProps) {
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState(profile.username || '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const playerLevel = getPlayerLevel(wins.length, profile.total_clicks || 0, gamesPlayed)
  const winRate = gamesPlayed > 0 ? ((wins.length / gamesPlayed) * 100).toFixed(1) : '0'

  async function handleSaveUsername() {
    setUsernameError(null)
    setIsSavingUsername(true)
    const result = await updateUsername(newUsername)
    if (result.success) {
      setIsEditingUsername(false)
      setSuccessMessage('Pseudo mis a jour !')
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
      setSuccessMessage('Avatar mis a jour !')
      setTimeout(() => setSuccessMessage(null), 3000)
    } else {
      setAvatarError(result.error || 'Erreur')
      setAvatarPreview(null)
    }
    setIsUploadingAvatar(false)
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] left-[10%] w-96 h-96 bg-neon-purple/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-neon-pink/10 rounded-full blur-[180px]" />
        <div className="absolute top-[40%] right-[30%] w-64 h-64 bg-neon-blue/10 rounded-full blur-[100px]" />
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-success text-white font-semibold shadow-lg shadow-success/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Hero Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(rgba(20, 27, 45, 0.98), rgba(20, 27, 45, 0.95)) padding-box, linear-gradient(135deg, #FF4FD8, #9B5CFF, #3CCBFF) border-box',
              border: '2px solid transparent',
            }}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(155,92,255,0.15),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,79,216,0.15),transparent_50%)]" />
            </div>

            <div className="relative p-6 md:p-8">
              {/* Top row: Credits badge */}
              <div className="flex justify-end mb-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="px-4 py-2.5 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="w-5 h-5 text-neon-blue" />
                    <span className="text-xl font-bold text-neon-blue">
                      {(profile.credits || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-white/50 uppercase">credits</span>
                  </div>
                </motion.div>
              </div>

              {/* Main profile content */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar with level ring */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="relative group"
                >
                  {/* Level ring */}
                  <div
                    className="absolute -inset-2 rounded-3xl opacity-75"
                    style={{
                      background: `conic-gradient(from 0deg, #9B5CFF ${playerLevel.progress}%, transparent ${playerLevel.progress}%)`,
                      filter: 'blur(2px)',
                    }}
                  />
                  <div
                    className="relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(rgba(11, 15, 26, 1), rgba(11, 15, 26, 1)) padding-box, linear-gradient(135deg, #FF4FD8, #9B5CFF) border-box',
                      border: '3px solid transparent',
                    }}
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
                        <span className="text-6xl font-black text-white/80">
                          {profile.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}

                    {/* Upload overlay */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer"
                    >
                      {isUploadingAvatar ? (
                        <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs text-white/80">Modifier</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

                  {/* Level badge */}
                  <div className="absolute -bottom-2 -right-2 px-3 py-1.5 rounded-xl bg-neon-purple text-white text-sm font-bold shadow-lg shadow-neon-purple/50">
                    Niv. {playerLevel.level}
                  </div>

                  {avatarError && (
                    <p className="absolute -bottom-8 left-0 right-0 text-center text-xs text-danger">{avatarError}</p>
                  )}
                </motion.div>

                {/* User info */}
                <div className="flex-1 text-center md:text-left">
                  {/* Username */}
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                    {isEditingUsername ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="px-4 py-2 rounded-xl bg-bg-tertiary border border-white/20 text-white text-xl font-bold focus:outline-none focus:border-neon-purple transition-colors"
                          maxLength={20}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveUsername}
                          disabled={isSavingUsername}
                          className="p-2.5 rounded-xl bg-success hover:bg-success/80 text-white transition-all hover:scale-105 disabled:opacity-50"
                        >
                          {isSavingUsername ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => { setIsEditingUsername(false); setNewUsername(profile.username || ''); setUsernameError(null) }}
                          className="p-2.5 rounded-xl bg-danger/20 hover:bg-danger/30 text-danger transition-all hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-3xl md:text-4xl font-black text-white">
                          {profile.username || 'Joueur'}
                        </h1>
                        <button
                          onClick={() => setIsEditingUsername(true)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {usernameError && <p className="text-danger text-sm mb-2">{usernameError}</p>}

                  {/* Level title & progress */}
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-neon-purple/20 text-neon-purple text-sm font-semibold">
                      {playerLevel.title}
                    </span>
                    <span className="text-white/40 text-sm">
                      {playerLevel.nextLevel.toLocaleString()} XP avant niveau {playerLevel.level + 1}
                    </span>
                  </div>

                  {/* XP Progress bar */}
                  <div className="w-full max-w-xs mx-auto md:mx-0 mb-4">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${playerLevel.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-pink"
                      />
                    </div>
                  </div>

                  {/* Member since */}
                  <p className="text-white/40 text-sm mb-4">
                    Membre depuis {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                      : '-'}
                  </p>

                  {/* Quick actions */}
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <Link
                      href="/lobby"
                      className="group px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold hover:shadow-lg hover:shadow-neon-purple/30 transition-all hover:scale-105"
                    >
                      <span className="flex items-center gap-2">
                        <GamepadIcon className="w-5 h-5" />
                        Jouer
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6"
        >
          <StatCard icon={<TrophyIcon className="w-6 h-6" />} value={wins.length} label="Victoires" color="success" delay={0} />
          <StatCard icon={<GamepadIcon className="w-6 h-6" />} value={gamesPlayed} label="Parties" color="neon-purple" delay={0.05} />
          <StatCard icon={<CursorClickIcon className="w-6 h-6" />} value={profile.total_clicks || 0} label="Clics" color="neon-pink" delay={0.1} />
          <StatCard icon={<FireIcon className="w-6 h-6" />} value={`${winRate}%`} label="Win rate" color="warning" delay={0.15} />
        </motion.div>

        {/* Total Value Won */}
        {totalValueWon > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div
              className="relative rounded-2xl overflow-hidden p-5 md:p-6 group hover:scale-[1.01] transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(16, 185, 129, 0.05))',
                border: '1px solid rgba(0, 255, 136, 0.3)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                    <StarIcon className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Valeur totale gagnee</div>
                    <div className="text-3xl md:text-4xl font-black text-success">{totalValueWon.toLocaleString()}€</div>
                  </div>
                </div>
                <CrownIcon className="w-14 h-14 md:w-20 md:h-20 text-success/20" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Wins History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <GiftIcon className="w-6 h-6 text-neon-purple" />
              Mes victoires
            </h2>
            {wins.length > 0 && (
              <span className="px-3 py-1 rounded-lg bg-success/10 text-success text-sm font-semibold">
                {wins.length} lot{wins.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {wins.length > 0 ? (
            <>
              {/* Mobile: Horizontal scroll */}
              <div className="md:hidden -mx-4 px-4">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                  {wins.map((win, index) => (
                    <WinCard key={win.id} win={win} index={index} />
                  ))}
                </div>
              </div>

              {/* Desktop: Grid */}
              <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {wins.map((win, index) => (
                  <WinCard key={win.id} win={win} index={index} />
                ))}
              </div>
            </>
          ) : (
            <EmptyWinsState />
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Stat card with hover effects
function StatCard({
  icon,
  value,
  label,
  color,
  delay,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  color: 'success' | 'neon-purple' | 'neon-pink' | 'neon-blue' | 'warning'
  delay: number
}) {
  const colorClasses = {
    success: { bg: 'bg-success/10', border: 'border-success/20', text: 'text-success', glow: 'hover:shadow-success/20' },
    'neon-purple': { bg: 'bg-neon-purple/10', border: 'border-neon-purple/20', text: 'text-neon-purple', glow: 'hover:shadow-neon-purple/20' },
    'neon-pink': { bg: 'bg-neon-pink/10', border: 'border-neon-pink/20', text: 'text-neon-pink', glow: 'hover:shadow-neon-pink/20' },
    'neon-blue': { bg: 'bg-neon-blue/10', border: 'border-neon-blue/20', text: 'text-neon-blue', glow: 'hover:shadow-neon-blue/20' },
    warning: { bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning', glow: 'hover:shadow-warning/20' },
  }
  const classes = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + delay }}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`relative rounded-2xl p-4 ${classes.bg} border ${classes.border} overflow-hidden cursor-default hover:shadow-lg ${classes.glow} transition-shadow`}
    >
      <div className={`w-10 h-10 rounded-xl ${classes.bg} flex items-center justify-center mb-3`}>
        <div className={classes.text}>{icon}</div>
      </div>
      <div className={`text-2xl md:text-3xl font-bold ${classes.text} mb-1`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-white/50 text-xs uppercase tracking-wider">{label}</div>
    </motion.div>
  )
}

// Win card component
function WinCard({ win, index }: { win: WinnerWithItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="flex-shrink-0 w-[280px] md:w-auto snap-start group relative rounded-2xl overflow-hidden cursor-default"
      style={{
        background: 'linear-gradient(rgba(20, 27, 45, 0.98), rgba(20, 27, 45, 0.95)) padding-box, linear-gradient(135deg, #00FF88, #10B981) border-box',
        border: '1.5px solid transparent',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-4 p-4">
        <div className="relative w-20 h-20 rounded-xl bg-bg-tertiary/50 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
          <Image
            src={getProductImage(win.item_name, win.item_id)}
            alt={win.item_name}
            fill
            className="object-contain p-2 drop-shadow-[0_0_15px_rgba(0,255,136,0.4)]"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate mb-1">{win.item_name}</h3>
          <p className="text-white/40 text-sm mb-2">
            {new Date(win.won_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {(win.item_value || win.item?.retail_value) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-success/20 text-success font-bold text-sm">
              {(win.item_value || win.item?.retail_value || 0).toFixed(0)}€
            </span>
          )}
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <TrophyIcon className="w-5 h-5 text-success" />
        </div>
      </div>
    </motion.div>
  )
}

// Empty state component
function EmptyWinsState() {
  return (
    <div
      className="rounded-2xl p-10 md:p-12 text-center"
      style={{
        background: 'linear-gradient(rgba(20, 27, 45, 0.95), rgba(20, 27, 45, 0.95)) padding-box, linear-gradient(135deg, rgba(155,92,255,0.3), rgba(255,79,216,0.2)) border-box',
        border: '1.5px solid transparent',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center"
      >
        <SparklesIcon className="w-10 h-10 text-neon-purple" />
      </motion.div>
      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Ta premiere victoire t&apos;attend !</h3>
      <p className="text-white/50 mb-6 max-w-sm mx-auto">
        Chaque clic te rapproche de ton premier lot. Lance-toi et montre de quoi tu es capable !
      </p>
      <Link
        href="/lobby"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold hover:shadow-lg hover:shadow-neon-purple/30 transition-all hover:scale-105"
      >
        <GamepadIcon className="w-5 h-5" />
        Commencer a jouer
      </Link>
    </div>
  )
}
