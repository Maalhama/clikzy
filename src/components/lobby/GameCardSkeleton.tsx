'use client'

import { memo } from 'react'

interface GameCardSkeletonProps {
  count?: number
}

const SingleSkeleton = memo(function SingleSkeleton({ index }: { index: number }) {
  return (
    <div
      className="
        rounded-2xl overflow-hidden
        bg-bg-secondary/50 backdrop-blur-sm
        border border-white/10
        animate-pulse
      "
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-bg-tertiary/50">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-white/5" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-white/5 rounded-lg w-1/2 mb-4" />

        {/* Timer box */}
        <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-white/5 mb-4">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-white/10 rounded w-12" />
            <div className="h-8 bg-white/10 rounded w-20" />
          </div>
          <div className="mt-2 h-1 bg-white/10 rounded-full" />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/5" />
            <div>
              <div className="h-2 bg-white/10 rounded w-8 mb-1" />
              <div className="h-3 bg-white/10 rounded w-16" />
            </div>
          </div>
          <div className="text-right">
            <div className="h-2 bg-white/10 rounded w-8 mb-1 ml-auto" />
            <div className="h-4 bg-white/10 rounded w-10 ml-auto" />
          </div>
        </div>

        {/* CTA */}
        <div className="h-12 bg-white/10 rounded-xl" />
      </div>
    </div>
  )
})

export const GameCardSkeleton = memo(function GameCardSkeleton({
  count = 6,
}: GameCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} index={i} />
      ))}
    </>
  )
})
