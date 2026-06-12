'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Shield, Crown, LogOut, Plus, Users } from 'lucide-react'
import {
  getMyClan, getClanLeaderboard, createClan, joinClan, leaveClan,
  type MyClan, type ClanRow,
} from '@/actions/clans'

const MEDAL = ['#FFD700', '#C0C8D8', '#CD7F32']

export function ClansClient() {
  const [myClan, setMyClan] = useState<MyClan | null>(null)
  const [board, setBoard] = useState<ClanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [desc, setDesc] = useState('')

  const refresh = useCallback(async () => {
    const [m, b] = await Promise.all([getMyClan(), getClanLeaderboard(50)])
    if (m.success) setMyClan(m.data ?? null)
    if (b.success && b.data) setBoard(b.data)
    setLoading(false)
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const doCreate = async () => {
    setBusy(true); setErr(null)
    const res = await createClan(name, tag, desc)
    if (res.success) { setName(''); setTag(''); setDesc(''); await refresh() }
    else setErr(res.error ?? 'Erreur')
    setBusy(false)
  }
  const doJoin = async (id: string) => {
    setBusy(true); setErr(null)
    const res = await joinClan(id)
    if (res.success) await refresh(); else setErr(res.error ?? 'Erreur')
    setBusy(false)
  }
  const doLeave = async () => {
    setBusy(true); setErr(null)
    const res = await leaveClan()
    if (res.success) await refresh(); else setErr(res.error ?? 'Erreur')
    setBusy(false)
  }

  if (loading) return <div className="flex justify-center py-12 text-white/40"><Loader2 className="h-6 w-6 animate-spin" /></div>

  const myRank = myClan ? board.find((c) => c.clanId === myClan.id)?.rank : undefined

  return (
    <div className="space-y-6">
      {err && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>}

      {myClan ? (
        <section className="panel reveal reveal-2 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neon-purple/40 bg-neon-purple/10">
                <Shield className="h-6 w-6 text-neon-purple" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{myClan.name} <span className="text-neon-pink">[{myClan.tag}]</span></h2>
                <p className="text-xs text-white/50">{myClan.members.length} membre{myClan.members.length > 1 ? 's' : ''} · {myClan.totalXp.toLocaleString('fr-FR')} XP{myRank ? ` · #${myRank} mondial` : ''}</p>
              </div>
            </div>
            <button onClick={doLeave} disabled={busy} className="btn-arena-ghost px-3 py-2 text-xs disabled:opacity-60">
              <LogOut className="h-3.5 w-3.5" /> Quitter
            </button>
          </div>
          {myClan.description && <p className="mb-4 text-sm text-white/60">{myClan.description}</p>}
          <div className="space-y-1.5">
            {myClan.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink text-xs font-bold text-white">{m.username.charAt(0).toUpperCase()}</span>
                <span className="flex-1 truncate text-sm text-white">{m.username}</span>
                {m.role === 'owner' && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                <span className="text-[0.65rem] text-white/40">Niv. {m.level}</span>
                <span className="stat-numeral text-xs text-neon-blue">{m.xp.toLocaleString('fr-FR')} XP</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel reveal reveal-2 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-white"><Plus className="h-5 w-5 text-neon-purple" /> Créer un clan</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du clan (3-24)" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-neon-purple" />
            <input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={5} placeholder="TAG (2-5)" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm uppercase text-white outline-none focus:border-neon-purple" />
          </div>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optionnel)" className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-neon-purple" />
          <button onClick={doCreate} disabled={busy || name.length < 3 || tag.length < 2} className="btn-arena mt-3 px-6 py-2.5 text-sm disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fonder le clan'}
          </button>
        </section>
      )}

      {/* Classement des clans */}
      <section className="panel reveal reveal-3 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-white"><Users className="h-5 w-5 text-neon-pink" /> Classement des clans</h2>
        {board.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/40">Aucun clan pour l’instant : sois le premier à en fonder un !</p>
        ) : (
          <div className="space-y-1.5">
            {board.map((c) => {
              const mine = myClan?.id === c.clanId
              const canJoin = !myClan
              return (
                <div key={c.clanId} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${mine ? 'border border-neon-purple/40 bg-neon-purple/10' : 'bg-white/[0.03]'}`}>
                  <span className="stat-numeral w-7 text-center text-sm font-bold" style={{ color: c.rank <= 3 ? MEDAL[c.rank - 1] : 'rgba(255,255,255,0.5)' }}>{c.rank}</span>
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold text-white">{c.name} <span className="text-neon-pink">[{c.tag}]</span></span>
                    <span className="block text-[0.65rem] text-white/40">{c.memberCount} membre{c.memberCount > 1 ? 's' : ''}</span>
                  </div>
                  <span className="stat-numeral text-xs text-neon-blue">{c.totalXp.toLocaleString('fr-FR')} XP</span>
                  {canJoin && <button onClick={() => doJoin(c.clanId)} disabled={busy} className="btn-arena-ghost px-3 py-1.5 text-[0.7rem] disabled:opacity-50">Rejoindre</button>}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
