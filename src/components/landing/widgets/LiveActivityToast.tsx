'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useIsMobile } from '@/hooks/useIsMobile'

interface WinNotification {
  id: string
  username: string
  item: string
  itemImage: string
  value: number
  timestamp: number
  wonAt?: string // ISO date string for real winners
}

// Format relative time in French
function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return `il y a ${diffSeconds}s`
  } else if (diffMinutes < 60) {
    return `il y a ${diffMinutes}min`
  } else if (diffHours < 24) {
    return `il y a ${diffHours}h`
  } else {
    return `il y a ${diffDays}j`
  }
}

// Bot winners for toast notifications - diverse usernames
const BOT_WINNERS = [
  { username: 'Sami_paris', item: 'MacBook Pro', value: 2499, image: '/products/macbook-pro.svg' },
  { username: 'EvaMusic', item: 'iPhone 15 Pro', value: 1299, image: '/products/iphone-15-pro.svg' },
  { username: 'Ibra_sn', item: 'PlayStation 5', value: 549, image: '/products/ps5.svg' },
  { username: 'MarineL', item: 'Sony WH-1000XM5', value: 379, image: '/products/sony-headphones.svg' },
  { username: 'Bilal_69', item: 'AirPods Pro', value: 279, image: '/products/airpods-pro.svg' },
  { username: 'ChloeGames', item: 'iPad Pro', value: 1099, image: '/products/ipad-pro.svg' },
  { username: 'Amadou_ml', item: 'Apple Watch', value: 449, image: '/products/apple-watch.svg' },
  { username: 'Sarah_lh', item: 'Samsung Galaxy S24', value: 1469, image: '/products/samsung-galaxy.svg' },
  { username: 'Enzo_tls', item: 'MacBook Pro', value: 2499, image: '/products/macbook-pro.svg' },
  { username: 'Khadija_ma', item: 'Nintendo Switch', value: 349, image: '/products/nintendo-switch.svg' },
  { username: 'Lucas_44', item: 'AirPods Max', value: 579, image: '/products/airpods-max.svg' },
  { username: 'Jade_bzh', item: 'Xbox Series X', value: 499, image: '/products/xbox-series-x.svg' },
  { username: 'MohamedK', item: 'Steam Deck', value: 569, image: '/products/steam-deck.svg' },
  { username: 'Lea_rns', item: 'Meta Quest 3', value: 549, image: '/products/meta-quest.svg' },
  { username: 'Adama_ci', item: 'DJI Mini 4 Pro', value: 959, image: '/products/dji-drone.svg' },
  { username: 'MathisPlay', item: 'GoPro Hero 12', value: 449, image: '/products/gopro-hero.svg' },
]

const TOAST_DURATION = 6000 // 6 seconds

interface RealWinner {
  id: string
  username: string
  item_name: string
  item_value: number
  won_at: string
}

interface LiveActivityToastProps {
  enabled?: boolean
  maxVisible?: number
  realWinners?: RealWinner[]
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

export function LiveActivityToast({ enabled = true, maxVisible = 3, realWinners = [] }: LiveActivityToastProps) {
  const [notifications, setNotifications] = useState<WinNotification[]>([])
  const isMobile = useIsMobile()

  // Use refs to avoid useEffect re-running
  const winnerIndexRef = useRef(0)
  const realWinnersRef = useRef(realWinners)
  realWinnersRef.current = realWinners

  // Map item names to local SVG images
  const getItemImage = (itemName: string): string => {
    const name = itemName.toLowerCase()
    // Smartphones
    if (name.includes('iphone')) return '/products/iphone-15-pro.svg'
    if (name.includes('samsung') && name.includes('galaxy')) return '/products/samsung-galaxy.svg'
    if (name.includes('pixel')) return '/products/google-pixel.svg'
    // Gaming
    if (name.includes('ps5') || name.includes('playstation')) return '/products/ps5.svg'
    if (name.includes('xbox')) return '/products/xbox-series-x.svg'
    if (name.includes('switch') || name.includes('nintendo')) return '/products/nintendo-switch.svg'
    if (name.includes('steam deck')) return '/products/steam-deck.svg'
    if (name.includes('quest') || name.includes('meta')) return '/products/meta-quest.svg'
    if (name.includes('dualsense') || name.includes('manette')) return '/products/ps5-controller.svg'
    // Computers
    if (name.includes('macbook')) return '/products/macbook-pro.svg'
    if (name.includes('ipad')) return '/products/ipad-pro.svg'
    if (name.includes('imac')) return '/products/imac.svg'
    if (name.includes('rog') || name.includes('gaming') && name.includes('laptop')) return '/products/gaming-laptop.svg'
    // Audio
    if (name.includes('airpods max')) return '/products/airpods-max.svg'
    if (name.includes('airpods')) return '/products/airpods-pro.svg'
    if (name.includes('sony') && (name.includes('wh') || name.includes('casque') || name.includes('headphone'))) return '/products/sony-headphones.svg'
    if (name.includes('bose')) return '/products/bose-speaker.svg'
    if (name.includes('sonos')) return '/products/sonos-speaker.svg'
    if (name.includes('marshall') || name.includes('jbl')) return '/products/jbl-speaker.svg'
    if (name.includes('soundbar') || name.includes('arc')) return '/products/soundbar.svg'
    // Watches
    if (name.includes('apple watch') || name.includes('watch ultra')) return '/products/apple-watch.svg'
    if (name.includes('garmin') || name.includes('fenix')) return '/products/garmin-watch.svg'
    if (name.includes('rolex')) return '/products/rolex-watch.svg'
    // Photo/Video
    if (name.includes('gopro')) return '/products/gopro-hero.svg'
    if (name.includes('dji') || name.includes('drone') || name.includes('mavic')) return '/products/dji-drone.svg'
    if (name.includes('canon')) return '/products/canon-camera.svg'
    if (name.includes('sony') && name.includes('alpha')) return '/products/sony-camera.svg'
    // TV
    if (name.includes('lg') && name.includes('oled')) return '/products/lg-tv.svg'
    if (name.includes('samsung') && (name.includes('tv') || name.includes('qled'))) return '/products/samsung-tv.svg'
    // Mobility
    if (name.includes('trottinette') || name.includes('scooter') && !name.includes('vespa')) return '/products/electric-scooter.svg'
    if (name.includes('velo') || name.includes('bike') || name.includes('vanmoof') || name.includes('cowboy')) return '/products/electric-bike.svg'
    if (name.includes('vespa')) return '/products/vespa.svg'
    if (name.includes('moto') || name.includes('zero sr')) return '/products/electric-moto.svg'
    // Home
    if (name.includes('dyson') && name.includes('airwrap')) return '/products/dyson-airwrap.svg'
    if (name.includes('dyson')) return '/products/dyson-vacuum.svg'
    if (name.includes('thermomix')) return '/products/thermomix.svg'
    // Accessories
    if (name.includes('chaise') || name.includes('gaming chair') || name.includes('secretlab')) return '/products/gaming-chair.svg'
    if (name.includes('rayban')) return '/products/rayban-smart.svg'
    if (name.includes('louis vuitton') || name.includes('sac')) return '/products/louis-vuitton-bag.svg'
    if (name.includes('jordan') || name.includes('nike')) return '/products/nike-jordan.svg'
    // Fallback
    return '/products/gift-card.svg'
  }

  // Show winners every 60 seconds - stable useEffect with no changing dependencies
  useEffect(() => {
    if (!enabled) return

    const addWinNotification = () => {
      const id = Math.random().toString(36).substring(7)
      const currentIndex = winnerIndexRef.current
      const winners = realWinnersRef.current

      let username: string
      let itemName: string
      let itemImage: string
      let value: number
      let wonAt: string | undefined

      // Use real winners if available, cycling through them
      if (winners.length > 0) {
        const winner = winners[currentIndex % winners.length]
        username = winner.username
        itemName = winner.item_name
        itemImage = getItemImage(winner.item_name)
        value = winner.item_value
        wonAt = winner.won_at
      } else {
        // Fallback to bot winners with realistic usernames and fake recent time
        const botWinner = BOT_WINNERS[currentIndex % BOT_WINNERS.length]
        username = botWinner.username
        itemName = botWinner.item
        itemImage = botWinner.image
        value = botWinner.value
        // Generate fake recent time (between 5 minutes and 3 hours ago)
        const fakeMinutesAgo = Math.floor(Math.random() * 175) + 5
        wonAt = new Date(Date.now() - fakeMinutesAgo * 60 * 1000).toISOString()
      }

      winnerIndexRef.current = currentIndex + 1

      const newNotification: WinNotification = {
        id,
        username,
        item: itemName,
        itemImage,
        value,
        timestamp: Date.now(),
        wonAt,
      }

      setNotifications(prev => [newNotification, ...prev].slice(0, maxVisible))

      // Auto-remove after duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, TOAST_DURATION)
    }

    // Initial notification after 10 seconds
    const initialTimeout = setTimeout(addWinNotification, 10000)

    // Then every 60 seconds (1 minute)
    const interval = setInterval(addWinNotification, 60000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [enabled, maxVisible])

  if (!enabled) return null

  return (
    <div className="fixed bottom-3 md:bottom-6 left-2 md:left-6 z-50 flex flex-col gap-2 md:gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={isMobile ? { opacity: 0 } : { opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={isMobile ? { opacity: 0 } : { opacity: 0, x: -200 }}
            transition={{ duration: isMobile ? 0.15 : 0.3, ease: 'easeInOut' }}
            className="pointer-events-auto group"
          >
            {/* MOBILE VERSION - Ultra compact */}
            <div className="md:hidden relative overflow-hidden rounded-lg">
              <div className="relative flex items-center gap-2 px-2 py-1.5 bg-bg-secondary/95 border border-success/30 rounded-lg max-w-[220px]">
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
                    <span className="font-bold text-white">{notification.username.slice(0, 10)}</span>
                    <span className="text-success"> a remporté</span>
                  </p>
                  <p className="text-[10px]">
                    <span className="font-bold text-success">{notification.value}€</span>
                    {notification.wonAt && (
                      <span className="text-white/50 ml-1">{formatRelativeTime(notification.wonAt)}</span>
                    )}
                  </p>
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
                    <span className="text-success font-medium"> a remporté</span>
                  </p>
                  <p className="text-sm truncate">
                    <span className="font-bold text-neon-blue">{notification.item}</span>
                    <span className="text-success font-bold ml-2">{notification.value}€</span>
                  </p>
                  {notification.wonAt && (
                    <p className="text-xs text-white/50">{formatRelativeTime(notification.wonAt)}</p>
                  )}
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
