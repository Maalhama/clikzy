'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Badge } from '@/actions/badges'

interface BadgeNotification {
  badge: Badge
  id: string
}

interface BadgeNotificationContextType {
  notifications: BadgeNotification[]
  showBadgeNotification: (badge: Badge) => void
  showBadgeNotifications: (badges: Badge[]) => void
  dismissNotification: (id: string) => void
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | undefined>(undefined)

export function BadgeNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<BadgeNotification[]>([])

  const showBadgeNotification = useCallback((badge: Badge) => {
    const id = `${badge.id}-${Date.now()}`
    setNotifications(prev => [...prev, { badge, id }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }, [])

  const showBadgeNotifications = useCallback((badges: Badge[]) => {
    badges.forEach((badge, index) => {
      // Stagger notifications for multiple badges
      setTimeout(() => {
        showBadgeNotification(badge)
      }, index * 800)
    })
  }, [showBadgeNotification])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <BadgeNotificationContext.Provider
      value={{
        notifications,
        showBadgeNotification,
        showBadgeNotifications,
        dismissNotification,
      }}
    >
      {children}
    </BadgeNotificationContext.Provider>
  )
}

export function useBadgeNotification() {
  const context = useContext(BadgeNotificationContext)
  if (context === undefined) {
    throw new Error('useBadgeNotification must be used within a BadgeNotificationProvider')
  }
  return context
}
