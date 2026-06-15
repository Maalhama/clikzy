import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Profil public partageable : uniquement des colonnes non-PII (liste blanche
// anon par colonnes côté DB). Sert de page d'atterrissage au partage de victoire.

type PublicProfile = {
  id: string
  username: string
  avatar_url: string | null
  total_wins: number | null
  total_clicks: number | null
  created_at: string | null
  is_vip: boolean | null
  level: number | null
  xp: number | null
}

async function getPublicProfile(username: string): Promise<{ profile: PublicProfile; badges: number } | null> {
  const supabase = await createClient()
  // RPC DEFINER : n'expose que les colonnes publiques (la table profiles est en
  // RLS own-row pour authenticated). La fonction renvoie aussi le compte de badges.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.rpc as any)('get_public_profile', { p_username: username })
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  const { badges, ...profile } = row
  return { profile: profile as PublicProfile, badges: Number(badges ?? 0) }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const decoded = decodeURIComponent(username)
  return {
    title: `${decoded} · Profil joueur`,
    description: `Le profil de ${decoded} sur Cleekzy, le dernier clic gagne. Rejoins l'arène et défie-le !`,
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const data = await getPublicProfile(decodeURIComponent(username))
  if (!data) notFound()
  const { profile, badges } = data

  const level = profile.level ?? 1
  const levelTitle = level >= 20 ? 'Légende' : level >= 10 ? 'Expert' : level >= 5 ? 'Confirmé' : 'Débutant'
  const memberSince = profile.created_at
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at))
    : null

  const stats = [
    { label: 'Victoires', value: (profile.total_wins ?? 0).toLocaleString('fr-FR'), color: 'text-success' },
    { label: 'Clics', value: (profile.total_clicks ?? 0).toLocaleString('fr-FR'), color: 'text-neon-purple' },
    { label: 'XP', value: (profile.xp ?? 0).toLocaleString('fr-FR'), color: 'text-neon-blue' },
    { label: 'Succès', value: badges.toLocaleString('fr-FR'), color: 'text-yellow-400' },
  ]

  return (
    <main className="relative z-10 mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 text-center reveal reveal-1">
        <span className="kicker mb-2">Profil joueur</span>
      </div>

      <div className="panel relative overflow-hidden p-8 text-center reveal reveal-2">
        {/* halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-neon-purple/20 blur-[80px]"
        />

        {/* Avatar */}
        <div className="relative mx-auto mb-4 h-24 w-24">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              fill
              sizes="96px"
              className="rounded-full object-cover ring-2 ring-neon-purple/60"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink font-display text-4xl font-bold text-white shadow-[0_0_30px_rgba(155,92,255,0.5)]">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="stat-numeral absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-neon-purple bg-bg-primary text-sm text-neon-purple shadow-[0_0_12px_rgba(155,92,255,0.6)]">
            {level}
          </span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-white">{profile.username}</h1>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-sm">
          <span className="rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-0.5 text-xs font-semibold text-neon-purple">
            {levelTitle}
          </span>
          {profile.is_vip && (
            <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-0.5 text-xs font-bold text-yellow-400">
              V.I.P
            </span>
          )}
        </div>
        {memberSince && (
          <p className="mt-2 text-xs text-white/40">Dans l&apos;arène depuis {memberSince}</p>
        )}

        {/* Stats */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4">
              <div className={`stat-numeral text-2xl ${s.color}`}>{s.value}</div>
              <div className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA acquisition */}
        <div className="mt-8">
          <Link href="/lobby" className="btn-arena px-8 py-3.5 text-sm">
            Le défier dans l&apos;arène
          </Link>
          <p className="mt-3 text-xs text-white/40">
            10 clics gratuits par jour · le dernier clic remporte le lot
          </p>
        </div>
      </div>
    </main>
  )
}
