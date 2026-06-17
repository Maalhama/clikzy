'use client'

import { ReactNode } from 'react'
import { ArenaAtmosphereLazy } from '@/components/ui/ArenaAtmosphereLazy'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-screen w-full relative overflow-hidden bg-bg-primary">
      {/* Atmosphère aurora commune (CSS pur) */}
      <div className="arcade-atmosphere" aria-hidden="true" />

      {/* Background Effects - same as landing page */}
      <ArenaAtmosphereLazy simplified />

      {/* Content - full screen, no extra padding */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  )
}
