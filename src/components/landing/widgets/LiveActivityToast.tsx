'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'

interface WinNotification {
  id: string
  username: string
  item: string
  itemImage: string
  value: number
  timestamp: number
}

// Prenoms francais courants
const FRENCH_FIRST_NAMES = [
  'Lucas', 'Hugo', 'Theo', 'Nathan', 'Mathis', 'Enzo', 'Louis', 'Gabriel',
  'Emma', 'Lea', 'Chloe', 'Manon', 'Camille', 'Sarah', 'Julie', 'Marie',
  'Thomas', 'Antoine', 'Maxime', 'Alexandre', 'Quentin', 'Nicolas', 'Julien',
  'Clement', 'Romain', 'Kevin', 'Dylan', 'Florian', 'Alexis', 'Jordan',
  'Laura', 'Marion', 'Pauline', 'Morgane', 'Clara', 'Oceane', 'Lisa', 'Anais'
]

// Suffixes credibles
const SUFFIXES = [
  '', '59', '62', '75', '69', '13', '33', '31', '44', '67',
  '_off', '_fr', '2k', '93', '94', '77', '78', '91', '92', '95',
  'music', 'pro', 'bzh', 'life', 'x', 'music', '01', '06', '83'
]

// Genere un pseudo francais credible
function generateFrenchUsername(): string {
  const firstName = FRENCH_FIRST_NAMES[Math.floor(Math.random() * FRENCH_FIRST_NAMES.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]

  // Variations de style
  const style = Math.random()
  if (style < 0.3) {
    // prenom + nombre (ex: Lucas75)
    return firstName.toLowerCase() + suffix
  } else if (style < 0.5) {
    // Prenom avec majuscule + suffix (ex: Emma_off)
    return firstName + suffix
  } else if (style < 0.7) {
    // tout en minuscule (ex: thomasmusic)
    return firstName.toLowerCase() + suffix.replace('_', '')
  } else {
    // avec underscore (ex: hugo_59)
    return firstName.toLowerCase() + (suffix.startsWith('_') ? suffix : '_' + suffix).replace('__', '_')
  }
}

const MOCK_ITEMS = [
  { name: 'iPhone 15 Pro', value: 1299, image: '/products/iphone-15-pro.svg' },
  { name: 'PS5', value: 549, image: '/products/ps5.svg' },
  { name: 'AirPods Pro', value: 279, image: '/products/airpods-pro.svg' },
  { name: 'MacBook Pro', value: 2499, image: '/products/macbook-pro.svg' },
  { name: 'iPad Pro', value: 1099, image: '/products/ipad-pro.svg' },
  { name: 'Apple Watch', value: 449, image: '/products/apple-watch.svg' },
]

const TOAST_DURATION = 6000 // 6 seconds

interface LiveActivityToastProps {
  enabled?: boolean
  maxVisible?: number
}

// Gaming trophy icon SVG
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2" strokeLinecap="round" />
      <path d="M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2" strokeLinecap="round" />
      <path d="M6 3h12v6a6 6 0 01-12 0V3z" />
      <path d="M12 15v4" strokeLinecap="round" />
      <path d="M8 21h8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LiveActivityToast({ enabled = true, maxVisible = 3 }: LiveActivityToastProps) {
  const [notifications, setNotifications] = useState<WinNotification[]>([])

  const addWinNotification = useCallback(() => {
    const id = Math.random().toString(36).substring(7)
    const username = generateFrenchUsername()
    const item = MOCK_ITEMS[Math.floor(Math.random() * MOCK_ITEMS.length)]

    const newNotification: WinNotification = {
      id,
      username,
      item: item.name,
      itemImage: item.image,
      value: item.value,
      timestamp: Date.now(),
    }

    setNotifications(prev => [newNotification, ...prev].slice(0, maxVisible))

    // Auto-remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, TOAST_DURATION)
  }, [maxVisible])

  // Show winners every 1 minute to not be aggressive
  useEffect(() => {
    if (!enabled) return

    // Initial notification after 5 seconds
    const initialTimeout = setTimeout(addWinNotification, 5000)

    // Then every 60 seconds
    const interval = setInterval(() => {
      addWinNotification()
    }, 60000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [enabled, addWinNotification])

  if (!enabled) return null

  return (
    <div className="fixed bottom-3 md:bottom-6 left-2 md:left-6 z-50 flex flex-col gap-2 md:gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -200 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="pointer-events-auto group"
          >
            {/* MOBILE VERSION - Ultra compact */}
            <div className="md:hidden relative overflow-hidden rounded-lg">
              <div className="relative flex items-center gap-2 px-2 py-1.5 bg-bg-secondary/95 border border-success/30 rounded-lg max-w-[200px]">
                {/* Product image */}
                <div className="relative flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-neon-purple/10">
                  <Image
                    src={notification.itemImage}
                    alt={notification.item}
                    fill
                    className="object-contain p-0.5"
                    sizes="32px"
                  />
                </div>
                {/* Content - minimal */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] truncate">
                    <span className="font-bold text-white">{notification.username.slice(0, 8)}</span>
                    <span className="text-success"> a gagné</span>
                  </p>
                  <p className="text-[10px] font-bold text-success">{notification.value}€</p>
                </div>
              </div>
            </div>

            {/* DESKTOP VERSION - Full */}
            <div className="hidden md:block relative overflow-hidden rounded-xl">
              <div className="relative flex items-center gap-3 px-4 py-3 bg-bg-secondary/95 backdrop-blur-xl border border-success/40 rounded-xl">
                {/* Product image with glow */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-xl blur-md" />
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neon-purple/10 border border-white/10">
                    <Image
                      src={notification.itemImage}
                      alt={notification.item}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-bg-secondary">
                    <TrophyIcon className="w-3 h-3 text-bg-primary" />
                  </div>
                </div>
                {/* Content */}
                <div className="relative flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-bold text-white">{notification.username}</span>
                    <span className="text-success font-medium"> a gagné</span>
                  </p>
                  <p className="text-sm truncate">
                    <span className="font-bold text-neon-blue">{notification.item}</span>
                    <span className="text-success font-bold ml-2">{notification.value}€</span>
                  </p>
                </div>
                {/* Live indicator */}
                <div className="relative flex-shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative rounded-full h-2 w-2 bg-success" />
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-success to-neon-blue"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
