'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Zap, Gift, Trophy, ChevronRight } from 'lucide-react'
import { getProgression, type Progression } from '@/actions/progression'
import { getCollection } from '@/actions/collection'

export function LobbyGamificationBar({ initialProg = null, initialChests = 0 }: {
  initialProg?: Progression | null
  initialChests?: number
}) {
  const [prog, setProg] = useState<Progression | null>(initialProg)
  const [chests, setChests] = useState(initialChests)

  useEffect(() => {
    if (initialProg) return // déjà fourni par le serveur : pas de re-fetch tardif
    (async () => {
      const [p, c] = await Promise.all([getProgression(), getCollection()])
      if (p.success && p.data) setProg(p.data)
      if (c.success && c.data) setChests(c.data.chests.length)
    })()
  }, [initialProg])

  if (!prog) return null
  const pct = prog.xpForLevel > 0 ? Math.min(100, Math.round((prog.xpIntoLevel / prog.xpForLevel) * 100)) : 0
  const claimable = prog.quests.filter((q) => q.completed && !q.claimed).length

  return (
    <div className="mx-auto mb-5 max-w-7xl px-4 md:px-6">
      <div className="flex w-full items-center gap-2.5 overflow-x-auto panel p-2.5 backdrop-blur-md scrollbar-hide">
        {/* Niveau + XP */}
        <Link href="/profile" className="flex shrink-0 items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-white/5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-cyan-500 text-sm font-black text-white shadow-[0_0_14px_rgba(155,92,255,0.4)]">
            {prog.level}
          </span>
          <span className="block w-14 sm:w-24">
            <span className="flex items-center gap-1 text-[10px] text-white/50"><Zap className="h-3 w-3 text-cyan-400" />{prog.xpIntoLevel}/{prog.xpForLevel}</span>
            <span className="mt-0.5 block h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-gradient-to-r from-neon-purple to-cyan-400" style={{ width: `${pct}%` }} />
            </span>
          </span>
        </Link>

        {/* Streak */}
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1.5">
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-bold text-orange-300">{prog.streak}</span>
        </div>

        {/* Coffres (rappel) */}
        <Link
          href="/collection"
          className={`relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
            chests > 0 ? 'border-neon-purple/40 bg-neon-purple/15 text-white hover:bg-neon-purple/25' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>{chests > 0 ? `${chests} coffre${chests > 1 ? 's' : ''}` : 'Collection'}</span>
          {chests > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-neon-pink" />}
        </Link>

        {/* Classement */}
        <Link href="/classement" style={{ marginLeft: 'auto' }} className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="hidden sm:inline">Classement</span>
        </Link>

        {/* Quêtes à récupérer */}
        {claimable > 0 && (
          <Link href="/profile" className="flex shrink-0 items-center gap-1 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1.5 text-xs font-bold text-green-300">
            {claimable} quête{claimable > 1 ? 's' : ''} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}
