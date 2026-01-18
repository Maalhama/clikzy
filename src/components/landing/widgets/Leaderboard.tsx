'use client'

import { useRef, useState, useEffect } from 'react'
import { CrownIcon } from '@/components/ui/GamingIcons'

interface LeaderboardEntry {
  rank: number
  username: string
  wins: number
  totalValue: number
  avatar?: string
}

interface LeaderboardProps {
  entries?: LeaderboardEntry[]
  title?: string
  period?: 'today' | 'week' | 'month' | 'all'
  className?: string
}

const MOCK_LEADERBOARD_TODAY: LeaderboardEntry[] = [
  { rank: 1, username: 'LuckyChamp', wins: 2, totalValue: 1200 },
  { rank: 2, username: 'NeonKing', wins: 1, totalValue: 549 },
  { rank: 3, username: 'ClickMaster', wins: 1, totalValue: 279 },
  { rank: 4, username: 'FastFinger', wins: 1, totalValue: 199 },
  { rank: 5, username: 'QuickWin', wins: 1, totalValue: 149 },
]

const MOCK_LEADERBOARD_WEEK: LeaderboardEntry[] = [
  { rank: 1, username: 'ProGamer99', wins: 5, totalValue: 3200 },
  { rank: 2, username: 'LuckyChamp', wins: 4, totalValue: 2800 },
  { rank: 3, username: 'ClickMaster', wins: 3, totalValue: 1950 },
  { rank: 4, username: 'VictoryK', wins: 2, totalValue: 1100 },
  { rank: 5, username: 'NeonKing', wins: 2, totalValue: 850 },
]

const MOCK_LEADERBOARD_MONTH: LeaderboardEntry[] = [
  { rank: 1, username: 'ProGamer99', wins: 12, totalValue: 8500 },
  { rank: 2, username: 'LuckyChamp', wins: 8, totalValue: 5200 },
  { rank: 3, username: 'ClickMaster', wins: 6, totalValue: 3800 },
  { rank: 4, username: 'VictoryK', wins: 5, totalValue: 2900 },
  { rank: 5, username: 'NeonKing', wins: 4, totalValue: 2100 },
]

const MOCK_LEADERBOARD_BY_PERIOD = {
  today: MOCK_LEADERBOARD_TODAY,
  week: MOCK_LEADERBOARD_WEEK,
  month: MOCK_LEADERBOARD_MONTH,
  all: MOCK_LEADERBOARD_MONTH,
}

export function Leaderboard({
  entries,
  title = 'LES PLUS CHANCEUX',
  period: initialPeriod = 'week',
  className = '',
}: LeaderboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>(initialPeriod)

  // Use provided entries or mock data based on selected period
  const displayedEntries = entries || MOCK_LEADERBOARD_BY_PERIOD[selectedPeriod]

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.2 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [isVisible])

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return "Aujourd'hui"
      case 'week':
        return 'Cette semaine'
      case 'month':
        return 'Ce mois'
      case 'all':
        return 'Tous les temps'
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-transparent',
          border: 'border-yellow-500/30',
          hoverBorder: 'hover:border-yellow-500/60',
          badge: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
          text: 'text-yellow-400',
          glow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]',
          badgeGlow: '0 0 15px rgba(234, 179, 8, 0.5)',
          hex: '#EAB308',
        }
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-400/20 to-transparent',
          border: 'border-gray-400/30',
          hoverBorder: 'hover:border-gray-400/60',
          badge: 'bg-gradient-to-br from-gray-300 to-gray-500',
          text: 'text-gray-300',
          glow: 'hover:shadow-[0_0_20px_rgba(156,163,175,0.3)]',
          badgeGlow: '0 0 15px rgba(156, 163, 175, 0.5)',
          hex: '#9CA3AF',
        }
      case 3:
        return {
          bg: 'bg-gradient-to-r from-amber-600/20 to-transparent',
          border: 'border-amber-600/30',
          hoverBorder: 'hover:border-amber-600/60',
          badge: 'bg-gradient-to-br from-amber-500 to-amber-700',
          text: 'text-amber-500',
          glow: 'hover:shadow-[0_0_20px_rgba(217,119,6,0.3)]',
          badgeGlow: '0 0 15px rgba(217, 119, 6, 0.5)',
          hex: '#D97706',
        }
      default:
        return {
          bg: '',
          border: 'border-white/5',
          hoverBorder: 'hover:border-neon-purple/30',
          badge: 'bg-white/10',
          text: 'text-white/60',
          glow: 'hover:shadow-[0_0_15px_rgba(155,92,255,0.2)]',
          badgeGlow: 'none',
          hex: '#9B5CFF',
        }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-bg-secondary/50 backdrop-blur-sm rounded-xl overflow-hidden group/leaderboard ${className}`}
    >
      {/* Neon border glow */}
      <div className="absolute inset-0 rounded-xl border border-white/10 group-hover/leaderboard:border-yellow-500/30 transition-colors duration-500" />
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover/leaderboard:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: '0 0 40px rgba(234, 179, 8, 0.15), inset 0 0 40px rgba(234, 179, 8, 0.03)',
        }}
      />

      {/* Header */}
      <div className="relative p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Crown icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/30 blur-lg rounded-full" />
              <CrownIcon className="w-7 h-7 text-yellow-400 relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-wider">{title}</h3>
              <p className="text-xs text-white/50">{getPeriodLabel()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`
                  px-3 py-1.5 text-xs font-bold uppercase rounded-lg
                  transition-all duration-300 cursor-pointer
                  ${selectedPeriod === p
                    ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_15px_rgba(155,92,255,0.4)]'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10 hover:border-neon-purple/30'
                  }
                `}
              >
                {p === 'today' ? 'Jour' : p === 'week' ? 'Sem' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard entries */}
      <div key={selectedPeriod} className="relative p-4 space-y-2">
        {displayedEntries.map((entry, index) => {
          const style = getRankStyle(entry.rank)
          return (
            <div
              key={`${selectedPeriod}-${entry.rank}`}
              className={`
                leaderboard-row relative flex items-center gap-4 p-4
                ${style.bg} border ${style.border} ${style.hoverBorder}
                rounded-lg
                ${style.glow}
                transition-all duration-300
                group/row
                ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
              `}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
              }}
            >
              {/* Rank badge with glow */}
              <div
                className={`
                  relative w-10 h-10 rounded-lg ${style.badge}
                  flex items-center justify-center
                  font-black text-lg
                  ${entry.rank <= 3 ? 'text-bg-primary' : 'text-white'}
                  transition-transform duration-300 group-hover/row:scale-110
                `}
                style={{
                  boxShadow: entry.rank <= 3 ? style.badgeGlow : 'none',
                }}
              >
                {entry.rank}
              </div>

              {/* Avatar with glow */}
              <div className="relative group/avatar">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/50 to-neon-pink/50 rounded-lg blur-md opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />
                <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-bold">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Username & wins */}
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate group-hover/row:text-white transition-colors">{entry.username}</div>
                <div className="text-xs text-white/50">{entry.wins} victoires</div>
              </div>

              {/* Total value with glow */}
              <div className="text-right">
                <div
                  className={`font-black ${style.text} transition-all duration-300`}
                  style={{
                    textShadow: entry.rank <= 3 ? `0 0 15px ${style.hex}60` : 'none',
                  }}
                >
                  {entry.totalValue.toLocaleString()}€
                </div>
                <div className="text-xs text-white/40">total</div>
              </div>

              {/* Animated bottom border on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-lg">
                <div
                  className="h-full w-0 group-hover/row:w-full transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${style.hex}, transparent)`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
