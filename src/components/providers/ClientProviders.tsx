'use client'

import { ReactNode } from 'react'
import { CreditsProvider } from '@/contexts/CreditsContext'
import { BadgeNotificationProvider } from '@/contexts/BadgeNotificationContext'
import { BadgeNotificationContainer } from '@/components/notifications/BadgeNotification'

interface ClientProvidersProps {
  children: ReactNode
  initialCredits: number
  userId: string | null
}

export function ClientProviders({ children, initialCredits, userId }: ClientProvidersProps) {
  return (
    <CreditsProvider initialCredits={initialCredits} userId={userId}>
      <BadgeNotificationProvider>
        {children}
        <BadgeNotificationContainer />
      </BadgeNotificationProvider>
    </CreditsProvider>
  )
}
