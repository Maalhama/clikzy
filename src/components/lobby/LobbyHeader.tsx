'use client'

import { memo } from 'react'

interface LobbyHeaderProps {
  credits: number
  activeCount: number
  urgentCount: number
  endedCount: number
  wasReset?: boolean
}

export const LobbyHeader = memo(function LobbyHeader({
  credits,
  activeCount,
  urgentCount,
  endedCount,
  wasReset = false,
}: LobbyHeaderProps) {
  return (
    <div className="relative py-6 md:py-8 px-4 md:px-6">
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
                +10 credits offerts !
              </div>
              <div className="text-xs text-white/50">
                Tes credits quotidiens sont recharges
              </div>
            </div>
          </div>
        )}

        {/* Header row with stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              LOBBY
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Dernier clic = Gagnant. Choisis ta cible.
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

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2">
            {/* Active games */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-secondary/50 border border-neon-purple/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple" />
              </span>
              <span className="text-white font-bold text-sm">{activeCount}</span>
              <span className="text-white/50 text-xs">en jeu</span>
            </div>

            {/* Ended/Won count */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 border border-success/20">
              <svg
                className="w-4 h-4 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-success font-bold text-sm">{endedCount}</span>
              <span className="text-white/50 text-xs">remportés</span>
            </div>

            {/* Urgent count */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-danger/10 border border-danger/30 ${urgentCount > 0 ? 'animate-pulse' : ''}`}>
              <svg
                className="w-4 h-4 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-danger font-bold text-sm">
                {urgentCount}
              </span>
              <span className="text-white/50 text-xs">phase finale</span>
            </div>

            {/* Credits */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
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
              <span className="text-neon-blue font-bold text-sm">{credits}</span>
              <span className="text-white/50 text-xs">credits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
