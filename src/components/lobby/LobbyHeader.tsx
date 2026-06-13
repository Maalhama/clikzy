'use client'

import { memo, useEffect, useState } from 'react'
import { NeonChest } from '@/components/collection/NeonChest'
import { LobbyCharacterWidget } from '@/components/lobby/LobbyCharacterWidget'
import { MidnightCountdown } from '@/components/lobby/MidnightCountdown'
import { JackpotWidget } from '@/components/jackpot/JackpotWidget'

interface LobbyHeaderProps {
  credits: number
  activeCount: number
  urgentCount: number
  endedCount: number
  wasReset?: boolean
  chestInfo?: { count: number; bestRarity: string; dailyAvailable: boolean } | null
  onChestsClick?: () => void
  calendarAvailable?: boolean
  onCalendarClick?: () => void
  isLoggedIn?: boolean
}

export const LobbyHeader = memo(function LobbyHeader({
  credits,
  activeCount,
  urgentCount,
  endedCount,
  wasReset = false,
  chestInfo = null,
  onChestsClick,
  calendarAvailable = false,
  onCalendarClick,
  isLoggedIn = false,
}: LobbyHeaderProps) {
  return (
    <div className="relative py-4 md:py-5 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Credits reset notification */}
        {wasReset && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 border border-success/30 max-w-fit animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <div>
              <div className="font-bold text-success text-sm">
                +10 crédits offerts !
              </div>
              <div className="text-xs text-white/50">
                Tes crédits quotidiens sont rechargés
              </div>
            </div>
          </div>
        )}

        {/* Header row with stats */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 reveal reveal-1">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="live-dot" aria-hidden="true" />
              <span className="kicker !text-[0.625rem]">Arène en direct</span>
              <OnlineBadge />
            </div>
            <h1 className="title-giant text-3xl md:text-4xl text-white">              LOBBY
            </h1>
            <p className="text-white/50 text-sm mt-1.5">
              Dernier clic = gagnant. Choisis ta cible.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <svg
                className="w-4 h-4 text-neon-purple"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-neon-purple font-medium">
                Nouveaux produits toutes les 3 heures.
              </span>
            </div>
          </div>

          {/* Coffres + stats */}
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
          {/* Récompense du jour (calendrier) + coffres, côte à côte.
              Mobile : pleine largeur, 3 widgets répartis (flex-1). Desktop : auto, alignés à droite. */}
          <div data-tour="rewards" className="flex w-full items-stretch gap-2 sm:w-auto sm:justify-end sm:gap-3">
          {/* Widget personnage — aperçu du héros équipé → collection (connecté uniquement) */}
          {isLoggedIn && <LobbyCharacterWidget />}
          {/* Widget récompense du jour — ouvre le calendrier (connecté uniquement) */}
          {isLoggedIn && onCalendarClick && (
            <button
              type="button"
              onClick={onCalendarClick}
              aria-label="Récompense du jour : ouvrir le calendrier"
              className="hero-live-card group flex flex-1 items-center justify-center gap-0 px-2 py-2 text-left transition-transform hover:-translate-y-0.5 sm:flex-none sm:justify-start sm:gap-3 sm:px-4 sm:py-3"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neon-purple/30 bg-neon-purple/10 sm:h-[46px] sm:w-[46px]">
                <svg className="h-6 w-6 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2.5" />
                  <path d="M3 10h18" />
                  <path d="M8 3v3M16 3v3" />
                  <path d="M12 12.4l1.1 2.25 2.48.32-1.82 1.7.46 2.45L12 17.9l-2.22 1.21.46-2.44-1.82-1.71 2.48-.32z" fill="currentColor" stroke="none" />
                </svg>
                {calendarAvailable && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-success" />
                  </span>
                )}
              </div>
              <div className="ml-3 hidden min-w-0 sm:block">
                <div className="font-display text-sm font-semibold text-white whitespace-nowrap">Récompense du jour</div>
                {calendarAvailable ? (
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-success">
                    <span className="live-dot" aria-hidden="true" />
                    À réclamer maintenant
                  </div>
                ) : (
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45">Prochaine dans <MidnightCountdown /></div>
                )}
              </div>
            </button>
          )}
          {/* Widget coffres — lien vers la collection */}
          {chestInfo && (
            <button
              type="button"
              onClick={onChestsClick}
              aria-label="Mes coffres : ouvrir"
              className="hero-live-card group flex flex-1 items-center justify-center gap-0 px-2 py-2 text-left transition-transform hover:-translate-y-0.5 sm:flex-none sm:justify-start sm:gap-3 sm:px-4 sm:py-3"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-[46px] sm:w-[46px]">
                <NeonChest rarity={chestInfo.count > 0 ? chestInfo.bestRarity : 'common'} size={38} />
                {chestInfo.count > 0 && (
                  <span className="stat-numeral absolute -right-2 -top-2 z-20 flex h-6 min-w-6 items-center justify-center rounded-full border border-neon-pink/60 bg-bg-primary px-1 text-xs text-neon-pink shadow-[0_0_10px_rgba(255,79,216,0.5)]">
                    ×{chestInfo.count}
                  </span>
                )}
              </div>
              <div className="ml-3 hidden min-w-0 sm:block">
                <div className="font-display text-sm font-semibold text-white whitespace-nowrap">
                  {chestInfo.count > 0
                    ? `${chestInfo.count} coffre${chestInfo.count > 1 ? 's' : ''} à ouvrir`
                    : 'Tes coffres'}
                </div>
                {chestInfo.dailyAvailable ? (
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-success">
                    <span className="live-dot" aria-hidden="true" />
                    3 coffres gratuits dispo aujourd&apos;hui
                  </div>
                ) : (
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45">Prochains dans <MidnightCountdown /></div>
                )}
              </div>
              <svg className="hidden h-4 w-4 shrink-0 text-white/50 transition-all group-hover:translate-x-1 group-hover:text-neon-purple sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          </div>

          {/* Stats pills */}
          <div data-tour="stats" className="flex flex-wrap gap-2">
            {/* Jackpot communautaire */}
            <JackpotWidget variant="pill" />
            {/* Active games */}
            <div className="panel flex items-center gap-2 px-3.5 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple" />
              </span>
              <span className="text-white stat-numeral text-sm">{activeCount}</span>
              <span className="text-white/55 text-xs">en jeu</span>
            </div>

            {/* Ended/Won count */}
            <div className="panel flex items-center gap-2 px-3.5 py-2">
              <svg
                className="w-4 h-4 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white stat-numeral text-sm">{endedCount}</span>
              <span className="text-white/55 text-xs">remportés</span>
            </div>

            {/* Urgent count */}
            <div className="panel flex items-center gap-2 px-3.5 py-2">
              <svg
                className="w-4 h-4 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-white stat-numeral text-sm">
                {urgentCount}
              </span>
              <span className="text-white/55 text-xs">phase finale</span>
            </div>

            {/* Solde crédits — connecté uniquement (aucun CTA d'inscription dans l'anon) */}
            {isLoggedIn && (
              <div data-tour="credits" className="panel flex items-center gap-2 px-3.5 py-2">
                <svg
                  className="w-4 h-4 text-neon-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-white stat-numeral text-sm">{credits}</span>
                <span className="text-white/55 text-xs">crédits</span>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
})


/**
 * Compteur de présence — rendu après montage uniquement (zéro mismatch),
 * marche aléatoire douce autour d'une base liée à l'heure.
 */
function OnlineBadge() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    const base = 1800 + new Date().getHours() * 28
    let value = base + Math.floor(Math.random() * 120)
    setCount(value)
    const interval = setInterval(() => {
      value += Math.floor(Math.random() * 15) - 7
      setCount(value)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Toujours rendu (invisible avant montage) : l'apparition tardive décalait
  // le titre LOBBY et tout le contenu en dessous (layout shift).
  return (
    <span className={`hidden items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 sm:inline-flex ${count === null ? 'invisible' : ''}`}>
      <span className="stat-numeral text-xs text-success">{(count ?? 1888).toLocaleString('fr-FR')}</span>
      <span className="text-[0.6rem] uppercase tracking-wider text-white/55">en ligne</span>
    </span>
  )
}
