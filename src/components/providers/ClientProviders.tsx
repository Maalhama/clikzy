'use client'

import { ReactNode } from 'react'
import { CreditsProvider } from '@/contexts/CreditsContext'

interface ClientProvidersProps {
  children: ReactNode
  initialCredits: number
  userId: string | null
}

export function ClientProviders({ children, initialCredits, userId }: ClientProvidersProps) {
  return (
    <CreditsProvider initialCredits={initialCredits} userId={userId}>
      {children}
    </CreditsProvider>
  )
}
