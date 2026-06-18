'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { CreditsProvider } from '@/contexts/CreditsContext'
import { BadgeNotificationProvider } from '@/contexts/BadgeNotificationContext'

// Lazy + client-only : BadgeNotificationContainer tire framer-motion. Statiquement
// importé dans le layout (main), il chargeait framer (~40 KB gz) sur CHAQUE route
// connectée. Il ne s'affiche qu'au déblocage d'un badge (événement rare) -> dynamic.
const BadgeNotificationContainer = dynamic(
  () => import('@/components/notifications/BadgeNotification').then((m) => ({ default: m.BadgeNotificationContainer })),
  { ssr: false }
)

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
