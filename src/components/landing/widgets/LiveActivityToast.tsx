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

// Bot winners for toast notifications - diverse usernames (2026 edition)
const BOT_WINNERS = [
  { username: 'Sami_paris', item: 'MacBook Pro M5', value: 4499, image: '/products/macbook-pro-16-m5-max-neon.png' },
  { username: 'EvaMusic', item: 'iPhone 17 Pro', value: 1229, image: '/products/iphone-17-pro-neon.png' },
  { username: 'Ibra_sn', item: 'PlayStation 5 Pro', value: 799, image: '/products/playstation-5-pro-neon.png' },
  { username: 'MarineL', item: 'Sony WF-1000XM5', value: 399, image: '/products/sony-wf-1000xm5-neon.png' },
  { username: 'Bilal_69', item: 'AirPods Pro 3', value: 299, image: '/products/airpods-pro-3-neon.png' },
  { username: 'ChloeGames', item: 'iPad Pro M4', value: 1499, image: '/products/ipad-pro-13-m4-neon.png' },
  { username: 'Amadou_ml', item: 'Apple Watch Ultra 3', value: 999, image: '/products/apple-watch-ultra-3-neon.png' },
  { username: 'Sarah_lh', item: 'Samsung Galaxy S26 Ultra', value: 1399, image: '/products/samsung-galaxy-s26-ultra-neon.png' },
  { username: 'Enzo_tls', item: 'MacBook Air M4', value: 1599, image: '/products/macbook-air-15-m4-neon.png' },
  { username: 'Khadija_ma', item: 'Nintendo Switch Pro Controller', value: 449, image: '/products/nintendo-switch-pro-controller-neon.png' },
  { username: 'Lucas_44', item: 'Beats Studio Buds', value: 549, image: '/products/beats-studio-buds-neon.png' },
  { username: 'Jade_bzh', item: 'Manette Xbox Core', value: 599, image: '/products/manette-xbox-core-neon.png' },
  { username: 'MohamedK', item: 'Steam Deck OLED 1TB', value: 679, image: '/products/steam-deck-oled-1tb-neon.png' },
  { username: 'Lea_rns', item: 'Meta Quest 4', value: 599, image: '/products/meta-quest-4-neon.png' },
  { username: 'Adama_ci', item: 'DJI Avata 3', value: 999, image: '/products/dji-avata-3-neon.png' },
  { username: 'MathisPlay', item: 'GoPro Hero 14 Black', value: 499, image: '/products/gopro-hero-14-black-neon.png' },
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

  // Map item names to local neon PNG images
  const getItemImage = (itemName: string): string => {
    const name = itemName.toLowerCase()
    // Smartphones
    if (name.includes('iphone 17 pro max')) return '/products/iphone-17-pro-max-neon.png'
    if (name.includes('iphone')) return '/products/iphone-17-pro-neon.png'
    if (name.includes('samsung') && name.includes('s26')) return '/products/samsung-galaxy-s26-ultra-neon.png'
    if (name.includes('samsung') && name.includes('fold')) return '/products/samsung-galaxy-z-fold-6-neon.png'
    if (name.includes('pixel')) return '/products/google-pixel-10-pro-neon.png'
    // Gaming
    if (name.includes('ps5 pro') || name.includes('playstation 5 pro')) return '/products/playstation-5-pro-neon.png'
    if (name.includes('ps5') || name.includes('playstation')) return '/products/playstation-5-slim-neon.png'
    if (name.includes('xbox') || name.includes('manette xbox')) return '/products/manette-xbox-core-neon.png'
    if (name.includes('switch')) return '/products/nintendo-switch-pro-controller-neon.png'
    if (name.includes('steam deck')) return '/products/steam-deck-oled-1tb-neon.png'
    if (name.includes('quest') || name.includes('meta')) return '/products/meta-quest-4-neon.png'
    if (name.includes('dualsense edge')) return '/products/manette-ps5-dualsense-edge-neon.png'
    if (name.includes('dualsense') || name.includes('manette ps5')) return '/products/manette-ps5-dualsense-neon.png'
    if (name.includes('rog ally')) return '/products/asus-rog-ally-x-neon.png'
    if (name.includes('rog strix')) return '/products/asus-rog-strix-g18-neon.png'
    // Computers
    if (name.includes('macbook pro 16') || name.includes('m5 max')) return '/products/macbook-pro-16-m5-max-neon.png'
    if (name.includes('macbook pro 14') || name.includes('m5 pro')) return '/products/macbook-pro-14-m5-pro-neon.png'
    if (name.includes('macbook air')) return '/products/macbook-air-15-m4-neon.png'
    if (name.includes('macbook')) return '/products/macbook-pro-16-m5-max-neon.png'
    if (name.includes('ipad')) return '/products/ipad-pro-13-m4-neon.png'
    if (name.includes('imac')) return '/products/imac-24-m4-neon.png'
    // Audio
    if (name.includes('airpods pro')) return '/products/airpods-pro-3-neon.png'
    if (name.includes('beats')) return '/products/beats-studio-buds-neon.png'
    if (name.includes('sony wf')) return '/products/sony-wf-1000xm5-neon.png'
    if (name.includes('bose')) return '/products/bose-soundlink-flex-neon.png'
    if (name.includes('sonos arc')) return '/products/sonos-arc-ultra-neon.png'
    if (name.includes('sonos era')) return '/products/sonos-era-500-neon.png'
    if (name.includes('sonos roam')) return '/products/sonos-roam-2-neon.png'
    if (name.includes('sonos')) return '/products/sonos-arc-ultra-neon.png'
    if (name.includes('marshall stanmore')) return '/products/marshall-stanmore-iv-neon.png'
    if (name.includes('marshall')) return '/products/marshall-emberton-iii-neon.png'
    if (name.includes('jbl flip')) return '/products/jbl-flip-7-neon.png'
    if (name.includes('jbl tune')) return '/products/jbl-tune-770nc-neon.png'
    if (name.includes('jbl')) return '/products/jbl-flip-7-neon.png'
    if (name.includes('ultimate ears') || name.includes('ue boom')) return '/products/ultimate-ears-boom-4-neon.png'
    if (name.includes('razer blackshark')) return '/products/razer-blackshark-v2-pro-neon.png'
    if (name.includes('steelseries')) return '/products/steelseries-arctis-nova-7-neon.png'
    if (name.includes('galaxy buds')) return '/products/samsung-galaxy-buds-3-neon.png'
    // Watches
    if (name.includes('apple watch ultra')) return '/products/apple-watch-ultra-3-neon.png'
    if (name.includes('galaxy watch')) return '/products/samsung-galaxy-watch-8-classic-neon.png'
    if (name.includes('garmin fenix')) return '/products/garmin-fenix-8-pro-neon.png'
    if (name.includes('garmin venu')) return '/products/garmin-venu-sq-2-neon.png'
    if (name.includes('garmin')) return '/products/garmin-fenix-8-pro-neon.png'
    if (name.includes('fitbit')) return '/products/fitbit-sense-3-neon.png'
    if (name.includes('huawei watch')) return '/products/huawei-watch-fit-4-neon.png'
    if (name.includes('whoop')) return '/products/whoop-5-0-neon.png'
    if (name.includes('xiaomi') && name.includes('band')) return '/products/xiaomi-smart-band-9-pro-neon.png'
    // Photo/Video
    if (name.includes('gopro')) return '/products/gopro-hero-14-black-neon.png'
    if (name.includes('dji avata')) return '/products/dji-avata-3-neon.png'
    if (name.includes('dji mavic') || name.includes('mavic')) return '/products/dji-mavic-4-pro-neon.png'
    if (name.includes('dji osmo')) return '/products/dji-osmo-pocket-4-neon.png'
    if (name.includes('dji') || name.includes('drone')) return '/products/dji-avata-3-neon.png'
    if (name.includes('canon')) return '/products/canon-eos-r8-neon.png'
    if (name.includes('sony alpha')) return '/products/sony-alpha-7-v-neon.png'
    // TV
    if (name.includes('lg') && name.includes('oled')) return '/products/lg-oled-g4-65-neon.png'
    if (name.includes('samsung') && (name.includes('tv') || name.includes('qn'))) return '/products/samsung-qn95d-55-neon.png'
    if (name.includes('sony bravia')) return '/products/sony-bravia-9-55-neon.png'
    // Kindle
    if (name.includes('kindle')) return '/products/kindle-paperwhite-signature-neon.png'
    // Fallback
    return '/products/airpods-4-neon.png'
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
