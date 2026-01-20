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

// SVG products mapping (same as GameCard)
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

  // Default: deterministic based on itemId
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

export function ProfileClient({ profile, wins, gamesPlayed, totalValueWon }: ProfileClientProps) {
  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState(profile.username || '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isSavingUsername, setIsSavingUsername] = useState(false)

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

    // Preview
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
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

  const winRate = gamesPlayed > 0 ? ((wins.length / gamesPlayed) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen pb-20">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-neon-pink/10 rounded-full blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] w-40 h-40 bg-neon-blue/10 rounded-full blur-[80px]" />
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-success/90 text-white font-medium shadow-lg shadow-success/30"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Profile card with gradient border */}
          <div
            className="relative rounded-3xl overflow-hidden p-6 md:p-8"
            style={{
              background: 'linear-gradient(rgba(20, 27, 45, 0.95), rgba(20, 27, 45, 0.95)) padding-box, linear-gradient(135deg, #FF4FD8, #9B5CFF, #3CCBFF) border-box',
              border: '2px solid transparent',
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-neon-pink/5" />

            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(rgba(20, 27, 45, 1), rgba(20, 27, 45, 1)) padding-box, linear-gradient(135deg, #FF4FD8, #9B5CFF) border-box',
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
                    <div className="w-full h-full bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 flex items-center justify-center">
                      <span className="text-5xl font-bold text-neon-purple">
                        {profile.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}

                  {/* Upload overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {avatarError && (
                  <p className="absolute -bottom-6 left-0 right-0 text-center text-xs text-danger">
                    {avatarError}
                  </p>
                )}
              </div>

              {/* User info */}
              <div className="flex-1 text-center md:text-left">
                {/* Username with edit */}
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-bg-secondary border border-white/10 text-white text-xl font-bold focus:outline-none focus:border-neon-purple"
                        maxLength={20}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername}
                        className="p-2 rounded-xl bg-success hover:bg-success/80 text-white transition-colors disabled:opacity-50"
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
                        onClick={() => {
                          setIsEditingUsername(false)
                          setNewUsername(profile.username || '')
                          setUsernameError(null)
                        }}
                        className="p-2 rounded-xl bg-danger/20 hover:bg-danger/30 text-danger transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        {profile.username || 'Joueur'}
                      </h1>
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                {usernameError && (
                  <p className="text-danger text-sm mb-2">{usernameError}</p>
                )}

                {/* Member since */}
                <p className="text-white/50 mb-4">
                  Membre depuis {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                    : '-'}
                </p>

                {/* Quick actions */}
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Link
                    href="/lobby"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-neon-purple"
                  >
                    Jouer maintenant
                  </Link>
                  <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium text-sm hover:bg-white/10 transition-colors">
                    Parametres
                  </button>
                </div>
              </div>

              {/* Credits badge - top right */}
              <div className="absolute top-4 right-4 md:static">
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 199, 255, 0.15), rgba(0, 199, 255, 0.05))',
                    border: '1px solid rgba(0, 199, 255, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="w-5 h-5 text-neon-blue" />
                    <span className="text-2xl font-bold text-neon-blue">
                      {(profile.credits || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Credits</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            icon={<TrophyIcon className="w-6 h-6" />}
            value={wins.length}
            label="Victoires"
            color="success"
          />
          <StatCard
            icon={<GamepadIcon className="w-6 h-6" />}
            value={gamesPlayed}
            label="Parties jouees"
            color="neon-purple"
          />
          <StatCard
            icon={<CursorClickIcon className="w-6 h-6" />}
            value={profile.total_clicks || 0}
            label="Clics totaux"
            color="neon-pink"
          />
          <StatCard
            icon={<FireIcon className="w-6 h-6" />}
            value={`${winRate}%`}
            label="Taux de victoire"
            color="warning"
          />
        </motion.div>

        {/* Total value won */}
        {totalValueWon > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div
              className="relative rounded-2xl overflow-hidden p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(16, 185, 129, 0.05))',
                border: '1px solid rgba(0, 255, 136, 0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                    <StarIcon className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <div className="text-white/50 text-sm uppercase tracking-wider mb-1">
                      Valeur totale remportee
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-success">
                      {totalValueWon.toLocaleString()}€
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <CrownIcon className="w-16 h-16 text-success/30" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wins history */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GiftIcon className="w-6 h-6 text-neon-purple" />
              Mes victoires
            </h2>
            {wins.length > 0 && (
              <span className="text-white/50 text-sm">{wins.length} objet{wins.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {wins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wins.map((win, index) => (
                <motion.div
                  key={win.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="group relative rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(rgba(20, 27, 45, 0.95), rgba(20, 27, 45, 0.95)) padding-box, linear-gradient(135deg, #00FF88, #10B981) border-box',
                    border: '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Product image */}
                    <div className="relative w-20 h-20 rounded-xl bg-bg-tertiary/50 flex-shrink-0 overflow-hidden">
                      <Image
                        src={getProductImage(win.item_name, win.item_id)}
                        alt={win.item_name}
                        fill
                        className="object-contain p-2 drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate mb-1">
                        {win.item_name}
                      </h3>
                      <p className="text-white/40 text-sm mb-2">
                        Gagné le {new Date(win.won_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      {(win.item_value || win.item?.retail_value) && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-success/20">
                          <span className="text-success font-bold">
                            {(win.item_value || win.item?.retail_value || 0).toFixed(0)}€
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Trophy badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                      <TrophyIcon className="w-5 h-5 text-success" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: 'linear-gradient(rgba(20, 27, 45, 0.95), rgba(20, 27, 45, 0.95)) padding-box, linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)) border-box',
                border: '1px solid transparent',
              }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                <GamepadIcon className="w-10 h-10 text-neon-purple" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Aucune victoire pour l&apos;instant
              </h3>
              <p className="text-white/50 mb-6 max-w-sm mx-auto">
                Tu n&apos;as pas encore remporte de partie. Continue de jouer et ta premiere victoire arrivera bientot !
              </p>
              <Link
                href="/lobby"
                className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold hover:opacity-90 transition-opacity shadow-neon-purple"
              >
                Jouer maintenant
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Stat card component
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  color: 'success' | 'neon-purple' | 'neon-pink' | 'neon-blue' | 'warning'
}) {
  const colorClasses = {
    success: {
      bg: 'bg-success/10',
      border: 'border-success/20',
      text: 'text-success',
      icon: 'text-success',
    },
    'neon-purple': {
      bg: 'bg-neon-purple/10',
      border: 'border-neon-purple/20',
      text: 'text-neon-purple',
      icon: 'text-neon-purple',
    },
    'neon-pink': {
      bg: 'bg-neon-pink/10',
      border: 'border-neon-pink/20',
      text: 'text-neon-pink',
      icon: 'text-neon-pink',
    },
    'neon-blue': {
      bg: 'bg-neon-blue/10',
      border: 'border-neon-blue/20',
      text: 'text-neon-blue',
      icon: 'text-neon-blue',
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      text: 'text-warning',
      icon: 'text-warning',
    },
  }

  const classes = colorClasses[color]

  return (
    <div
      className={`relative rounded-2xl p-4 ${classes.bg} border ${classes.border} overflow-hidden`}
    >
      {/* Icon badge */}
      <div className={`w-10 h-10 rounded-xl ${classes.bg} flex items-center justify-center mb-3`}>
        <div className={classes.icon}>{icon}</div>
      </div>

      {/* Value */}
      <div className={`text-2xl md:text-3xl font-bold ${classes.text} mb-1`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Label */}
      <div className="text-white/50 text-xs uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
