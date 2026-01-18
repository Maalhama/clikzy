'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface WinNotification {
  id: string
  username: string
  item: string
  value: number
  timestamp: number
}

const MOCK_USERNAMES = [
  'Alex42', 'GamerPro', 'LuckyOne', 'NeonKing', 'StarPlayer',
  'FastClick', 'WinnerX', 'ProGamer', 'ClickMaster', 'VictoryK'
]

const MOCK_ITEMS = [
  { name: 'iPhone 15 Pro', value: 1299 },
  { name: 'PS5', value: 549 },
  { name: 'AirPods Pro', value: 279 },
  { name: 'Nintendo Switch', value: 329 },
  { name: 'MacBook Air', value: 1199 },
]

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
    const username = MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)]
    const item = MOCK_ITEMS[Math.floor(Math.random() * MOCK_ITEMS.length)]

    const newNotification: WinNotification = {
      id,
      username,
      item: item.name,
      value: item.value,
      timestamp: Date.now(),
    }

    setNotifications(prev => [newNotification, ...prev].slice(0, maxVisible))

    // Auto-remove after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 6000)
  }, [maxVisible])

  // Show winners only, every ~15 seconds
  useEffect(() => {
    if (!enabled) return

    // Initial notification after 3 seconds
    const initialTimeout = setTimeout(addWinNotification, 3000)

    // Then every 15 seconds (with small variation)
    const interval = setInterval(() => {
      addWinNotification()
    }, 15000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [enabled, addWinNotification])

  if (!enabled) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="pointer-events-auto"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-bg-secondary/90 backdrop-blur-xl border border-neon-pink/50 shadow-[0_0_20px_rgba(255,79,216,0.3)] clip-angle-sm">
              <TrophyIcon className="w-6 h-6 text-neon-pink" />
              <p className="text-sm">
                <span className="font-bold text-neon-pink">{notification.username}</span>
                <span className="text-white/60"> a gagné </span>
                <span className="font-bold text-neon-blue">{notification.item}</span>
                <span className="text-neon-blue font-bold ml-1">({notification.value}€)</span>
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
