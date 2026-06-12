'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { getLeaderboard, getMyRank, type LeaderboardEntry, type LeaderboardPeriod } from '@/actions/leaderboard'

const MEDAL_HEX = ['#FFD700', '#C0C8D8', '#CD7F32']
const PERIODS: Array<{ key: LeaderboardPeriod; label: string }> = [
  { key: 'day', label: 'Jour' },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'all', label: 'All-time' },
]

export function LeaderboardClient() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const [rows, setRows] = useState<LeaderboardEntry[]>([])
  const [me, setMe] = useState<{ rank: number; total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      const [lb, rk] = await Promise.all([getLeaderboard(period, 50), getMyRank(period)])
      if (!active) return
      setRows(lb.success && lb.data ? lb.data : [])
      setMe(rk.success && rk.data ? rk.data : null)
      setLoading(false)
    })()
    return () => { active = false }
  }, [period])

  return (
    <div className="space-y-4">
      {/* Onglets de période */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-white/10 bg-bg-secondary/60 p-1 scrollbar-hide">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              period === p.key ? 'bg-gradient-to-r from-neon-purple to-cyan-500 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <LeaderboardBody loading={loading} rows={rows} me={me} period={period} />
    </div>
  )
}

function LeaderboardBody({ loading, rows, me, period }: { loading: boolean; rows: LeaderboardEntry[]; me: { rank: number; total: number } | null; period: LeaderboardPeriod }) {
  if (loading) return <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-bg-secondary/50" />

  return (
    <div className="space-y-4">
      {me && me.total > 0 && (
        <div className="panel rounded-2xl px-5 py-4 text-center">
          <p className="text-sm text-white/60">Ton classement</p>
          {/* « 13e sur 13 » est démotivant à faible volume : sous 50 joueurs,
              on affiche le rang seul ; au-delà, rang + top % (motivant). */}
          {me.total >= 50 ? (
            <p className="text-2xl stat-numeral text-white">
              {me.rank}
              <span className="text-base font-semibold text-white/50">
                {' '}e · top {Math.max(1, Math.ceil((me.rank / me.total) * 100))}%
              </span>
            </p>
          ) : (
            <p className="text-2xl stat-numeral text-white">
              {me.rank}<span className="text-base font-semibold text-white/50"> e place</span>
            </p>
          )}
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h2 className="font-display font-semibold text-white">Top joueurs</h2>
          <span className="ml-auto text-xs text-white/40">
            {period === 'all' ? 'all-time' : period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : 'ce mois'}
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-white/40">
            Personne n&apos;a encore marqué d&apos;XP sur cette période. Joue, accomplis tes quêtes et reviens !
          </p>
        ) : (
        <>
        {/* Mini-podium top 3 (2e — 1er — 3e) */}
        {rows.length >= 3 && (
          <div className="flex items-end justify-center gap-5 px-4 pb-2 pt-5">
            {[1, 0, 2].map((idx) => {
              const r = rows[idx]
              if (!r) return null
              const hex = MEDAL_HEX[idx]
              const first = idx === 0
              return (
                <div key={r.userId} className="flex w-24 flex-col items-center">
                  <div
                    className={`flex items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink font-display font-bold text-white ${first ? 'h-12 w-12 text-lg' : 'h-9 w-9 text-sm'}`}
                    style={{ boxShadow: `0 0 0 2px ${hex}66, 0 0 16px -2px ${hex}` }}
                  >
                    {r.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <p className="mt-1.5 w-full truncate text-center text-xs font-semibold text-white">{r.username}</p>
                  <p className="stat-numeral text-[11px] text-neon-purple">{r.xp.toLocaleString('fr-FR')} XP</p>
                  <div
                    className={`mt-1.5 flex w-full items-center justify-center rounded-t-lg border border-b-0 ${first ? 'h-12' : idx === 1 ? 'h-8' : 'h-6'}`}
                    style={{ borderColor: `${hex}55`, background: `linear-gradient(180deg, ${hex}26, transparent)` }}
                  >
                    <span className="stat-numeral text-sm" style={{ color: hex }}>{idx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.userId} className={`flex items-center gap-3 px-4 py-2.5 ${r.rank <= 3 ? 'bg-white/[0.03]' : ''}`}>
              {r.rank <= 3 ? (
                <span
                  className="stat-numeral flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm text-bg-primary"
                  style={{ background: MEDAL_HEX[r.rank - 1], boxShadow: `0 0 12px ${MEDAL_HEX[r.rank - 1]}66` }}
                >
                  {r.rank}
                </span>
              ) : (
                <span className="stat-numeral w-7 shrink-0 text-center text-sm text-white/50">{r.rank}</span>
              )}
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
                {r.avatarUrl ? (
                  <Image src={r.avatarUrl} alt={`Avatar de ${r.username}`} fill sizes="36px" className="object-cover" />
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
        </>
        )}
      </div>
    </div>
  )
}
