'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { getLeaderboard, getMyRank, type LeaderboardEntry } from '@/actions/leaderboard'

const MEDAL = ['🥇', '🥈', '🥉']

export function LeaderboardClient() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([])
  const [me, setMe] = useState<{ rank: number; total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [lb, rk] = await Promise.all([getLeaderboard(50), getMyRank()])
      if (lb.success && lb.data) setRows(lb.data)
      if (rk.success && rk.data) setMe(rk.data)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-bg-secondary/50" />

  return (
    <div className="space-y-4">
      {me && me.total > 0 && (
        <div className="rounded-2xl border border-neon-purple/30 bg-neon-purple/10 px-5 py-4 text-center">
          <p className="text-sm text-white/60">Ton classement</p>
          <p className="text-2xl font-black text-white">
            {me.rank}<span className="text-base font-semibold text-white/50"> e sur {me.total.toLocaleString('fr-FR')} joueurs</span>
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-bg-secondary">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h2 className="font-black text-white">Top joueurs</h2>
          <span className="ml-auto text-xs text-white/40">par XP</span>
        </div>
        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.userId} className={`flex items-center gap-3 px-4 py-2.5 ${r.rank <= 3 ? 'bg-white/[0.03]' : ''}`}>
              <span className="w-7 shrink-0 text-center text-sm font-black text-white/70">
                {r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}
              </span>
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
                {r.avatarUrl ? (
                  <Image src={r.avatarUrl} alt="" fill sizes="36px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white/40">{r.username?.[0]?.toUpperCase() ?? '?'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{r.username}</p>
                <p className="text-xs text-white/40">Niveau {r.level} · {r.totalWins} victoire{r.totalWins > 1 ? 's' : ''}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-neon-purple">{r.xp.toLocaleString('fr-FR')} XP</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
