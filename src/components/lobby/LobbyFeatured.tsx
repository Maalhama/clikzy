'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatTime, calculateTimeLeft } from '@/lib/utils/timer'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import { getProductImageWithFallback } from '@/lib/utils/productImages'
import type { GameWithItem } from '@/types/database'

interface LobbyFeaturedProps {
  game: GameWithItem
}

/**
 * Carte « À la une » du lobby : la partie dont la fin est la plus imminente,
 * en format hero pleine largeur au-dessus de la grille. Affichage uniquement,
 * mêmes sources de vérité que les GameCards (realtime du lobby).
 */
export function LobbyFeatured({ game }: LobbyFeaturedProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    game.end_time ? calculateTimeLeft(game.end_time) : 0
  )

  useEffect(() => {
    if (!game.end_time) return
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft(game.end_time ?? 0)), 250)
    return () => clearInterval(interval)
  }, [game.end_time])

  const { primary, fallback } = useMemo(
    () => getProductImageWithFallback(game.item.name, game.item.image_url),
    [game.item.name, game.item.image_url]
  )
  const [imgError, setImgError] = useState(false)

  const leaderName = useMemo(() => {
    if (game.last_click_username) return game.last_click_username
    if ((game.total_clicks ?? 0) > 0) return generateDeterministicUsername(game.id)
    return null
  }, [game.id, game.last_click_username, game.total_clicks])

  if (timeLeft <= 0 || game.status === 'ended' || game.status === 'waiting') return null

  const isUrgent = timeLeft <= 90000

  return (
    <Link
      href={`/game/${game.id}`}
      className="hero-live-card group relative block overflow-hidden p-5 lg:p-6"
    >
      <div className="flex items-center gap-6">
        {/* Produit sur scène : halo + sol perspective + flottement */}
        <div className="relative h-32 w-32 shrink-0 lg:h-40 lg:w-40">
          <div className="hero-stage-floor absolute -bottom-2 left-1/2 h-8 w-[130%] -translate-x-1/2" aria-hidden />
          <div
            className="absolute inset-0 rounded-full opacity-70 blur-2xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,79,216,0.5), rgba(155,92,255,0.35) 55%, transparent 78%)',
            }}
          />
          <Image
            src={imgError ? fallback : primary}
            alt={game.item.name}
            fill
            sizes="160px"
            className="prize-float object-contain drop-shadow-[0_0_28px_rgba(155,92,255,0.5)] transition-transform duration-500 group-hover:scale-105"
            priority
            onError={() => !imgError && setImgError(true)}
          />
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="live-dot" aria-hidden="true" />
            <span className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-success">
              À la une
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
              isUrgent ? 'border-danger/50 bg-danger/15 text-danger animate-pulse' : 'border-white/10 bg-white/5 text-white/50'
            }`}>
              {isUrgent ? 'Phase finale' : 'Fin imminente'}
            </span>
          </div>
          <div className="truncate font-display text-xl font-semibold text-white lg:text-2xl">
            {game.item.name}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="stat-numeral text-lg text-success">{(game.item.retail_value ?? 0).toLocaleString()}€</span>
            {leaderName && (
              <span className="truncate text-white/45">
                Leader : <span className="font-semibold text-neon-pink">{leaderName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Timer + CTA */}
        <div className="hidden shrink-0 items-center gap-6 md:flex">
          <div className="text-right">
            <div className="text-[0.6rem] uppercase tracking-[0.2em] text-white/45">
              {isUrgent ? 'Fonce !' : 'Temps restant'}
            </div>
            <div
              suppressHydrationWarning
              className={`stat-numeral text-4xl ${isUrgent ? 'animate-pulse text-danger timer-critical' : 'text-neon-blue'}`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
          <span className="btn-arena px-7 py-3.5 text-sm">
            Rejoindre
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>

      {/* Barre de progression pleine largeur */}
      <div className="meter-track mt-4 !h-1.5">
        <div
          suppressHydrationWarning
          className="meter-fill"
          style={{
            width: `${Math.min(100, (timeLeft / 90000) * 100)}%`,
            background: isUrgent ? 'linear-gradient(90deg, #FF4757, #FF4FD8)' : undefined,
          }}
        />
      </div>
    </Link>
  )
}
