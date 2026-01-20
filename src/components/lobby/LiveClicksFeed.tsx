'use client'

import { memo, useEffect, useState } from 'react'

interface ClickNotification {
  id: string
  username: string
  game_id: string
  item_name: string
  timestamp: number
}

interface LiveClicksFeedProps {
  clicks: ClickNotification[]
  isConnected: boolean
}

// Number of slots always visible
const VISIBLE_SLOTS = 3

const ClickItem = memo(function ClickItem({
  click,
  isNew,
}: {
  click: ClickNotification
  isNew: boolean
}) {
  const [timeAgo, setTimeAgo] = useState(0)

  // Update time display every second
  useEffect(() => {
    const updateTime = () => {
      setTimeAgo(Math.floor((Date.now() - click.timestamp) / 1000))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [click.timestamp])

  const timeDisplay = timeAgo < 5 ? 'maintenant' : `il y a ${timeAgo}s`

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all duration-300
        ${isNew ? 'bg-neon-purple/20 animate-[fadeInSlide_0.3s_ease-out]' : 'bg-bg-secondary/30'}
      `}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">
          {click.username.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm truncate">
            {click.username}
          </span>
          <span className="text-neon-purple text-xs">a cliqué</span>
        </div>
        <div className="text-white/40 text-xs truncate">
          {click.item_name}
        </div>
      </div>

      {/* Time */}
      <div className="text-white/30 text-[10px] whitespace-nowrap" suppressHydrationWarning>
        {timeDisplay}
      </div>
    </div>
  )
})

// Empty slot placeholder
const EmptySlot = memo(function EmptySlot({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-secondary/10 border border-dashed border-white/5">
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
        <span className="text-white/20 text-xs">?</span>
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

export const LiveClicksFeed = memo(function LiveClicksFeed({
  clicks,
  isConnected,
}: LiveClicksFeedProps) {
  const [newClickIds, setNewClickIds] = useState<Set<string>>(new Set())

  // Track new clicks for animation
  useEffect(() => {
    if (clicks.length > 0) {
      const latestId = clicks[0].id
      setNewClickIds((prev) => new Set([...prev, latestId]))

      // Remove from "new" after animation
      const timer = setTimeout(() => {
        setNewClickIds((prev) => {
          const updated = new Set(prev)
          updated.delete(latestId)
          return updated
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [clicks])

  // Always show at least VISIBLE_SLOTS items
  const visibleClicks = clicks.slice(0, VISIBLE_SLOTS)
  const emptySlots = Math.max(0, VISIBLE_SLOTS - visibleClicks.length)

  return (
    <div className="rounded-2xl bg-bg-secondary/30 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`
                animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                ${isConnected ? 'bg-neon-green' : 'bg-danger'}
              `}
            />
            <span
              className={`
                relative inline-flex rounded-full h-2 w-2
                ${isConnected ? 'bg-neon-green' : 'bg-danger'}
              `}
            />
          </span>
          <span className="text-white font-bold text-sm">ACTIVITÉ LIVE</span>
        </div>
        <span className="text-white/40 text-xs">
          {isConnected ? 'Connecté' : 'Connexion...'}
        </span>
      </div>

      {/* Clicks list - always 3 slots visible */}
      <div className="p-2 space-y-1">
        {/* Filled slots */}
        {visibleClicks.map((click) => (
          <ClickItem
            key={click.id}
            click={click}
            isNew={newClickIds.has(click.id)}
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
