'use client'

import { useEffect, useState } from 'react'
import { getWeeklyQuests, claimWeeklyQuest, type DailyQuest } from '@/actions/progression'

export function WeeklyQuestsCard() {
  const [quests, setQuests] = useState<DailyQuest[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => getWeeklyQuests().then(setQuests)
  useEffect(() => { load().catch(() => setQuests([])) }, [])

  async function claim(key: string) {
    setBusy(key)
    const res = await claimWeeklyQuest(key)
    if (res.success) await load()
    setBusy(null)
  }

  if (quests === null || quests.length === 0) return null

  return (
    <section className="panel mt-8 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Objectifs de la semaine</h2>
      <p className="mt-1 text-sm text-white/60">Des récompenses plus grosses à décrocher avant dimanche soir.</p>
      <div className="mt-4 space-y-3">
        {quests.map((q) => {
          const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100))
          return (
            <div key={q.key} className="rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white">{q.title}</span>
                <span className="flex-shrink-0 text-xs text-white/50">+{q.creditsReward} cr · +{q.xpReward} XP</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-neon-purple" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[0.7rem] text-white/40">{q.progress}/{q.target}</span>
                {q.claimed ? (
                  <span className="text-[0.7rem] text-success">Récupéré ✓</span>
                ) : q.completed ? (
                  <button
                    onClick={() => claim(q.key)}
                    disabled={busy === q.key}
                    className="rounded bg-success/20 px-3 py-1 text-[0.7rem] font-medium text-success transition-colors hover:bg-success/30 disabled:opacity-50"
                  >
                    {busy === q.key ? '…' : 'Réclamer'}
                  </button>
                ) : (
                  <span className="text-[0.7rem] text-white/40">En cours</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
