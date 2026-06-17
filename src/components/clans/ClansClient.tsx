'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Shield, Crown, LogOut, Plus, Users } from 'lucide-react'
import {
  getMyClan, getClanLeaderboard, createClan, joinClan, leaveClan,
  type MyClan, type ClanRow,
} from '@/actions/clans'

const MEDAL = ['#FFD700', '#C0C8D8', '#CD7F32']

// Couleur d'identité du clan, déterministe à partir du tag (palette de marque)
const CLAN_HUES = ['#9B5CFF', '#3CCBFF', '#00FF88', '#FF8C00', '#FF4FD8']
function clanHue(tag: string): string {
  let h = 0
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % 997
  return CLAN_HUES[h % CLAN_HUES.length]
}

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

  if (loading) return <div className="flex justify-center py-12 text-white/55"><Loader2 className="h-6 w-6 animate-spin" /></div>

  const myRank = myClan ? board.find((c) => c.clanId === myClan.id)?.rank : undefined

  return (
    <div className="space-y-6">
      {err && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>}

      {myClan ? (
        <section className="panel reveal reveal-2 overflow-hidden !p-0">
          {/* Bannière du clan : identité couleur dérivée du tag */}
          <div
            className="relative px-5 pb-5 pt-6"
            style={{ background: `linear-gradient(135deg, ${clanHue(myClan.tag)}24, transparent 55%), linear-gradient(315deg, ${clanHue(myClan.tag)}10, transparent 45%)` }}
          >
            <div
              className="pointer-events-none absolute -top-10 left-1/4 h-32 w-64 rounded-full blur-3xl"
              style={{ background: `${clanHue(myClan.tag)}1F` }}
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                {/* Blason : écusson aux couleurs du clan, initiale du tag */}
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2"
                  style={{ borderColor: `${clanHue(myClan.tag)}66`, backgroundColor: `${clanHue(myClan.tag)}1A`, boxShadow: `0 0 24px -6px ${clanHue(myClan.tag)}80` }}
                >
                  <Shield className="absolute h-10 w-10 opacity-30" style={{ color: clanHue(myClan.tag) }} />
                  <span className="relative font-display text-xl font-black" style={{ color: clanHue(myClan.tag) }}>
                    {myClan.tag.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    {myClan.name} <span style={{ color: clanHue(myClan.tag) }}>[{myClan.tag}]</span>
                  </h2>
                  {myClan.description && <p className="mt-0.5 text-sm text-white/55">{myClan.description}</p>}
                </div>
              </div>
              <button onClick={doLeave} disabled={busy} className="btn-arena-ghost shrink-0 px-3 py-2 text-xs disabled:opacity-60">
                <LogOut className="h-3.5 w-3.5" /> Quitter
              </button>
            </div>

            {/* Stats du clan en tuiles */}
            <div className="relative mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-bg-primary/40 px-3 py-2.5 text-center backdrop-blur-sm">
                <div className="stat-numeral text-lg text-white">{myClan.members.length}</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-white/45">Membre{myClan.members.length > 1 ? 's' : ''}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg-primary/40 px-3 py-2.5 text-center backdrop-blur-sm">
                <div className="stat-numeral text-lg text-white">{myClan.totalXp.toLocaleString('fr-FR')}</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-white/45">XP cumulés</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg-primary/40 px-3 py-2.5 text-center backdrop-blur-sm">
                <div className="stat-numeral text-lg" style={{ color: myRank && myRank <= 3 ? MEDAL[myRank - 1] : 'white' }}>
                  {myRank ? `#${myRank}` : '—'}
                </div>
                <div className="text-[0.65rem] uppercase tracking-wider text-white/45">Rang mondial</div>
              </div>
            </div>
          </div>

          {/* Membres */}
          <div className="space-y-1.5 px-5 pb-5 pt-4">
            <div className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-white/55">Membres</div>
            {myClan.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink text-xs font-bold text-white">{m.username.charAt(0).toUpperCase()}</span>
                <span className="flex-1 truncate text-sm text-white">{m.username}</span>
                {m.role === 'owner' && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                <span className="text-[0.65rem] text-white/55">Niv. {m.level}</span>
                <span className="stat-numeral text-xs text-white/70">{m.xp.toLocaleString('fr-FR')} XP</span>
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
          <p className="py-4 text-center text-sm text-white/55">Aucun clan pour l’instant : sois le premier à en fonder un !</p>
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
                    <span className="block text-[0.65rem] text-white/55">{c.memberCount} membre{c.memberCount > 1 ? 's' : ''}</span>
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
