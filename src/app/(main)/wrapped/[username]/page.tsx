import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { fetchWrappedStats } from '@/lib/wrapped'
import { WrappedShare } from '@/components/profile/WrappedShare'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const decoded = decodeURIComponent(username)
  const stats = await fetchWrappedStats(decoded)
  const desc = stats
    ? `${decoded} · ${stats.title} — ${stats.totalWins} victoire${stats.totalWins > 1 ? 's' : ''}, ${stats.totalClicks.toLocaleString('fr-FR')} clics, niveau ${stats.level}. Et toi ?`
    : `Le bilan de ${decoded} sur Cleekzy.`
  return {
    title: `${decoded} · Cleekzy Wrapped`,
    description: desc,
    openGraph: { title: `${decoded} · Cleekzy Wrapped`, description: desc },
    twitter: { card: 'summary_large_image', title: `${decoded} · Cleekzy Wrapped`, description: desc },
  }
}

function euro(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

export default async function WrappedPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const decoded = decodeURIComponent(username)
  const s = await fetchWrappedStats(decoded)
  if (!s) notFound()

  const hasValue = s.totalValueWon > 0
  const stats = [
    { label: 'Clics', value: s.totalClicks.toLocaleString('fr-FR'), color: 'text-neon-purple' },
    { label: 'Victoires', value: s.totalWins.toLocaleString('fr-FR'), color: 'text-success' },
    { label: 'Niveau', value: String(s.level), color: 'text-neon-blue' },
    { label: 'Succès', value: s.badges.toLocaleString('fr-FR'), color: 'text-yellow-400' },
  ]

  return (
    <main className="relative z-10 mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 text-center reveal reveal-1">
        <span className="kicker mb-2">Cleekzy Wrapped</span>
      </div>

      <div className="panel relative overflow-hidden p-8 text-center reveal reveal-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-neon-pink/20 blur-[90px]"
        />

        {/* Avatar + niveau */}
        <div className="relative mx-auto mb-4 h-20 w-20">
          {s.avatarUrl ? (
            <Image src={s.avatarUrl} alt={s.username} fill sizes="80px" className="rounded-full object-cover ring-2 ring-neon-pink/60" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink font-display text-3xl font-bold text-white shadow-[0_0_30px_rgba(255,79,216,0.5)]">
              {s.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="stat-numeral absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-neon-pink bg-bg-primary text-xs text-neon-pink shadow-[0_0_12px_rgba(255,79,216,0.6)]">
            {s.level}
          </span>
        </div>

        <h1 className="font-display text-2xl font-semibold text-white">{s.username}</h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="rounded-full border border-neon-pink/40 bg-neon-pink/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-neon-pink">
            {s.title}
          </span>
          {s.isVip && (
            <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-0.5 text-xs font-bold text-yellow-400">V.I.P</span>
          )}
        </div>

        {/* Hero stat */}
        <div className="mt-7">
          {hasValue ? (
            <>
              <div className="stat-numeral text-5xl font-black text-neon-pink sm:text-6xl">{euro(s.totalValueWon)}€</div>
              <div className="mt-1 text-sm text-white/55">de lots remportés dans l&apos;arène</div>
            </>
          ) : (
            <>
              <div className="stat-numeral text-5xl font-black text-neon-purple sm:text-6xl">{s.totalClicks.toLocaleString('fr-FR')}</div>
              <div className="mt-1 text-sm text-white/55">clics envoyés dans la bataille</div>
            </>
          )}
        </div>

        {/* Stats grid */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4">
              <div className={`stat-numeral text-2xl ${st.color}`}>{st.value}</div>
              <div className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/55">{st.label}</div>
            </div>
          ))}
        </div>

        {/* Meilleur lot */}
        {s.bestLot && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-yellow-500/25 bg-yellow-500/[0.06] px-4 py-3 text-sm">
            <svg className="h-4 w-4 shrink-0 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 3h14v2H5z" />
            </svg>
            <span className="text-white/70">
              Meilleur lot : <span className="font-semibold text-white">{s.bestLot.name}</span>
              {s.bestLot.value > 0 && <span className="text-yellow-400"> ({euro(s.bestLot.value)}€)</span>}
            </span>
          </div>
        )}

        {s.memberSince && (
          <p className="mt-4 text-xs text-white/55">
            Dans l&apos;arène depuis {s.memberSince} · {s.daysInArena} jour{s.daysInArena > 1 ? 's' : ''}
          </p>
        )}

        {/* Partage */}
        <div className="mt-7">
          <WrappedShare username={s.username} title={s.title} />
        </div>
      </div>

      {/* CTA acquisition */}
      <div className="mt-6 text-center reveal reveal-3">
        <Link href="/lobby" className="btn-arena px-8 py-3.5 text-sm">
          Fais ton propre bilan
        </Link>
        <p className="mt-3 text-xs text-white/55">10 clics gratuits par jour · le dernier clic remporte le lot</p>
      </div>
    </main>
  )
}
