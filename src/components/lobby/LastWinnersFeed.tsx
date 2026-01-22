'use client'

import { memo } from 'react'
import type { WinnerData } from '@/actions/winners'

interface LastWinnersFeedProps {
  winners: WinnerData[]
}

// Number of slots always visible
const VISIBLE_SLOTS = 3

const WinnerItem = memo(function WinnerItem({
  winner,
  isNew,
}: {
  winner: WinnerData
  isNew: boolean
}) {
  // Format time ago
  const getTimeAgo = () => {
    const diff = Date.now() - new Date(winner.wonAt).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `il y a ${days}j`
    if (hours > 0) return `il y a ${hours}h`
    if (minutes > 0) return `il y a ${minutes}min`
    return 'maintenant'
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all duration-300
        ${isNew ? 'bg-success/20 animate-[fadeInSlide_0.3s_ease-out]' : 'bg-bg-secondary/30'}
      `}
    >
      {/* Trophy icon */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4V5H16C17.1 5 18 5.9 18 7V8C18 10.21 16.21 12 14 12C13.93 12.01 13.85 12 13.78 12C13.41 13.23 12.49 14.22 11.28 14.69L10 15.24V17H12C13.1 17 14 17.9 14 19V20H6V19C6 17.9 6.9 17 8 17H10V15.24L8.72 14.69C7.51 14.22 6.59 13.23 6.22 12C6.15 12 6.07 12.01 6 12C3.79 12 2 10.21 2 8V7C2 5.9 2.9 5 4 5H6V4C6 2.9 6.9 2 8 2H12M4 7V8C4 9.1 4.9 10 6 10V7H4M14 7V10C15.1 10 16 9.1 16 8V7H14Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm truncate">
            {winner.username}
          </span>
          <span className="text-success text-xs">a gagné</span>
        </div>
        <div className="text-white/40 text-xs truncate">
          {winner.itemName}
        </div>
      </div>

      {/* Time */}
      <div className="text-white/30 text-[10px] whitespace-nowrap">
        {getTimeAgo()}
      </div>
    </div>
  )
})

// Empty slot placeholder
const EmptySlot = memo(function EmptySlot({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-secondary/10 border border-dashed border-white/5">
      {/* Trophy placeholder */}
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white/20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4V5H16C17.1 5 18 5.9 18 7V8C18 10.21 16.21 12 14 12C13.93 12.01 13.85 12 13.78 12C13.41 13.23 12.49 14.22 11.28 14.69L10 15.24V17H12C13.1 17 14 17.9 14 19V20H6V19C6 17.9 6.9 17 8 17H10V15.24L8.72 14.69C7.51 14.22 6.59 13.23 6.22 12C6.15 12 6.07 12.01 6 12C3.79 12 2 10.21 2 8V7C2 5.9 2.9 5 4 5H6V4C6 2.9 6.9 2 8 2H12M4 7V8C4 9.1 4.9 10 6 10V7H4M14 7V10C15.1 10 16 9.1 16 8V7H14Z" />
        </svg>
      </div>

      {/* Content placeholder */}
      <div className="flex-1 min-w-0">
        <div className="h-3 w-20 bg-white/5 rounded mb-1" />
        <div className="h-2 w-16 bg-white/5 rounded" />
      </div>

      {/* Waiting indicator */}
      <div className="text-white/20 text-[10px] whitespace-nowrap">
        {index === 0 ? 'En attente...' : ''}
      </div>
    </div>
  )
})

export const LastWinnersFeed = memo(function LastWinnersFeed({
  winners,
}: LastWinnersFeedProps) {
  // Always show at least VISIBLE_SLOTS items
  const visibleWinners = winners.slice(0, VISIBLE_SLOTS)
  const emptySlots = Math.max(0, VISIBLE_SLOTS - visibleWinners.length)

  return (
    <div className="rounded-2xl bg-bg-secondary/30 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4V5H16C17.1 5 18 5.9 18 7V8C18 10.21 16.21 12 14 12C13.93 12.01 13.85 12 13.78 12C13.41 13.23 12.49 14.22 11.28 14.69L10 15.24V17H12C13.1 17 14 17.9 14 19V20H6V19C6 17.9 6.9 17 8 17H10V15.24L8.72 14.69C7.51 14.22 6.59 13.23 6.22 12C6.15 12 6.07 12.01 6 12C3.79 12 2 10.21 2 8V7C2 5.9 2.9 5 4 5H6V4C6 2.9 6.9 2 8 2H12M4 7V8C4 9.1 4.9 10 6 10V7H4M14 7V10C15.1 10 16 9.1 16 8V7H14Z" />
          </svg>
          <span className="text-white font-bold text-sm">DERNIERS GAGNANTS</span>
        </div>
        <span className="text-white/40 text-xs">
          {winners.length > 0 ? `${winners.length} récent${winners.length > 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {/* Winners list - always 3 slots visible */}
      <div className="p-2 space-y-1">
        {/* Filled slots */}
        {visibleWinners.map((winner, index) => (
          <WinnerItem
            key={winner.id}
            winner={winner}
            isNew={index === 0}
          />
        ))}

        {/* Empty slots to maintain 3 visible */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <EmptySlot key={`empty-${index}`} index={index} />
        ))}
      </div>
    </div>
  )
})
