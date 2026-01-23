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
      {/* Crown icon */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-emerald-500/20 border border-success/30 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
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
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs truncate">
            {winner.itemName}
          </span>
          {winner.itemValue && (
            <span className="text-neon-purple text-xs font-bold">
              {winner.itemValue}€
            </span>
          )}
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
      {/* Crown placeholder */}
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white/20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
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
          <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
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
