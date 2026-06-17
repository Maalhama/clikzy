'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { Crown } from 'lucide-react'

export interface FeedClick {
  id: string
  username: string
  clickedAt: string
  isBot?: boolean
}

// Avatar coloré déterministe par pseudo (palette néon de la DA)
const AVATAR_PALETTE = [
  ['#9B5CFF', '#FF4FD8'],
  ['#3CCBFF', '#9B5CFF'],
  ['#FF4FD8', '#FF8C00'],
  ['#00FF88', '#3CCBFF'],
  ['#FFB800', '#FF4FD8'],
  ['#FF4757', '#9B5CFF'],
] as const

function avatarGradient(username: string): string {
  let h = 0
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0
  const [a, b] = AVATAR_PALETTE[h % AVATAR_PALETTE.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function timeAgoLabel(seconds: number): string {
  if (seconds < 5) return 'maintenant'
  if (seconds < 60) return `il y a ${seconds}s`
  return `il y a ${Math.floor(seconds / 60)}min`
}

const FeedRow = memo(function FeedRow({
  click,
  isLeader,
  isNew,
}: {
  click: FeedClick
  isLeader: boolean
  isNew: boolean
}) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(click.clickedAt).getTime()) / 1000))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - new Date(click.clickedAt).getTime()) / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [click.clickedAt])

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-500 ${
        isNew
          ? 'animate-[fadeInSlide_0.3s_ease-out] bg-neon-purple/20'
          : isLeader
          ? 'border border-neon-pink/25 bg-neon-pink/[0.07]'
          : 'bg-white/[0.03]'
      }`}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: avatarGradient(click.username) }}
      >
        {click.username.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{click.username}</span>
        <span className="text-[0.65rem] text-white/55">a cliqué</span>
      </div>
      {isLeader && (
        <span className="flex items-center gap-1 rounded-full border border-neon-pink/40 bg-neon-pink/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-neon-pink">
          <Crown className="h-3 w-3" />
          Leader
        </span>
      )}
      <span suppressHydrationWarning className="whitespace-nowrap text-[0.6rem] text-white/50">
        {timeAgoLabel(seconds)}
      </span>
    </div>
  )
})

/**
 * Fil des derniers clics de la partie : avatars néon déterministes,
 * flash à chaque nouveau clic, couronne sur le leader (dernier cliqueur).
 */
export const GameClicksFeed = memo(function GameClicksFeed({ clicks }: { clicks: FeedClick[] }) {
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const fresh = clicks.filter((c) => !seenRef.current.has(c.id)).map((c) => c.id)
    if (fresh.length === 0) return
    fresh.forEach((id) => seenRef.current.add(id))
    setNewIds((prev) => new Set([...prev, ...fresh]))
    const timer = setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev)
        fresh.forEach((id) => next.delete(id))
        return next
      })
    }, 900)
    return () => clearTimeout(timer)
  }, [clicks])

  if (clicks.length === 0) return null

  return (
    <div className="panel mt-5 overflow-hidden p-0">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
        <span className="live-dot" aria-hidden />
        <span className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-white/70">
          Derniers clics
        </span>
      </div>
      <div className="space-y-1 p-2">
        {clicks.slice(0, 5).map((click, i) => (
          <div
            key={click.id}
            className="transition-opacity duration-500"
            style={{ opacity: i === 0 ? 1 : Math.max(0.45, 1 - i * 0.16) }}
          >
            <FeedRow click={click} isLeader={i === 0} isNew={newIds.has(click.id)} />
          </div>
        ))}
      </div>
    </div>
  )
})
