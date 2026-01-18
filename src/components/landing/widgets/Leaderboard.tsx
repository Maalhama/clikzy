'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

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

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'ProGamer99', wins: 12, totalValue: 8500 },
  { rank: 2, username: 'LuckyChamp', wins: 8, totalValue: 5200 },
  { rank: 3, username: 'ClickMaster', wins: 6, totalValue: 3800 },
  { rank: 4, username: 'VictoryK', wins: 5, totalValue: 2900 },
  { rank: 5, username: 'NeonKing', wins: 4, totalValue: 2100 },
]

export function Leaderboard({
  entries = MOCK_LEADERBOARD,
  title = 'TOP GAGNANTS',
  period = 'week',
  className = '',
}: LeaderboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.from('.leaderboard-row', {
              x: -30,
              opacity: 0,
              stagger: 0.1,
              duration: 0.5,
              ease: 'power3.out',
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.2 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, { scope: containerRef })

  const getPeriodLabel = () => {
    switch (period) {
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
          badge: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
          text: 'text-yellow-400',
        }
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-400/20 to-transparent',
          border: 'border-gray-400/30',
          badge: 'bg-gradient-to-br from-gray-300 to-gray-500',
          text: 'text-gray-300',
        }
      case 3:
        return {
          bg: 'bg-gradient-to-r from-amber-600/20 to-transparent',
          border: 'border-amber-600/30',
          badge: 'bg-gradient-to-br from-amber-500 to-amber-700',
          text: 'text-amber-500',
        }
      default:
        return {
          bg: '',
          border: 'border-white/5',
          badge: 'bg-white/10',
          text: 'text-white/60',
        }
    }
  }

  return (
    <div ref={containerRef} className={`bg-bg-secondary/30 border border-white/10 clip-angle-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-wider">{title}</h3>
              <p className="text-xs text-white/50">{getPeriodLabel()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['today', 'week', 'month'].map((p) => (
              <button
                key={p}
                className={`
                  px-3 py-1 text-xs font-bold uppercase rounded
                  transition-colors
                  ${period === p
                    ? 'bg-neon-purple text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
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
      <div className="p-4 space-y-2">
        {entries.map((entry) => {
          const style = getRankStyle(entry.rank)
          return (
            <div
              key={entry.rank}
              className={`
                leaderboard-row flex items-center gap-4 p-4
                ${style.bg} border ${style.border}
                rounded-lg
                hover:bg-white/5 transition-colors
              `}
            >
              {/* Rank badge */}
              <div className={`
                w-10 h-10 rounded-lg ${style.badge}
                flex items-center justify-center
                font-black text-lg
                ${entry.rank <= 3 ? 'text-bg-primary' : 'text-white'}
              `}>
                {entry.rank}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-bold">
                {entry.username.charAt(0).toUpperCase()}
              </div>

              {/* Username & wins */}
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{entry.username}</div>
                <div className="text-xs text-white/50">{entry.wins} victoires</div>
              </div>

              {/* Total value */}
              <div className="text-right">
                <div className={`font-black ${style.text}`}>
                  {entry.totalValue.toLocaleString()}€
                </div>
                <div className="text-xs text-white/40">total</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
