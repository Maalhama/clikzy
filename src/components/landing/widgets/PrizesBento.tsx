'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatTime, calculateTimeLeft } from '@/lib/utils/timer'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import { getProductImageWithFallback } from '@/lib/utils/productImages'
import type { HeroLiveGame } from './HeroLiveCard'

interface PrizesBentoProps {
  games: HeroLiveGame[]
}

function TileImage({ name, url, sizes, className }: { name: string; url: string; sizes: string; className?: string }) {
  const { primary, fallback } = useMemo(() => getProductImageWithFallback(name, url), [name, url])
  const [err, setErr] = useState(false)
  return (
    <Image
      src={err ? fallback : primary}
      alt={name}
      fill
      sizes={sizes}
      className={className}
      unoptimized
      onError={() => !err && setErr(true)}
    />
  )
}

/**
 * Bento des parties en direct : 1 tuile vedette géante + tuiles compactes,
 * toutes avec compte à rebours temps réel. Remplace le carrousel statique
 * quand il y a assez de parties actives. Affichage uniquement.
 */
export function PrizesBento({ games }: PrizesBentoProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(interval)
  }, [])

  const live = useMemo(
    () => games.filter((g) => g.status !== 'ended' && g.status !== 'waiting' && g.end_time > now),
    [games, now]
  )

  if (live.length < 2) return null

  // Vedette = la plus grosse valeur encore en jeu ; le reste trié par fin imminente
  const featured = [...live].sort((a, b) => b.item_value - a.item_value)[0]
  const rest = live.filter((g) => g.id !== featured.id).slice(0, 4)

  const featuredLeft = calculateTimeLeft(featured.end_time)
  const featuredUrgent = featuredLeft <= 90000
  const featuredLeader = featured.last_click_username
    ?? ((featured.total_clicks ?? 0) > 0 ? generateDeterministicUsername(featured.id) : null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-fr">
      {/* Tuile vedette */}
      <Link
        href={`/game/${featured.id}`}
        className="hero-live-card group relative lg:col-span-2 lg:row-span-2 p-7 flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="live-dot" aria-hidden="true" />
            <span className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-success">
              Lot vedette
            </span>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-wider ${
            featuredUrgent ? 'border-danger/50 bg-danger/15 text-danger' : 'border-white/10 bg-white/5 text-white/50'
          }`}>
            {featuredUrgent ? 'Phase finale' : 'En cours'}
          </span>
        </div>

        <div className="relative mx-auto my-4 h-56 w-56 lg:h-64 lg:w-64">
          <div
            className="absolute inset-0 rounded-full opacity-70 blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,79,216,0.5), rgba(155,92,255,0.35) 55%, transparent 78%)' }}
          />
          <TileImage
            name={featured.item_name}
            url={featured.item_image_url}
            sizes="256px"
            className="object-contain drop-shadow-[0_0_35px_rgba(155,92,255,0.5)] transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="mt-auto">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="truncate font-display font-semibold text-xl text-white">{featured.item_name}</div>
              {featuredLeader && (
                <div className="mt-1 truncate text-xs text-white/45">
                  Leader : <span className="font-semibold text-neon-pink">{featuredLeader}</span>
                </div>
              )}
            </div>
            <div className="stat-numeral shrink-0 text-3xl text-success">{featured.item_value.toLocaleString()}€</div>
          </div>

          <div className={`rounded-xl border p-3.5 ${featuredUrgent ? 'border-danger/40 bg-danger/15' : 'border-white/10 bg-white/[0.04]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[0.625rem] uppercase tracking-[0.2em] text-white/50">
                {featuredUrgent ? 'Fonce !' : 'Temps restant'}
              </span>
              <span suppressHydrationWarning className={`stat-numeral text-3xl ${featuredUrgent ? 'animate-pulse text-danger' : 'text-neon-blue'}`}>
                {formatTime(Math.max(0, featuredLeft))}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Tuiles compactes */}
      {rest.map((g) => {
        const left = calculateTimeLeft(g.end_time)
        const urgent = left <= 90000
        const premium = g.item_value >= 1000
        return (
          <Link
            key={g.id}
            href={`/game/${g.id}`}
            className="panel panel-hover group relative lg:col-span-1 p-4 flex items-center gap-4 overflow-hidden"
            style={premium ? { boxShadow: '0 0 40px -16px rgba(255,184,0,0.45)' } : undefined}
          >
            <div className="relative h-20 w-20 shrink-0">
              <div
                className="absolute inset-0 rounded-full opacity-60 blur-xl"
                style={{ background: 'radial-gradient(ellipse at center, rgba(155,92,255,0.45), transparent 75%)' }}
              />
              <TileImage
                name={g.item_name}
                url={g.item_image_url}
                sizes="80px"
                className="object-contain drop-shadow-[0_0_16px_rgba(155,92,255,0.4)] transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {premium && (
                  <svg className="h-3.5 w-3.5 shrink-0 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                )}
                <div className="truncate text-sm font-bold text-white">{g.item_name}</div>
              </div>
              <div className="mt-0.5 stat-numeral text-lg text-success">{g.item_value.toLocaleString()}€</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <svg className={`h-3 w-3 ${urgent ? 'text-danger' : 'text-neon-blue'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span suppressHydrationWarning className={`stat-numeral text-sm ${urgent ? 'animate-pulse text-danger' : 'text-neon-blue'}`}>
                  {formatTime(Math.max(0, left))}
                </span>
                {urgent && (
                  <span className="rounded-full bg-danger/15 border border-danger/40 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-danger">
                    Finale
                  </span>
                )}
              </div>
            </div>

            <svg className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-1 group-hover:text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )
      })}
    </div>
  )
}
