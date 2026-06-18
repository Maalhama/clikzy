import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { ArenaAtmosphereLazy } from '@/components/ui/ArenaAtmosphereLazy'

// Server component : les pages d'auth (login/register/forgot/reset) sont des
// client components et ne peuvent pas exporter de metadata. On centralise donc
// le noindex ici, pour tout le groupe (auth). Ces pages ne doivent jamais ranker
// à la place de la landing.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

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
