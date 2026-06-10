'use client'

import { useEffect, useState, useCallback } from 'react'
import { Flame, Zap, Gift, Check, Loader2, Trophy } from 'lucide-react'
import { getProgression, claimDailyLogin, claimQuest, type Progression } from '@/actions/progression'

type Props = { compact?: boolean }

export function ProgressionCard({ compact = false }: Props) {
  const [data, setData] = useState<Progression | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await getProgression()
    if (res.success && res.data) setData(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const showFlash = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2500)
  }

  const onClaimLogin = async () => {
    setBusy('login')
    const res = await claimDailyLogin()
    if (res.success && res.data && !res.data.already) {
      showFlash(`+${res.data.creditsGained} crédits · +${res.data.xpGained} XP · série ${res.data.streak} 🔥`)
    }
    await load()
    setBusy(null)
  }

  const onClaimQuest = async (key: string) => {
    setBusy(key)
    const res = await claimQuest(key)
    if (res.success && res.data) {
      showFlash(`+${res.data.xpReward} XP${res.data.creditsReward ? ` · +${res.data.creditsReward} crédits` : ''}`)
    }
    await load()
    setBusy(null)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-bg-secondary/60 p-5 animate-pulse h-48" />
    )
  }
  if (!data) return null

  const pct = data.xpForLevel > 0 ? Math.min(100, Math.round((data.xpIntoLevel / data.xpForLevel) * 100)) : 0
  const claimableQuests = data.quests.filter((q) => q.completed && !q.claimed).length
  const doneQuests = data.quests.filter((q) => q.claimed).length

  return (
    <div className="panel relative overflow-hidden p-5">
      {/* glow d'ambiance */}
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-neon-purple/20 blur-[80px]" />

      {/* flash récompense */}
      {flash && (
        <div role="status" className="absolute top-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-neon-purple/40 bg-neon-purple/15 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-md">
          {flash}
        </div>
      )}

      {/* Header : niveau + streak */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neon-purple to-cyan-500 text-lg font-black text-white shadow-[0_0_20px_rgba(155,92,255,0.4)]">
            {data.level}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">Niveau</p>
            <p className="text-base font-bold text-white">Niveau {data.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5">
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-bold text-orange-300">{data.streak} j</span>
        </div>
      </div>

      {/* Barre XP */}
      <div className="relative mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
          <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-cyan-400" /> XP</span>
          <span>{data.xpIntoLevel} / {data.xpForLevel}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-purple via-fuchsia-500 to-cyan-400 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Connexion quotidienne */}
      <button
        onClick={onClaimLogin}
        disabled={!data.canClaimLogin || busy === 'login'}
        className={`relative mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
          data.canClaimLogin
            ? 'border-neon-purple/40 bg-neon-purple/10 text-white hover:bg-neon-purple/20'
            : 'border-white/10 bg-white/5 text-white/40'
        }`}
      >
        <span className="flex items-center gap-2">
          <Gift className="h-4 w-4" />
          {data.canClaimLogin ? 'Récompense de connexion' : 'Récompense récupérée'}
        </span>
        {busy === 'login' ? <Loader2 className="h-4 w-4 animate-spin" /> : data.canClaimLogin ? <span className="text-neon-purple">Récupérer</span> : <Check className="h-4 w-4 text-green-400" />}
      </button>

      {/* Quêtes du jour */}
      {!compact && (
        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
              <Trophy className="h-3.5 w-3.5 text-yellow-400" /> Quêtes du jour
            </p>
            <span className="text-xs text-white/40">{doneQuests}/{data.quests.length}{claimableQuests > 0 ? ` · ${claimableQuests} à récupérer` : ''}</span>
          </div>
          <ul className="space-y-2">
            {data.quests.map((q) => {
              const qpct = q.target > 0 ? Math.min(100, Math.round((q.progress / q.target) * 100)) : 0
              return (
                <li key={q.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{q.title}</p>
                      <p className="truncate text-xs text-white/50">{q.description}</p>
                    </div>
                    {q.claimed ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-green-400"><Check className="h-3.5 w-3.5" /> Fait</span>
                    ) : q.completed ? (
                      <button
                        onClick={() => onClaimQuest(q.key)}
                        disabled={busy === q.key}
                        className="shrink-0 rounded-lg bg-gradient-to-r from-neon-purple to-cyan-500 px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105 disabled:opacity-60"
                      >
                        {busy === q.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `+${q.xpReward} XP`}
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs font-semibold text-white/40">{q.progress}/{q.target}</span>
                    )}
                  </div>
                  {!q.claimed && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-neon-purple to-cyan-400 transition-all duration-500" style={{ width: `${qpct}%` }} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
