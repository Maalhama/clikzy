'use client'

import { ReactNode } from 'react'
import { BackgroundEffects } from '@/components/ui/BackgroundEffects'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-screen w-full relative overflow-hidden bg-bg-primary">
      {/* Background Effects - same as landing page */}
      <BackgroundEffects simplified />

      {/* Content - full screen, no extra padding */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  )
}
