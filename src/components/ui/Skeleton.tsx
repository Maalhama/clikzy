'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'text' | 'card'
  animate?: boolean
}

export function Skeleton({ className, variant = 'default', animate = true }: SkeletonProps) {
  const baseClasses = 'bg-white/5'
  const animateClasses = animate ? 'animate-pulse' : ''

  const variantClasses = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full',
    card: 'rounded-xl',
  }

  return (
    <div
      className={cn(baseClasses, animateClasses, variantClasses[variant], className)}
      aria-hidden="true"
    />
  )
}

// Skeleton pour les stats
export function StatsSkeleton() {
  return (
    <div className="flex justify-between gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 py-3 px-2 rounded-lg bg-bg-secondary/60 border border-white/10">
          <Skeleton className="h-6 w-16 mx-auto mb-1" />
          <Skeleton className="h-3 w-12 mx-auto" variant="text" />
        </div>
      ))}
    </div>
  )
}

// Skeleton pour les cartes de gagnants
export function WinnerCardSkeleton() {
  return (
    <div className="w-[220px] sm:w-[280px] min-h-[150px] sm:min-h-[180px] p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-bg-secondary/80 border border-white/10">
      <Skeleton className="h-5 w-20 mb-3" />
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10" variant="circular" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

// Skeleton pour le compteur de joueurs
export function PlayerCountSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="w-2 h-2" variant="circular" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

// Skeleton pour les prix
export function PrizeCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[100px] p-2.5 rounded-xl bg-bg-secondary/70 border border-white/10">
      <Skeleton className="w-14 h-14 mx-auto mb-1.5 rounded-lg" />
      <Skeleton className="h-3 w-16 mx-auto mb-1" />
      <Skeleton className="h-4 w-12 mx-auto" />
    </div>
  )
}
