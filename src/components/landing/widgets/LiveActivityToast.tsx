'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ActivityNotification {
  id: string
  type: 'click' | 'win' | 'join'
  username: string
  item?: string
  value?: number
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

export function LiveActivityToast({ enabled = true, maxVisible = 3 }: LiveActivityToastProps) {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([])

  const addNotification = useCallback((notification: Omit<ActivityNotification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(7)
    const newNotification: ActivityNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
    }

    setNotifications(prev => [newNotification, ...prev].slice(0, maxVisible))

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }, [maxVisible])

  // Simulate random activity
  useEffect(() => {
    if (!enabled) return

    const generateActivity = () => {
      const rand = Math.random()
      const username = MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)]

      if (rand < 0.7) {
        // 70% clicks
        addNotification({ type: 'click', username })
      } else if (rand < 0.9) {
        // 20% joins
        addNotification({ type: 'join', username })
      } else {
        // 10% wins
        const item = MOCK_ITEMS[Math.floor(Math.random() * MOCK_ITEMS.length)]
        addNotification({ type: 'win', username, item: item.name, value: item.value })
      }
    }

    // Initial delay
    const initialTimeout = setTimeout(generateActivity, 2000)

    // Random interval between 3-8 seconds
    const interval = setInterval(() => {
      generateActivity()
    }, 3000 + Math.random() * 5000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [enabled, addNotification])

  const getNotificationContent = (notification: ActivityNotification) => {
    switch (notification.type) {
      case 'click':
        return (
          <>
            <span className="font-bold text-neon-purple">{notification.username}</span>
            <span className="text-white/60"> vient de cliquer!</span>
          </>
        )
      case 'win':
        return (
          <>
            <span className="font-bold text-neon-pink">{notification.username}</span>
            <span className="text-white/60"> a gagne </span>
            <span className="font-bold text-neon-blue">{notification.item}</span>
            <span className="text-neon-blue font-bold ml-1">({notification.value}€)</span>
          </>
        )
      case 'join':
        return (
          <>
            <span className="font-bold text-neon-blue">{notification.username}</span>
            <span className="text-white/60"> a rejoint la partie</span>
          </>
        )
    }
  }

  const getNotificationIcon = (type: ActivityNotification['type']) => {
    switch (type) {
      case 'click':
        return '👆'
      case 'win':
        return '🏆'
      case 'join':
        return '🎮'
    }
  }

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
            <div className={`
              flex items-center gap-3 px-4 py-3
              bg-bg-secondary/90 backdrop-blur-xl
              border border-white/10
              clip-angle-sm
              ${notification.type === 'win' ? 'border-neon-pink/50 shadow-[0_0_20px_rgba(255,79,216,0.3)]' : ''}
            `}>
              <span className="text-xl">{getNotificationIcon(notification.type)}</span>
              <p className="text-sm">
                {getNotificationContent(notification)}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
